import { lerpColor } from '../../../utils/color';

/**
 * Draws the hot-air balloon on the canvas via Canvas 2D.
 *
 * Envelope: 48×60 ellipse, color lerps brown→amber→gold with score.
 * 6 vertical stripes, 4 rope lines, basket with crosshatch,
 * flame glow inside envelope top, gentle sway rotation.
 */
export function drawBalloon(ctx, bx, by, rotation, smoothedScore) {
  const t = smoothedScore / 100;

  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate((rotation * Math.PI) / 180);

  // ── Envelope color interpolation ──────────────
  let envColor;
  if (t <= 0.5) {
    envColor = lerpColor('#8b5a2b', '#f5a623', t * 2);
  } else {
    envColor = lerpColor('#f5a623', '#ffd700', (t - 0.5) * 2);
  }

  // ── 1. Envelope (filled ellipse) ──────────────
  ctx.beginPath();
  ctx.ellipse(0, -30, 24, 30, 0, 0, Math.PI * 2);
  ctx.fillStyle = envColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── 2. Vertical stripes (6) ───────────────────
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 3; i++) {
    const sx = i * 7;
    ctx.beginPath();
    ctx.moveTo(sx, -60);
    ctx.quadraticCurveTo(sx * 1.3, -30, sx, 0);
    ctx.stroke();
  }

  // ── 3. Flame glow ─────────────────────────────
  const flameR = 8 + t * 6;
  const flameAlpha = 0.4 + t * 0.5;
  const flameGrad = ctx.createRadialGradient(0, -8, 0, 0, -8, flameR);
  flameGrad.addColorStop(0, `rgba(255,180,50,${flameAlpha})`);
  flameGrad.addColorStop(0.6, `rgba(255,100,0,${flameAlpha * 0.4})`);
  flameGrad.addColorStop(1, 'rgba(255,69,0,0)');
  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.arc(0, -8, flameR, 0, Math.PI * 2);
  ctx.fill();

  // ── 4. Rope lines (4 — corners of basket to envelope) ──
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 1.2;
  // left outer
  ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-10, 12); ctx.stroke();
  // left inner
  ctx.beginPath(); ctx.moveTo(-8, 0);  ctx.lineTo(-6, 12);  ctx.stroke();
  // right inner
  ctx.beginPath(); ctx.moveTo(8, 0);   ctx.lineTo(6, 12);   ctx.stroke();
  // right outer
  ctx.beginPath(); ctx.moveTo(18, 0);  ctx.lineTo(10, 12);  ctx.stroke();

  // ── 5. Basket ─────────────────────────────────
  const bW = 24, bH = 14;
  const bxOff = -bW / 2, byOff = 12;
  ctx.fillStyle = '#8b6914';
  ctx.beginPath();
  ctx.roundRect(bxOff, byOff, bW, bH, 3);
  ctx.fill();

  // Basket weave
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 0.8;
  for (let r = 1; r < 3; r++) {
    ctx.beginPath();
    ctx.moveTo(bxOff, byOff + r * 5);
    ctx.lineTo(bxOff + bW, byOff + r * 5);
    ctx.stroke();
  }
  for (let c = 1; c < 3; c++) {
    ctx.beginPath();
    ctx.moveTo(bxOff + c * 8, byOff);
    ctx.lineTo(bxOff + c * 8, byOff + bH);
    ctx.stroke();
  }

  ctx.restore();
}
