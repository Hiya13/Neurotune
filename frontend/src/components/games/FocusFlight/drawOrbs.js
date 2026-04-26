/**
 * Draws focus orbs (world-space Y converted to screen-space) and particle effects.
 */
export function drawOrbs(ctx, orbsRef, particlesRef, flashRef, altitude) {
  const now = performance.now();

  // ── 1. Orbs ───────────────────────────────────
  const BALLOON_Y = 700 * 0.62; // Sync with FocusFlight.jsx
  orbsRef.current.forEach((orb) => {
    // Correct world-to-screen: things above us (orb.worldY > altitude)
    // have screenY < BALLOON_Y
    const screenY = BALLOON_Y - (orb.worldY - altitude);
    if (screenY < -50 || screenY > 800) return;

    const { x, radius } = orb;
    const age = (now - orb.spawnTime) * 0.001;

    // Outer glow pulse
    const pulse = (Math.sin(age * 4) + 1) * 2;
    const outerR = radius + pulse;
    const grad = ctx.createRadialGradient(x, screenY, 0, x, screenY, outerR + 4);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.4, 'rgba(255,215,0,0.7)');
    grad.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, screenY, outerR + 4, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x, screenY, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Expanding ring pulse
    const ringT = (now % 1200) / 1200;
    const ringR = radius + ringT * 18;
    const ringAlpha = (1 - ringT) * 0.6;
    ctx.strokeStyle = `rgba(255,215,0,${ringAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, screenY, ringR, 0, Math.PI * 2);
    ctx.stroke();
  });

  // ── 2. Collection flash ───────────────────────
  if (flashRef.current) {
    const { x, y, startTime } = flashRef.current;
    const elapsed = now - startTime;
    const progress = elapsed / 400;
    if (progress < 1) {
      const r = 15 + progress * 30;
      const alpha = (1 - progress) * 0.6;
      ctx.fillStyle = `rgba(255,215,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── 3. Particles ──────────────────────────────
  particlesRef.current.forEach((p) => {
    ctx.fillStyle = `rgba(255,215,0,${p.life})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  });
}
