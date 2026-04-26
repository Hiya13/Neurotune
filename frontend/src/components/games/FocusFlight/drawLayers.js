/**
 * Parallax background layers drawn each frame.
 *
 * Layer 1 (factor 0.1):  distant mountain silhouettes
 * Layer 2 (factor 0.25): mid-distance clouds (large, fluffy)
 * Layer 3 (factor 0.5):  near clouds (smaller, faster — some are turbulence zones)
 * Layer 4 (factor 1.0):  foreground birds (zones 1–3 only)
 *
 * Returns an array of turbulence-cloud screen rects for collision checks.
 */

// ── Deterministic seeds ─────────────────────────────────
const MOUNTAIN_SEEDS = Array.from({ length: 8 }, (_, i) => ({
  xFrac: i / 8,
  height: 60 + Math.sin(i * 3.7) * 30,
  cpOffset: Math.sin(i * 5.1) * 40,
}));

const CLOUD_SEEDS_L2 = Array.from({ length: 5 }, (_, i) => ({
  xBase: (Math.sin(i * 456.7 + 1.2) * 0.5 + 0.5),
  ySpacing: 350 + i * 60,
  size: 100 + Math.sin(i * 2.3) * 30,
}));

const CLOUD_SEEDS_L3 = Array.from({ length: 5 }, (_, i) => ({
  xBase: (Math.cos(i * 321.4 + 0.8) * 0.5 + 0.5),
  ySpacing: 280 + i * 55,
  size: 60 + Math.sin(i * 1.9) * 20,
  isTurbulence: i < 3, // first 3 are turbulence zones
}));

const BIRD_SEEDS = Array.from({ length: 5 }, (_, i) => ({
  xBase: (Math.cos(i * 123 + 0.5) * 0.5 + 0.5),
  ySpacing: 300 + i * 150,
  phase: i * 1.3,
}));

// ── Zone-dependent colors ───────────────────────────────
function getMountainColor(altitude) {
  if (altitude < 2000) return 'rgba(30,27,75,0.7)';
  if (altitude < 5000) return 'rgba(76,29,149,0.5)';
  if (altitude < 9000) return 'rgba(3,105,161,0.4)';
  if (altitude < 14000) return 'rgba(12,74,110,0.3)';
  return 'rgba(3,7,18,0.25)';
}

/**
 * @returns {{ x: number, y: number, r: number }[]}  turbulence cloud center-points in screen-space
 */
export function drawLayers(ctx, W, H, altitude) {
  const turbulenceZones = [];

  // ── Layer 1: Mountains (parallax 0.1) ──────────
  const mtOffset = altitude * 0.1;
  const mtSink = Math.min(H * 0.4, altitude * 0.05); // Mountains sink as we rise
  ctx.fillStyle = getMountainColor(altitude);
  ctx.beginPath();
  ctx.moveTo(0, H);

  MOUNTAIN_SEEDS.forEach((seed, i) => {
    const x = seed.xFrac * W;
    const baseY = (H - seed.height) + mtSink;
    const yOff = Math.sin((x + mtOffset) * 0.003) * 25;
    if (i === 0) {
      ctx.lineTo(0, baseY + yOff);
    }
    const cpX = x + W / 16 + seed.cpOffset * 0.3;
    const cpY = baseY + yOff - 35;
    const nextX = (i + 1) < MOUNTAIN_SEEDS.length
      ? MOUNTAIN_SEEDS[i + 1].xFrac * W
      : W;
    ctx.quadraticCurveTo(cpX, cpY, nextX, baseY + Math.sin((nextX + mtOffset) * 0.003) * 25);
  });

  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // ── Layer 2: Mid clouds (parallax 0.25) ────────
  if (altitude < 10000) {
    const cloudAlpha = altitude < 8000 ? 0.55 : 0.55 * (1 - (altitude - 8000) / 2000);
    const cOffset = altitude * 0.25;
    ctx.fillStyle = `rgba(255,255,255,${cloudAlpha})`;

    CLOUD_SEEDS_L2.forEach((c) => {
      const x = c.xBase * W;
      // y increases as altitude increases -> cloud moves down
      const y = ((c.ySpacing + cOffset) % (H + 200)) - 100;
      drawFluffyCloud(ctx, x, y, c.size);
    });
  }

  // ── Layer 3: Near clouds / turbulence (parallax 0.5) ──
  if (altitude < 12000) {
    const cOffset = altitude * 0.5;
    CLOUD_SEEDS_L3.forEach((c) => {
      const x = c.xBase * W;
      const y = ((c.ySpacing + cOffset) % (H + 200)) - 100;

      if (c.isTurbulence) {
        // Darker tint for turbulence clouds
        ctx.fillStyle = 'rgba(180,190,200,0.35)';
        drawFluffyCloud(ctx, x, y, c.size);
        turbulenceZones.push({ x, y, r: c.size * 0.8 });
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        drawFluffyCloud(ctx, x, y, c.size);
      }
    });
  }

  // ── Layer 4: Birds (parallax 1.0, zones 1–3) ──
  if (altitude < 9000) {
    const bOffset = altitude * 1.0;
    const now = performance.now();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.5;

    BIRD_SEEDS.forEach((b) => {
      const x = b.xBase * W;
      const y = ((b.ySpacing + bOffset) % (H + 200)) - 100;
      const wing = Math.sin(now * 0.005 + b.phase) * 8;
      ctx.beginPath();
      ctx.moveTo(x - 12, y + wing);
      ctx.lineTo(x, y);
      ctx.lineTo(x + 12, y + wing);
      ctx.stroke();
    });
  }

  return turbulenceZones;
}

function drawFluffyCloud(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, size, size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + size * 0.45, cy + size * 0.15, size * 0.7, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.35, cy + size * 0.1, size * 0.6, size * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
}
