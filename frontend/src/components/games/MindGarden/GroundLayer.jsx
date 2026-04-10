import React from 'react';
import { lerpColor } from '../../../utils/color';

const GroundLayer = ({ score }) => {
  // Score 0: #3d2a1a (bare earth)
  // Score 50: #5a3a20 (rich soil)
  // Score 100: #2d5a1a (lush green)

  let groundColor;
  if (score <= 50) {
    groundColor = lerpColor('#3d2a1a', '#5a3a20', score / 50);
  } else {
    groundColor = lerpColor('#5a3a20', '#2d5a1a', (score - 50) / 50);
  }

  // Hill colors
  const hillColor = lerpColor('#0d1f0d', '#5a8a4a', score / 100);

  return (
    <g>
      {/* Distant Hills */}
      <path 
        d="M 0 500 Q 250 400 500 500 T 1000 500 L 1000 700 L 0 700 Z" 
        fill={hillColor} 
        opacity="0.8" 
      />
      <path 
        d="M 0 550 Q 300 480 600 550 T 1000 550 L 1000 700 L 0 700 Z" 
        fill={hillColor} 
      />

      {/* Main Ground */}
      <rect 
        y="500" 
        width="1000" 
        height="200" 
        fill={groundColor} 
        style={{ transition: 'fill 0.3s linear' }} 
      />

      {/* Decorative pebbles */}
      <g opacity="0.3">
         <circle cx="150" cy="580" r="3" fill="#222" />
         <circle cx="450" cy="620" r="4" fill="#222" />
         <circle cx="780" cy="560" r="2.5" fill="#222" />
         <circle cx="920" cy="640" r="5" fill="#222" />
      </g>
    </g>
  );
};

export default GroundLayer;
