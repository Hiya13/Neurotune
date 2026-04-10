import React from 'react';

const PondFeature = ({ score }) => {
  const lilyPadOpacity = score > 55 ? 1 : 0;
  const lotusOpacity = score > 75 ? 1 : 0;

  return (
    <g transform="translate(150, 600)">
      {/* Pond Body */}
      <ellipse rx="120" ry="40" fill="#1a3a4a" />

      {/* Animated Shimmer */}
      <g opacity="0.4">
        <ellipse cx="-40" cy="-10" rx="15" ry="3" fill="white">
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="30" cy="15" rx="20" ry="4" fill="white">
          <animate attributeName="opacity" values="0;1;0" dur="4s" repeatCount="indefinite" />
        </ellipse>
      </g>

      {/* Lily Pads */}
      <g opacity={lilyPadOpacity} style={{ transition: 'opacity 1s ease' }}>
        <circle cx="-60" cy="10" r="10" fill="#2d5a1a" />
        <circle cx="50" cy="-15" r="12" fill="#2d5a1a" />
        <circle cx="80" cy="10" r="8" fill="#2d5a1a" />
      </g>

      {/* Lotus Flower */}
      <g opacity={lotusOpacity} style={{ transition: 'opacity 1.5s ease' }} transform="translate(-20, -5)">
        {[...Array(6)].map((_, i) => (
          <ellipse 
            key={i} 
            rx="15" ry="6" 
            fill="#e84393" 
            transform={`rotate(${i * 60})`} 
          />
        ))}
        <circle r="5" fill="#f5c842" />
      </g>
    </g>
  );
};

export default PondFeature;
