import { useCallback, useEffect, useRef, useState } from 'react';
import useAttentionScore from '../TideController/useAttentionScore';
import useRollingAverage from '../TideController/useRollingAverage';
import FocusFlightIntroModal from './FocusFlightIntroModal';
import FlightHUD from './FlightHUD';
import SessionEnd from './SessionEnd';
import { useFlightPhysics } from './useFlightPhysics';
import { useOrbSpawner } from './useOrbSpawner';
import useAmbientSound from './useAmbientSound';
import { drawSky } from './drawSky';
import { drawBalloon } from './drawBalloon';
import { drawLayers } from './drawLayers';
import { drawOrbs } from './drawOrbs';

const SESSION_MS = 6 * 60 * 1000;   // 6 minutes
const MAX_ALTITUDE = 15000;
const CANVAS_W = 1000;
const CANVAS_H = 700;
const BALLOON_Y = CANVAS_H * 0.62;  // fixed vertical position

function getZone(alt) {
  if (alt < 2000)  return 'Dawn';
  if (alt < 5000)  return 'Morning';
  if (alt < 9000)  return 'Midday';
  if (alt < 14000) return 'High Atmosphere';
  return 'Space Edge';
}

export default function FocusFlight({
  wsUrl = 'ws://localhost:8080',
  onExit,
}) {
  // ── EEG hooks ─────────────────────────────────
  const [simulatorProfile, setSimulatorProfile] = useState(null);
  const { rawScore, connectionState, isSimulated, isReconnecting, phase: simPhase, profileName: simProfileName } =
    useAttentionScore(wsUrl, simulatorProfile);
  const smoothedScore = useRollingAverage(rawScore, 3000);

  // ── UI state ──────────────────────────────────
  const [modalOpen, setModalOpen]     = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isMuted, setIsMuted]         = useState(true);

  // ── Refs ──────────────────────────────────────
  const canvasRef       = useRef(null);
  const containerRef    = useRef(null);
  const sessionStartRef = useRef(null);
  const scoreHistoryRef = useRef([]);
  const altHistoryRef   = useRef([]);
  const rafRef          = useRef(null);
  const scaledRef       = useRef(false); // guard DPR scaling

  const isPaused = modalOpen || sessionEnded;

  // ── Physics & orbs ────────────────────────────
  const physics = useFlightPhysics(smoothedScore, isPaused);
  const orbSpawner = useOrbSpawner(
    smoothedScore,
    physics.balloonXRef,
    BALLOON_Y,
    isPaused,
  );

  // ── Audio ─────────────────────────────────────
  const { initAudio } = useAmbientSound(smoothedScore, isMuted || isPaused);

  // ── Session timer does NOT start until modal dismissed ──
  useEffect(() => {
    if (modalOpen || sessionEnded) return;
    sessionStartRef.current = Date.now();
  }, [modalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── History sampling (every 500ms) ────────────
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      scoreHistoryRef.current.push(smoothedScore);
      altHistoryRef.current.push(Math.floor(physics.altitudeRef.current));

      // Check time limit
      const elapsed = Date.now() - sessionStartRef.current;
      if (elapsed >= SESSION_MS) setSessionEnded(true);
    }, 500);
    return () => clearInterval(id);
  }, [isPaused, smoothedScore, physics.altitudeRef]);

  // ── Canvas DPR scaling (once) ─────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || scaledRef.current) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    scaledRef.current = true;
  }, []);

  // ── Main render loop (rAF) ────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const frame = () => {
      // Step physics + orbs
      physics.step();
      const alt = physics.altitudeRef.current;
      orbSpawner.step(alt);

      // Check max altitude
      if (alt >= MAX_ALTITUDE && !sessionEnded) {
        setSessionEnded(true);
      }

      // ── Draw ────────────────────────────────
      // 1. Sky
      drawSky(ctx, CANVAS_W, CANVAS_H, alt);

      // 2. Parallax layers (returns turbulence zones)
      const turbZones = drawLayers(ctx, CANVAS_W, CANVAS_H, alt);

      // 3. Turbulence collision check
      const bx = physics.balloonXRef.current;
      let inTurb = false;
      for (const zone of turbZones) {
        const dx = zone.x - bx;
        const dy = zone.y - BALLOON_Y;
        if (Math.sqrt(dx * dx + dy * dy) < 60) {
          inTurb = true;
          break;
        }
      }
      physics.setInTurbulence(inTurb);

      // 4. Orbs
      drawOrbs(ctx, orbSpawner.orbsRef, orbSpawner.particlesRef, orbSpawner.flashRef, alt);

      // 5. Balloon
      drawBalloon(
        ctx,
        bx,
        BALLOON_Y,
        physics.rotationRef.current,
        smoothedScore,
      );

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [smoothedScore, physics, orbSpawner, sessionEnded]);

  // ── Responsive canvas scaling ─────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resize = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scale = Math.min(cw / CANVAS_W, ch / CANVAS_H, 1);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.width  = `${CANVAS_W * scale}px`;
        canvas.style.height = `${CANVAS_H * scale}px`;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Handlers ──────────────────────────────────
  const handleStart = useCallback(() => {
    initAudio();
    setModalOpen(false);
  }, [initAudio]);

  const handlePlayAgain = useCallback(() => {
    // Reset everything
    physics.altitudeRef.current = 0;
    physics.velocityRef.current = 0;
    physics.timeRef.current = 0;
    orbSpawner.reset();
    scoreHistoryRef.current = [];
    altHistoryRef.current = [];
    setSessionEnded(false);
    setModalOpen(true);
    // Re-scale canvas
    scaledRef.current = false;
  }, [physics, orbSpawner]);

  // ── Timer label ───────────────────────────────
  const elapsed =
    sessionStartRef.current && !modalOpen
      ? Date.now() - sessionStartRef.current
      : 0;
  const remaining = Math.max(0, SESSION_MS - elapsed);
  const mm = String(Math.floor(remaining / 60000)).padStart(2, '0');
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
  const timerLabel = `${mm}:${ss}`;

  const currentAlt = physics.altitudeRef.current;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[70] bg-[#05060f] overflow-hidden flex items-center justify-center font-sans select-none"
    >
      <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
        <canvas
          ref={canvasRef}
          className="block"
          style={{ width: CANVAS_W, height: CANVAS_H }}
        />

        {/* HUD overlay */}
        {!modalOpen && !sessionEnded && (
          <FlightHUD
            altitude={currentAlt}
            orbs={orbSpawner.orbCountRef.current}
            score={smoothedScore}
            zone={getZone(currentAlt)}
            timerLabel={timerLabel}
            isMuted={isMuted}
            isSimulated={isSimulated}
            isReconnecting={isReconnecting}
            simPhase={simPhase}
            simProfileName={simProfileName}
            onToggleMute={() => setIsMuted((m) => !m)}
            onExit={onExit}
          />
        )}
      </div>

      {/* Intro modal */}
      {modalOpen && (
        <FocusFlightIntroModal
          onStart={handleStart}
          isDemo={isSimulated}
          simulatorProfile={simulatorProfile}
          onProfileSelect={setSimulatorProfile}
        />
      )}

      {/* Session end */}
      {sessionEnded && (
        <SessionEnd
          altitudeHistory={altHistoryRef.current}
          scoreHistory={scoreHistoryRef.current}
          maxAltitude={Math.floor(currentAlt)}
          orbsCollected={orbSpawner.orbCountRef.current}
          zoneReached={getZone(currentAlt)}
          sessionDurationMs={elapsed}
          onPlayAgain={handlePlayAgain}
          onExit={onExit}
        />
      )}
    </div>
  );
}
