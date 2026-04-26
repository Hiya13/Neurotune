import { useEffect, useLayoutEffect, useRef } from 'react';
import { SCENE_HEIGHT, SCENE_WIDTH } from './artifacts.js';

export function tideBaseSurfaceY(score, sceneH = SCENE_HEIGHT) {
  const s = Math.min(100, Math.max(0, score));
  return sceneH * (0.1 + 0.8 * (s / 100));
}

export function waveOffsetAt(x, tMs) {
  const t = tMs * 0.001;
  return (
    8 * Math.sin(x * 0.018 + t * 2.1) +
    5 * Math.sin(x * 0.031 + t * 1.7 + 0.8)
  );
}

function buildWaterPath(baseY, tMs, w = SCENE_WIDTH, h = SCENE_HEIGHT) {
  const segments = 48;
  let d = '';
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * w;
    const y = baseY + waveOffsetAt(x, tMs);
    d += i === 0 ? `M 0 ${y}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  d += ` L ${w} ${h} L 0 ${h} Z`;
  return d;
}

function buildFoamPath(baseY, tMs, w = SCENE_WIDTH) {
  const segments = 48;
  let d = '';
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * w;
    const y = baseY + waveOffsetAt(x, tMs);
    d += i === 0 ? `M 0 ${y}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

/**
 * Clip-masked water body from animated sine surface to scene bottom.
 * Score-driven fill colors via inline styles (updated every frame in rAF).
 */
export default function WaterLayer({
  smoothedScore,
  running,
  onFrame,
  clipId = 'tide-water-clip',
}) {
  const pathRef = useRef(null);
  const foamRef = useRef(null);
  const fillRef = useRef(null);
  const rafRef = useRef(0);
  const scoreRef = useRef(smoothedScore);
  scoreRef.current = smoothedScore;
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const paintFrame = (now) => {
    const baseY = tideBaseSurfaceY(scoreRef.current);
    const path = buildWaterPath(baseY, now);
    const foam = buildFoamPath(baseY, now);
    if (pathRef.current) pathRef.current.setAttribute('d', path);
    if (foamRef.current) foamRef.current.setAttribute('d', foam);
    const s = Math.min(100, Math.max(0, scoreRef.current));
    const deep = { r: 6, g: 78, b: 92 };
    const light = { r: 110, g: 220, b: 210 };
    const mix = (a, b, t) => Math.round(a + (b - a) * t);
    const tr = s / 100;
    if (fillRef.current) {
      fillRef.current.style.fill = `rgb(${mix(deep.r, light.r, tr)},${mix(
        deep.g,
        light.g,
        tr
      )},${mix(deep.b, light.b, tr)})`;
      fillRef.current.style.opacity = String(0.78 + 0.12 * tr);
    }
  };

  useLayoutEffect(() => {
    if (!running) return;
    paintFrame(performance.now());
  }, [running, smoothedScore]);

  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      return;
    }

    const step = (now) => {
      paintFrame(now);
      onFrameRef.current?.(now);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [running]);

  const s = Math.min(100, Math.max(0, smoothedScore));
  const tr = s / 100;
  const cr = Math.round(6 + (110 - 6) * tr);
  const cg = Math.round(78 + (220 - 78) * tr);
  const cb = Math.round(92 + (210 - 92) * tr);

  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <path
            ref={pathRef}
            d={`M 0 ${SCENE_HEIGHT} L ${SCENE_WIDTH} ${SCENE_HEIGHT} L ${SCENE_WIDTH} ${SCENE_HEIGHT} L 0 ${SCENE_HEIGHT} Z`}
          />
        </clipPath>
      </defs>
      <rect
        ref={fillRef}
        x={0}
        y={0}
        width={SCENE_WIDTH}
        height={SCENE_HEIGHT}
        clipPath={`url(#${clipId})`}
        style={{
          fill: `rgb(${cr},${cg},${cb})`,
          opacity: 0.78 + 0.12 * tr,
        }}
      />
      <path
        ref={foamRef}
        d={`M 0 ${SCENE_HEIGHT} L ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeDasharray="6 10"
        style={{
          animation: 'tideFoamDash 2.8s linear infinite',
        }}
      />
    </>
  );
}
