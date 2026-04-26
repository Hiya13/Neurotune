import { useRef, useEffect, useCallback } from 'react';

const MAX_VELOCITY = 3.5;

/**
 * Controls balloon physics: velocity, altitude, turbulence, drift.
 * All driven by smoothedScore. Returns mutable refs for rAF-friendly reads.
 */
export function useFlightPhysics(smoothedScore, isPaused) {
  const velocityRef    = useRef(0);
  const altitudeRef    = useRef(0);
  const timeRef        = useRef(0);
  const balloonXRef    = useRef(300);
  const rotationRef    = useRef(0);
  const inTurbulence   = useRef(false);

  // Called each rAF frame from the main render loop
  const step = useCallback(() => {
    if (isPaused) return;

    timeRef.current += 1 / 60;
    const t = timeRef.current;

    // 1. Target velocity from score
    let targetVelocity = (smoothedScore / 100) * MAX_VELOCITY;

    // 2. If overlapping turbulence cloud, reduce by 30%
    if (inTurbulence.current) {
      targetVelocity *= 0.7;
    }

    // 3. Velocity lerp
    velocityRef.current += (targetVelocity - velocityRef.current) * 0.04;

    // 4. Turbulence & drift
    let xDrift = Math.sin(t * 0.4) * 6; // gentle natural sway
    let verticalDrift = 0;

    if (smoothedScore < 30) {
      xDrift += Math.sin(t * 8) * 1.5; // turbulence wobble
      verticalDrift = 0.8; // gentle downward
    }

    if (inTurbulence.current) {
      xDrift += Math.sin(t * 6) * 3; // extra lateral drift in cloud
    }

    balloonXRef.current = 300 + xDrift; // 1000 * 0.3 = 300

    // 5. Update altitude
    const effectiveVelocity = Math.max(-0.2, velocityRef.current - verticalDrift);
    altitudeRef.current = Math.max(0, altitudeRef.current + effectiveVelocity);

    // 6. Balloon rotation (gentle sway)
    rotationRef.current = Math.sin(t * 0.7) * 3;
  }, [smoothedScore, isPaused]);

  // Allow canvas to mark turbulence overlap
  const setInTurbulence = useCallback((val) => {
    inTurbulence.current = val;
  }, []);

  return {
    step,
    altitudeRef,
    velocityRef,
    timeRef,
    balloonXRef,
    rotationRef,
    setInTurbulence,
  };
}
