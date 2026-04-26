import React from 'react';
import {
  PROFILES,
  PROFILE_LABELS,
  PROFILE_SPARKLINES,
} from '../../../utils/eegSimulator';

const ALL_PROFILES = Object.values(PROFILES);

/**
 * DemoProfileSelector — horizontal scrollable row of profile pills.
 * Each pill shows a sparkline preview + profile name.
 * Rendered only in demo mode inside game intro modals.
 */
const DemoProfileSelector = ({
  selected,
  onSelect,
  accentColor = '#5dcaa5',
}) => {
  const randomProfile = () => {
    const pick = ALL_PROFILES[Math.floor(Math.random() * ALL_PROFILES.length)];
    onSelect(pick);
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <div
        className="text-[11px] tracking-[0.5px]"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        Demo mode — choose a focus profile:
      </div>

      {/* Scrollable pills row */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        {ALL_PROFILES.map((key) => {
          const isSelected = selected === key;
          const points = PROFILE_SPARKLINES[key];
          const label = PROFILE_LABELS[key];

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className="flex-shrink-0 flex flex-col items-center gap-1 rounded-[10px] px-3 py-2 cursor-pointer transition-all duration-200"
              style={{
                minWidth: 110,
                border: isSelected
                  ? `1px solid ${accentColor}`
                  : '0.5px solid rgba(255,255,255,0.15)',
                background: isSelected
                  ? hexToRgba(accentColor, 0.15)
                  : 'rgba(255,255,255,0.04)',
              }}
            >
              {/* Sparkline */}
              <Sparkline
                data={points}
                color={isSelected ? accentColor : '#5dcaa5'}
                width={48}
                height={20}
              />

              {/* Label */}
              <span
                className="text-[10px] font-medium leading-tight whitespace-nowrap"
                style={{
                  color: isSelected ? accentColor : 'rgba(255,255,255,0.5)',
                }}
              >
                {label}
              </span>
            </button>
          );
        })}

        {/* Random button */}
        <button
          type="button"
          onClick={randomProfile}
          className="flex-shrink-0 flex items-center justify-center rounded-[10px] px-3 py-2 cursor-pointer transition-all duration-200"
          style={{
            minWidth: 70,
            border: '0.5px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <span
            className="text-[11px] font-medium"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            ↺ Random
          </span>
        </button>
      </div>
    </div>
  );
};

/** Tiny SVG polyline sparkline */
function Sparkline({ data, color, width, height }) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data, min + 1);
  const range = max - min;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default DemoProfileSelector;
