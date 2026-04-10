import React from 'react';
import { lerpColor } from '../../../utils/color';

const SkyLayer = ({ score }) => {
  // Score 0-30: deep night
  // Score 30-60: dawn/dusk
  // Score 60-85: golden hour
  // Score 85-100: bright day
  
  let skyTop, skyBottom;
  
  if (score <= 30) {
    skyTop = '#0a1020';
    skyBottom = '#0a1020';
  } else if (score <= 60) {
    const t = (score - 30) / 30;
    skyTop = lerpColor('#0a1020', '#1a2a4a', t);
    skyBottom = lerpColor('#0a1020', '#2d4a6a', t);
  } else if (score <= 85) {
    const t = (score - 60) / 25;
    skyTop = lerpColor('#1a2a4a', '#3d5a8a', t);
    skyBottom = lerpColor('#2d4a6a', '#6b8fb5', t);
  } else {
    const t = (score - 85) / 15;
    skyTop = lerpColor('#3d5a8a', '#87b4d4', t);
    skyBottom = lerpColor('#6b8fb5', '#c5dff0', t);
  }

  const sunY = 750 - (score / 100) * (750 - 80);
  const starOpacity = Math.max(0, 1 - score / 40);
  const cloudOpacity = score < 20 ? 0 : Math.min(0.6, (score - 20) / 40 * 0.6);

  return (
    <g>
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: skyTop, transition: 'stop-color 0.2s linear' }} />
          <stop offset="100%" style={{ stopColor: skyBottom, transition: 'stop-color 0.2s linear' }} />
        </linearGradient>
      </defs>
      
      {/* Background */}
      <rect width="1000" height="700" fill="url(#skyGradient)" />

      {/* Stars */}
      <g opacity={starOpacity}>
        {[...Array(40)].map((_, i) => (
          <circle 
            key={i} 
            cx={Math.random() * 1000} 
            cy={Math.random() * 400} 
            r={0.5 + Math.random()} 
            fill="white" 
          />
        ))}
      </g>

      {/* Sun */}
      <g transform={`translate(500, ${sunY})`}>
        <circle r="60" fill="#f5e090" opacity="0.15" />
        <circle r="28" fill="#f5e090" />
      </g>

      {/* Clouds */}
      <g opacity={cloudOpacity}>
         <ellipse cx="200" cy="150" rx="60" ry="20" fill="white" className="animate-pulse" />
         <ellipse cx="500" cy="100" rx="80" ry="25" fill="white" style={{ animationDelay: '1s' }} className="animate-pulse" />
         <ellipse cx="800" cy="180" rx="50" ry="15" fill="white" style={{ animationDelay: '2s' }} className="animate-pulse" />
      </g>
    </g>
  );
};

export default SkyLayer;
