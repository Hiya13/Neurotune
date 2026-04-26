/**
 * Semicircular 0–100 focus gauge; needle uses CSS transition (200ms ease).
 * Track shows red / amber / teal zones; live reading uses inline stroke color + dash.
 */
export default function FocusGauge({ score }) {
  const s = Math.min(100, Math.max(0, score));
  const angle = -90 + (s / 100) * 180;

  const zoneColor =
    s < 40 ? 'rgb(220, 80, 80)' : s < 65 ? 'rgb(245, 180, 70)' : 'rgb(45, 180, 170)';

  return (
    <div className="flex flex-col items-center select-none">
      <span
        className="text-[10px] tracking-[0.2em] text-teal-100/80 mb-1"
        style={{ fontVariant: 'small-caps' }}
      >
        Focus
      </span>
      <svg width="120" height="76" viewBox="0 0 120 76" className="overflow-visible">
        <defs>
          <linearGradient id="tide-gauge-zones" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(220, 80, 80)" />
            <stop offset="40%" stopColor="rgb(220, 80, 80)" />
            <stop offset="40%" stopColor="rgb(245, 180, 70)" />
            <stop offset="65%" stopColor="rgb(245, 180, 70)" />
            <stop offset="65%" stopColor="rgb(45, 180, 170)" />
            <stop offset="100%" stopColor="rgb(45, 180, 170)" />
          </linearGradient>
        </defs>
        <path
          d="M 14 70 A 46 46 0 0 1 106 70"
          fill="none"
          stroke="url(#tide-gauge-zones)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity={0.35}
        />
        <path
          d="M 14 70 A 46 46 0 0 1 106 70"
          fill="none"
          stroke={zoneColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(s / 100) * 144.5} 200`}
          style={{ transition: 'stroke 200ms ease, stroke-dasharray 200ms ease' }}
        />
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: '60px 70px',
            transition: 'transform 200ms ease',
          }}
        >
          <line
            x1="60"
            y1="70"
            x2="60"
            y2="30"
            stroke="rgba(255,255,255,0.95)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="60" cy="70" r="4" fill="rgba(15,25,35,0.9)" stroke="rgba(255,255,255,0.5)" />
        </g>
      </svg>
      <div
        className="text-lg font-semibold tabular-nums -mt-1"
        style={{
          color: zoneColor,
          transition: 'color 200ms ease',
        }}
      >
        {Math.round(s)}
      </div>
    </div>
  );
}
