import { useEffect, useRef, useState } from 'react';
import { SCENE_HEIGHT } from './artifacts.js';
import { tideBaseSurfaceY, waveOffsetAt } from './WaterLayer.jsx';

const UNLOCK_MS = 4000;
const REVEAL_MS = 600;

function ParticleBurst({ cx, cy, active }) {
  if (!active) return null;
  const n = 11;
  const parts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.2;
    const dist = 28 + (i % 4) * 6;
    parts.push(
      <circle
        key={i}
        className="tide-particle"
        cx={cx}
        cy={cy}
        r={2.2 + (i % 3) * 0.4}
        fill="rgba(200,255,250,0.85)"
        style={{
          '--tx': `${Math.cos(a) * dist}px`,
          '--ty': `${Math.sin(a) * dist}px`,
        }}
      />
    );
  }
  return <g>{parts}</g>;
}

export default function ArtifactSpot({
  artifact,
  smoothedScore,
  sessionActive,
  onUnlocked,
  onOpenCard,
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [revealScale, setRevealScale] = useState(0.5);
  const [particles, setParticles] = useState(false);
  const [underwater, setUnderwater] = useState(true);
  const [ripple, setRipple] = useState(0);

  const accumRef = useRef(0);
  const lastTRef = useRef(null);
  const prevUnderRef = useRef(true);
  const unlockedRef = useRef(false);
  const rafUnlockRef = useRef(0);

  const baseY = tideBaseSurfaceY(smoothedScore, SCENE_HEIGHT);
  const eligible =
    sessionActive &&
    smoothedScore > artifact.threshold &&
    baseY > artifact.y - 1;

  useEffect(() => {
    if (!sessionActive) return;

    const tick = (now) => {
      if (unlockedRef.current) return;

      if (lastTRef.current == null) lastTRef.current = now;
      const dt = Math.min(80, now - lastTRef.current);
      lastTRef.current = now;

      if (eligible) accumRef.current += dt;
      else accumRef.current = 0;

      if (accumRef.current >= UNLOCK_MS) {
        unlockedRef.current = true;
        setUnlocked(true);
        setRevealing(true);
        setRevealScale(0.5);
        setParticles(true);
        const discoveredAt = new Date().toISOString();
        onUnlocked?.({ ...artifact, discoveredAt });
        requestAnimationFrame(() => setRevealScale(1));
        window.setTimeout(() => setRevealing(false), REVEAL_MS);
        window.setTimeout(() => setParticles(false), 900);
        return;
      }

      rafUnlockRef.current = requestAnimationFrame(tick);
    };

    rafUnlockRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafUnlockRef.current);
      lastTRef.current = null;
    };
  }, [eligible, sessionActive, artifact, onUnlocked]);

  useEffect(() => {
    if (!sessionActive) return;
    let raf;
    const loop = (now) => {
      const surface = baseY + waveOffsetAt(artifact.x, now);
      const u = artifact.y > surface;
      setUnderwater(u);
      if (unlockedRef.current && !prevUnderRef.current && u) {
        setRipple((k) => k + 1);
      }
      prevUnderRef.current = u;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [artifact.x, artifact.y, baseY, sessionActive]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!unlocked) return;
    onOpenCard?.(artifact);
  };

  const scale = unlocked ? revealScale : 0.5;
  const revealTransition = revealing || unlocked
    ? 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease'
    : 'opacity 0.35s ease';

  const glowOpacity = unlocked ? (underwater ? 0.35 : 0.95) : 0.22;

  return (
    <g
      className="cursor-pointer"
      style={{ pointerEvents: unlocked ? 'auto' : 'none' }}
      onClick={handleClick}
    >
      <circle
        cx={artifact.x}
        cy={artifact.y}
        r={22}
        fill={`rgba(120, 230, 220, ${glowOpacity * 0.15})`}
        stroke={`rgba(180, 255, 245, ${glowOpacity * 0.5})`}
        strokeWidth={1.2}
        style={{ transition: 'stroke 0.4s ease, fill 0.4s ease' }}
      />
      {ripple > 0 && (
        <g key={ripple} transform={`translate(${artifact.x} ${artifact.y})`}>
          <circle
            cx={0}
            cy={0}
            r={16}
            fill="none"
            stroke="rgba(160,240,255,0.45)"
            strokeWidth={2}
            className="tide-ripple"
          />
        </g>
      )}
      <ParticleBurst cx={artifact.x} cy={artifact.y} active={particles} />
      <g
        style={{
          transform: `scale(${scale})`,
          transformOrigin: `${artifact.x}px ${artifact.y}px`,
          opacity: unlocked ? (underwater ? 0.55 : 1) : 0.35,
          transition: revealTransition,
        }}
      >
        <text
          x={artifact.x}
          y={artifact.y + 6}
          textAnchor="middle"
          fill="rgba(255,250,235,0.95)"
          fontSize="26"
          style={{ userSelect: 'none' }}
        >
          {artifact.glyph}
        </text>
      </g>
    </g>
  );
}
