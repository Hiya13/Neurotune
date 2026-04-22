import { useCallback, useEffect, useRef, useState } from 'react';
import { ARTIFACTS, SCENE_HEIGHT, SCENE_WIDTH } from './artifacts.js';
import useAttentionScore from './useAttentionScore.js';
import useRollingAverage from './useRollingAverage.js';
import SceneCanvas from './SceneCanvas.jsx';
import WaterLayer from './WaterLayer.jsx';
import ArtifactSpot from './ArtifactSpot.jsx';
import FocusGauge from './FocusGauge.jsx';
import ArtifactCard from './ArtifactCard.jsx';
import SessionEnd from './SessionEnd.jsx';
import TideIntroModal from './TideIntroModal.jsx';
import DemoBadge from '../shared/DemoBadge';

const DEFAULT_SESSION_MS = 5 * 60 * 1000;
const DEFAULT_WS = 'ws://localhost:8080';

export default function TideController({
  sessionDurationMs = DEFAULT_SESSION_MS,
  wsUrl = DEFAULT_WS,
  onExit,
}) {
  const [simulatorProfile, setSimulatorProfile] = useState(null);
  const { rawScore, connectionState, isReconnecting, isSimulated, phase: simPhase, profileName: simProfileName } = useAttentionScore(wsUrl, simulatorProfile);
  const smoothedScore = useRollingAverage(rawScore, 3000);

  const [tabVisible, setTabVisible] = useState(
    typeof document !== 'undefined' ? !document.hidden : true
  );
  const [sessionKey, setSessionKey] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [discoveries, setDiscoveries] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [card, setCard] = useState(null);
  const [modalOpen, setModalOpen] = useState(true);

  const sessionStartRef = useRef(Date.now());
  const smoothRef = useRef(0);
  const tideHistoryRef = useRef([]);

  smoothRef.current = smoothedScore;

  const sessionActive = !sessionEnded;

  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Reset session start time once modal is dismissed
  useEffect(() => {
    if (!modalOpen) {
      sessionStartRef.current = Date.now();
    }
  }, [modalOpen]);

  useEffect(() => {
    if (!sessionActive || modalOpen) return;
    const id = window.setInterval(() => {
      const v = smoothRef.current;
      tideHistoryRef.current.push(v);
      if (tideHistoryRef.current.length > 400) tideHistoryRef.current.shift();
    }, 400);
    return () => clearInterval(id);
  }, [sessionActive, sessionKey, modalOpen]);

  useEffect(() => {
    if (!sessionActive) return;
    if (discoveries.length >= 6) setSessionEnded(true);
  }, [discoveries.length, sessionActive]);

  useEffect(() => {
    if (!sessionActive || modalOpen) return;
    const id = window.setInterval(() => {
      const elapsed = Date.now() - sessionStartRef.current;
      if (elapsed >= sessionDurationMs) setSessionEnded(true);
    }, 400);
    return () => clearInterval(id);
  }, [sessionActive, sessionDurationMs, sessionKey, modalOpen]);

  const handleUnlocked = useCallback((entry) => {
    setDiscoveries((prev) => {
      if (prev.some((d) => d.id === entry.id)) return prev;
      return [...prev, entry];
    });
  }, []);

  const handleOpenCard = useCallback(
    (artifact) => {
      const d = discoveries.find((x) => x.id === artifact.id);
      setCard({
        artifact,
        discoveredAt: d?.discoveredAt || new Date().toISOString(),
      });
    },
    [discoveries]
  );

  const handlePlayAgain = useCallback(() => {
    setSessionEnded(false);
    setDiscoveries([]);
    setCard(null);
    setDrawerOpen(false);
    tideHistoryRef.current = [];
    sessionStartRef.current = Date.now();
    setSessionKey((k) => k + 1);
  }, []);

  const openDiscoveriesItem = useCallback((d) => {
    setCard({
      artifact: d,
      discoveredAt: d.discoveredAt,
    });
    setDrawerOpen(false);
  }, []);

  const elapsed = Date.now() - sessionStartRef.current;
  const remainingMs = Math.max(0, sessionDurationMs - elapsed);
  const mm = Math.floor(remainingMs / 60000);
  const ss = Math.floor((remainingMs % 60000) / 1000);
  const timerLabel = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

  const historySnapshot = [...tideHistoryRef.current];
  const avgFocus = historySnapshot.length
    ? historySnapshot.reduce((a, b) => a + b, 0) / historySnapshot.length
    : smoothedScore;

  return (
    <div className="fixed inset-0 z-[70] bg-[#0a1218] overflow-hidden flex flex-col">
      <style>{`
        @keyframes tideCloudDriftA {
          from { transform: translateX(-30px); }
          to { transform: translateX(30px); }
        }
        @keyframes tideCloudDriftB {
          from { transform: translateX(25px); }
          to { transform: translateX(-25px); }
        }
        @keyframes tideCloudDriftC {
          from { transform: translateX(-18px); }
          to { transform: translateX(42px); }
        }
        .tide-cloud-slow { animation: tideCloudDriftA 78s ease-in-out infinite alternate; }
        .tide-cloud-mid { animation: tideCloudDriftB 52s ease-in-out infinite alternate; }
        .tide-cloud-fast { animation: tideCloudDriftC 34s ease-in-out infinite alternate; }
        @keyframes tideFoamDash {
          to { stroke-dashoffset: -96; }
        }
        @keyframes tideParticle {
          to {
            transform: translate(var(--tx, 0px), var(--ty, 0px));
            opacity: 0;
          }
        }
        .tide-particle {
          transform-box: fill-box;
          transform-origin: center;
          animation: tideParticle 0.85s ease-out forwards;
        }
        @keyframes tideRipple {
          0% { transform: scale(0.5); opacity: 0.7; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        .tide-ripple {
          transform-box: fill-box;
          transform-origin: center;
          animation: tideRipple 0.95s ease-out forwards;
        }
      `}</style>

      <div className="relative flex-1 min-h-0">
        <svg
          className="absolute inset-0 w-full h-full block"
          viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <SceneCanvas />
          <g key={sessionKey}>
            {ARTIFACTS.map((a) => (
              <ArtifactSpot
                key={a.id}
                artifact={a}
                smoothedScore={smoothedScore}
                sessionActive={sessionActive}
                onUnlocked={handleUnlocked}
                onOpenCard={handleOpenCard}
              />
            ))}
          </g>
          <WaterLayer smoothedScore={smoothedScore} running={tabVisible && sessionActive && !modalOpen} />
        </svg>

        {modalOpen && (
          <TideIntroModal
            onStart={() => setModalOpen(false)}
            isDemo={isSimulated}
            simulatorProfile={simulatorProfile}
            onProfileSelect={setSimulatorProfile}
          />
        )}

        <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-3 sm:p-4 pointer-events-none">
          <div className="pointer-events-auto glass-panel rounded-xl px-3 py-2 border border-white/10">
            <FocusGauge score={smoothedScore} />
          </div>

          <div className="flex flex-col items-end gap-2 pointer-events-auto">
            <DemoBadge isSimulated={isSimulated} phase={simPhase} profileName={simProfileName} />
            <div className="flex items-center gap-2">
              <div className="glass-panel rounded-lg px-3 py-2 border border-white/10 text-sm tabular-nums text-teal-100">
                {timerLabel}
              </div>
              <div className="glass-panel rounded-lg px-3 py-2 border border-white/10 text-sm text-teal-100">
                <span className="text-slate-400 mr-1">Artifacts</span>
                <span className="font-semibold">{discoveries.length}/6</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="glass-panel rounded-lg px-3 py-2 border border-teal-500/30 text-sm text-teal-200 hover:bg-teal-900/20"
              >
                Discoveries
              </button>
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="glass-panel rounded-lg px-3 py-2 border border-white/10 text-sm text-slate-300 hover:text-white"
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        </div>

        {drawerOpen && (
          <div
            className="absolute inset-0 z-[120] flex justify-end bg-black/40"
            onClick={() => setDrawerOpen(false)}
            role="presentation"
          >
            <div
              className="w-full max-w-sm h-full bg-slate-900/98 border-l border-teal-500/20 shadow-2xl p-5 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-teal-200">Discoveries</h3>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Close
                </button>
              </div>
              {discoveries.length === 0 ? (
                <p className="text-slate-500 text-sm">No artifacts yet. Keep your focus steady.</p>
              ) : (
                <ul className="space-y-2">
                  {discoveries.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => openDiscoveriesItem(d)}
                        className="w-full text-left rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 hover:border-teal-500/40 transition-colors"
                      >
                        <div className="text-teal-200 font-medium">{d.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(d.discoveredAt).toLocaleString()}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {card && (
        <ArtifactCard
          artifact={card.artifact}
          discoveredAt={card.discoveredAt}
          onClose={() => setCard(null)}
        />
      )}

      {sessionEnded && (
        <SessionEnd
          tideHistory={historySnapshot}
          artifactsFound={discoveries.length}
          averageFocus={avgFocus}
          sessionDurationMs={sessionDurationMs}
          onPlayAgain={handlePlayAgain}
          onExit={onExit}
        />
      )}
    </div>
  );
}
