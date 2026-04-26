import React from 'react';
import { PROFILE_LABELS } from '../../../utils/eegSimulator';

/**
 * DemoBadge — shows in HUDs during demo mode.
 * Displays profile name & phase-aware status text with color shifts.
 */
const DemoBadge = ({ isSimulated, phase, profileName }) => {
  if (!isSimulated) return null;

  const label = PROFILE_LABELS[profileName] || profileName || 'Random';

  let text = `Demo · ${label}`;
  let color = '#fac775';
  let borderColor = 'rgba(186,117,23,0.4)';
  let bgColor = 'rgba(186,117,23,0.15)';
  let pulse = false;

  if (phase === 'distraction' || phase === 'lapse') {
    text = 'Demo · Distracted';
    pulse = true;
  } else if (phase === 'deepFocus') {
    text = 'Demo · Deep Focus';
    color = '#5dcaa5';
    borderColor = 'rgba(93,202,165,0.4)';
    bgColor = 'rgba(93,202,165,0.15)';
  }

  return (
    <div
      className={`text-[11px] px-3 py-1 rounded-full font-medium flex items-center gap-1.5 ${pulse ? 'animate-demo-pulse' : ''}`}
      style={{ color, background: bgColor, border: `0.5px solid ${borderColor}` }}
    >
      <style>{`
        @keyframes demoPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-demo-pulse { animation: demoPulse 1s ease-in-out infinite; }
      `}</style>
      <span style={{ fontSize: 8, lineHeight: 1 }}>●</span>
      {text}
    </div>
  );
};

export default DemoBadge;
