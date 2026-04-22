import { useRef, useCallback } from 'react';

const MAX_ORBS = 12;
const COLLECT_RADIUS = 40;

/**
 * Manages Focus Orb lifecycle: spawning, movement, collection, and particles.
 * Uses refs for rAF-safe access; step() called per frame.
 */
export function useOrbSpawner(smoothedScore, balloonXRef, balloonYVal, isPaused) {
  const orbsRef      = useRef([]);
  const particlesRef = useRef([]);
  const orbCountRef  = useRef(0);
  const lastSpawnRef = useRef(0);
  const flashRef     = useRef(null); // { x, y, startTime }

  const step = useCallback((altitude) => {
    if (isPaused) return;

    const now = performance.now();

    // ── 1. Spawning ─────────────────────────────
    const spawnInterval = Math.max(600, (3 - smoothedScore / 50) * 1000);
    if (
      now - lastSpawnRef.current > spawnInterval &&
      orbsRef.current.length < MAX_ORBS
    ) {
      orbsRef.current.push({
        id: now + Math.random(),
        x: 80 + Math.random() * 840,
        worldY: altitude + 800, // Still spawn "ahead" in world altitude
        radius: 10,
        spawnTime: now,
      });
      lastSpawnRef.current = now;
    }

    // ── 2. Movement & collection ────────────────
    const bx = balloonXRef.current;
    const by = balloonYVal; // CANVAS_H * 0.62 approx 434
    const nextOrbs = [];

    orbsRef.current.forEach((orb) => {
      // Correct world altitude to screen Y transformation
      // If orb.worldY > altitude, it is above us (smaller screen Y)
      const screenY = by - (orb.worldY - altitude);

      // Check collection distance
      const dx = orb.x - bx;
      const dy = screenY - by;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < COLLECT_RADIUS) {
        // Collected
        orbCountRef.current += 1;
        spawnParticles(orb.x, screenY);
        flashRef.current = { x: orb.x, y: screenY, startTime: now };
      } else if (screenY > -100 && screenY < 850) {
        // Still on screen
        nextOrbs.push(orb);
      }
      // Off-screen above or below (after timeout/traversal): discard
    });

    orbsRef.current = nextOrbs;

    // ── 3. Particles ────────────────────────────
    const nextP = [];
    particlesRef.current.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.025;
      if (p.life > 0) nextP.push(p);
    });
    particlesRef.current = nextP;

    // Clear old flash
    if (flashRef.current && now - flashRef.current.startTime > 400) {
      flashRef.current = null;
    }
  }, [smoothedScore, balloonXRef, balloonYVal, isPaused]);

  function spawnParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * (2 + Math.random() * 2),
        vy: Math.sin(angle) * (2 + Math.random() * 2),
        life: 1,
        size: 2 + Math.random() * 3,
      });
    }
  }

  const reset = useCallback(() => {
    orbsRef.current = [];
    particlesRef.current = [];
    orbCountRef.current = 0;
    lastSpawnRef.current = 0;
    flashRef.current = null;
  }, []);

  return { step, orbsRef, particlesRef, orbCountRef, flashRef, reset };
}
