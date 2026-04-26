import React from 'react';

const ParticleLayer = ({ score, plantStages }) => {
  const numFireflies = Math.floor(Math.max(0, score - 70) / 3);
  const showButterflies = score > 80;
  
  const hasBloomed = plantStages.some(s => s >= 5);

  return (
    <g>
      {/* Fireflies */}
      {[...Array(Math.min(10, numFireflies))].map((_, i) => (
        <circle 
          key={`ff-${i}`} 
          r="2.5" 
          fill="#f5e090" 
          filter="blur(1px)"
        >
          <animate 
            attributeName="cx" 
            values={`${100 + i * 80};${150 + i * 80};${100 + i * 80}`} 
            dur={`${3 + i}s`} 
            repeatCount="indefinite" 
          />
          <animate 
            attributeName="cy" 
            values={`${400 + i * 20};${380 + i * 20};${400 + i * 20}`} 
            dur={`${4 + i}s`} 
            repeatCount="indefinite" 
          />
          <animate 
            attributeName="opacity" 
            values="0.3;0.9;0.3" 
            dur="2s" 
            repeatCount="indefinite" 
          />
        </circle>
      ))}

      {/* Butterflies */}
      {showButterflies && [...Array(3)].map((_, i) => (
        <g key={`bf-${i}`}>
           <ellipse rx="8" ry="4" fill="#7dd3fc" opacity="0.8">
              <animateTransform 
                attributeName="transform"
                type="translate"
                values={`${300 + i * 200},300; ${350 + i * 200},250; ${300 + i * 200},300`}
                dur={`${5 + i}s`}
                repeatCount="indefinite"
              />
           </ellipse>
        </g>
      ))}

      {/* Pollen particles (tiny dots drifting up from bloomed plants) */}
      {hasBloomed && [...Array(15)].map((_, i) => (
        <circle key={`p-${i}`} r="1" fill="white" opacity="0.6">
           <animate attributeName="cx" values={`${Math.random() * 1000};${Math.random() * 1000}`} dur="10s" repeatCount="indefinite" />
           <animate attributeName="cy" values="500;300" dur="5s" repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  );
};

export default ParticleLayer;
