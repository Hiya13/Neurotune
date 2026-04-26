import { lerpColor } from '../../../utils/color';

/**
 * Draws the sky gradient + stars based on current altitude zone.
 *
 * Zone 1  0–2000     Dawn          — deep purple / navy
 * Zone 2  2000–5000  Morning       — warm pink / peach
 * Zone 3  5000–9000  Midday        — bright blue
 * Zone 4  9000–14000 High Atmos    — deep azure
 * Zone 5  14000+     Space Edge    — dark indigo + stars
 */

const ZONES = [
  { max:  2000, topA: '#0a0b1e', topB: '#1e1b4b', botA: '#1e1b4b', botB: '#4c1d95' },
  { max:  5000, topA: '#1e1b4b', topB: '#831843', botA: '#4c1d95', botB: '#fb7185' },
  { max:  9000, topA: '#831843', topB: '#0369a1', botA: '#fb7185', botB: '#7dd3fc' },
  { max: 14000, topA: '#0369a1', topB: '#0c4a6e', botA: '#7dd3fc', botB: '#0284c7' },
  { max: 99999, topA: '#0c4a6e', topB: '#030712', botA: '#0284c7', botB: '#1e1b4b' },
];

function getSkyColors(altitude) {
  let low = 0;
  for (const z of ZONES) {
    if (altitude < z.max) {
      const span = z.max - low;
      const progress = Math.min(1, (altitude - low) / span);
      return {
        top: lerpColor(z.topA, z.topB, progress),
        bottom: lerpColor(z.botA, z.botB, progress),
      };
    }
    low = z.max;
  }
  // fallback
  return { top: '#030712', bottom: '#1e1b4b' };
}

// Pre-seed star positions (deterministic)
const STARS = Array.from({ length: 60 }, (_, i) => ({
  x: Math.abs(Math.sin(i * 123.45 + 0.3) * 1000) % 1000,
  y: Math.abs(Math.cos(i * 678.9 + 0.7) * 700) % 700,
  phase: i * 2.1,
}));

export function drawSky(ctx, W, H, altitude) {
  const { top, bottom } = getSkyColors(altitude);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Stars appear above zone 4
  if (altitude > 13000) {
    const alpha = Math.min(0.7, (altitude - 13000) / 5000);
    const now = performance.now();
    STARS.forEach((s) => {
      const twinkle = (Math.sin(now * 0.001 + s.phase) + 1) * 0.5;
      const r = 0.6 + twinkle * 1.2;
      ctx.fillStyle = `rgba(255,255,255,${alpha * (0.4 + twinkle * 0.6)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
