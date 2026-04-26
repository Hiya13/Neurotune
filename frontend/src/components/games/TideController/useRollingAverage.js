import { useEffect, useRef, useState } from 'react';

/**
 * Rolling time-window average of a numeric stream (default 3s).
 * Recomputes as samples age out even when the input is steady.
 */
export function useRollingAverage(value, windowMs = 3000) {
  const historyRef = useRef([]);
  const valueRef = useRef(value);
  valueRef.current = value;

  const [smoothed, setSmoothed] = useState(value);

  useEffect(() => {
    const now = performance.now();
    historyRef.current.push({ t: now, v: valueRef.current });
  }, [value]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      historyRef.current = historyRef.current.filter((h) => now - h.t <= windowMs);
      const slice = historyRef.current;
      const next =
        slice.length === 0
          ? valueRef.current
          : slice.reduce((a, h) => a + h.v, 0) / slice.length;
      setSmoothed((prev) => (Math.abs(prev - next) < 0.02 ? prev : next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [windowMs]);

  return smoothed;
}

export default useRollingAverage;
