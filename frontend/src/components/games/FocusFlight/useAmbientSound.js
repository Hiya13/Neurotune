import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Binaural beats via Web Audio API.
 * score 0–40:   carrier 200Hz, beat 6Hz  (Theta)
 * score 40–70:  carrier 200Hz, beat 12Hz (Alpha)
 * score 70–100: carrier 200Hz, beat 19Hz (Beta)
 *
 * Audio off by default. initAudio must be called from a user gesture.
 */
export default function useAmbientSound(smoothedScore, isMuted) {
  const ctxRef       = useRef(null);
  const leftOscRef   = useRef(null);
  const rightOscRef  = useRef(null);
  const gainRef      = useRef(null);
  const [ready, setReady] = useState(false);

  const initAudio = useCallback(() => {
    if (ctxRef.current) return;

    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    ctxRef.current = ctx;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.connect(ctx.destination);
    gainRef.current = gain;

    // Left ear
    const left = ctx.createOscillator();
    left.type = 'sine';
    left.frequency.setValueAtTime(200, ctx.currentTime);
    const panL = ctx.createStereoPanner();
    panL.pan.setValueAtTime(-1, ctx.currentTime);
    left.connect(panL).connect(gain);
    left.start();
    leftOscRef.current = left;

    // Right ear
    const right = ctx.createOscillator();
    right.type = 'sine';
    right.frequency.setValueAtTime(206, ctx.currentTime);
    const panR = ctx.createStereoPanner();
    panR.pan.setValueAtTime(1, ctx.currentTime);
    right.connect(panR).connect(gain);
    right.start();
    rightOscRef.current = right;

    setReady(true);
  }, []);

  // Mute / unmute
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (isMuted) {
      gainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      if (ctx.state === 'running') ctx.suspend();
    } else {
      if (ctx.state === 'suspended') ctx.resume();
      gainRef.current.gain.setTargetAtTime(0.14, ctx.currentTime, 0.15);
    }
  }, [isMuted]);

  // Update frequencies based on score
  useEffect(() => {
    if (!ctxRef.current || !ready || isMuted) return;
    const ctx = ctxRef.current;
    const now = ctx.currentTime;

    let beatFreq = 6;
    if (smoothedScore > 70) beatFreq = 19;
    else if (smoothedScore > 40) beatFreq = 12;

    const carrier = 200;
    leftOscRef.current.frequency.setTargetAtTime(carrier, now, 0.5);
    rightOscRef.current.frequency.setTargetAtTime(carrier + beatFreq, now, 0.5);
  }, [smoothedScore, isMuted, ready]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
    };
  }, []);

  return { initAudio, ready };
}
