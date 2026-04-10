import React from 'react';

export const PLANTS = [
  {
    id: 1,
    name: 'Moonbell',
    x: 120,
    y: 520,
    threshold: 20,
    advanceTime: 5,
    type: 'bell-flower',
    flavor: 'A luminous chime that resonates with steady focus.',
  },
  {
    id: 2,
    name: 'Sunwhisper',
    x: 230,
    y: 510,
    threshold: 30,
    advanceTime: 6,
    type: 'sunflower-small',
    flavor: 'Small but radiant, it bows deeply to the morning sun.',
  },
  {
    id: 3,
    name: 'Fernwing',
    x: 380,
    y: 530,
    threshold: 38,
    advanceTime: 7,
    type: 'fern',
    flavor: 'Curled fronds that unfurl only when the mind is still.',
  },
  {
    id: 4,
    name: 'Dawnrose',
    x: 500,
    y: 505,
    threshold: 48,
    advanceTime: 8,
    type: 'rose',
    flavor: 'Thorns protect a delicate beauty that blooms in the light.',
  },
  {
    id: 5,
    name: 'Crystalbloom',
    x: 620,
    y: 525,
    threshold: 56,
    advanceTime: 8,
    type: 'crystal-flower',
    flavor: 'Geometric petals that shimmer with clarity and intent.',
  },
  {
    id: 6,
    name: 'Tideleaf',
    x: 740,
    y: 515,
    threshold: 65,
    advanceTime: 9,
    type: 'large-leaf',
    flavor: 'Waxy leaves that catch the moisture of deep concentration.',
  },
  {
    id: 7,
    name: 'Emberflower',
    x: 860,
    y: 520,
    threshold: 74,
    advanceTime: 10,
    type: 'ember-flower',
    flavor: 'Heating up with focused effort, its glow is a welcome heat.',
  },
  {
    id: 8,
    name: 'The Heartroot',
    x: 500,
    y: 470,
    threshold: 85,
    advanceTime: 12,
    type: 'ancient-tree',
    flavor: 'The ancient foundation of the garden, reaching for the stars.',
  },
];

export const getStageLabel = (stage) => {
  if (stage < 1) return 'Seedling';
  if (stage < 2) return 'Sprouting';
  if (stage < 3) return 'Growing';
  if (stage < 4) return 'Budding';
  if (stage < 5) return 'Blooming';
  return 'In Full Bloom';
};

/**
 * Renders a plant based on type and stageProgress (0.0 - 5.0)
 */
export const renderPlant = (type, stage, x, y, scoreRatio) => {
  const h = 12 + (stage / 5) * 80; // Height factor
  const s = stage / 5; // Scale factor 0-1
  
  // Base rendering common to most plants (mound/seed)
  const seedMound = (
    <ellipse cx={x} cy={y} rx={6 + s * 10} ry={2 + s * 4} fill="#3d2a1a" />
  );

  switch (type) {
    case 'bell-flower': {
      const color = stage >= 4 ? '#9b59b6' : '#2d7a2d';
      return (
        <g key={type}>
          {seedMound}
          {stage > 0 && (
            <path
              d={`M ${x} ${y} Q ${x - 5} ${y - h / 2} ${x} ${y - h}`}
              stroke="#2d7a2d"
              strokeWidth={1 + s * 2}
              fill="none"
              strokeLinecap="round"
            />
          )}
          {stage >= 4 && (
            <path
              d={`M ${x - 5} ${y - h} Q ${x} ${y - h - 15} ${x + 5} ${y - h}`}
              fill={color}
              transform={`rotate(${Math.sin(performance.now() * 0.002) * 5}, ${x}, ${y - h})`}
            />
          )}
        </g>
      );
    }
    case 'sunflower-small': {
      const petalColor = stage >= 4 ? '#f5c842' : '#3a7a1a';
      return (
        <g key={type}>
          {seedMound}
          {stage > 0 && (
            <line x1={x} y1={y} x2={x} y2={y - h} stroke="#3a7a1a" strokeWidth={1 + s * 2} />
          )}
          {stage >= 4 && (
            <g transform={`translate(${x}, ${y - h}) scale(${s})`}>
              <circle r="10" fill="#8b4513" />
              {[...Array(8)].map((_, i) => (
                <ellipse
                  key={i}
                  ry="12"
                  rx="4"
                  cy="-12"
                  fill={petalColor}
                  transform={`rotate(${i * 45})`}
                />
              ))}
            </g>
          )}
        </g>
      );
    }
    case 'fern': {
      return (
        <g key={type}>
          {seedMound}
          {stage > 0 && (
            <g transform={`translate(${x}, ${y}) scale(${s})`}>
              {[...Array(5)].map((_, i) => (
                <path
                  key={i}
                  d="M 0 0 Q 30 -40 0 -80"
                  stroke="#2d6a2d"
                  strokeWidth="2"
                  fill="none"
                  transform={`rotate(${(i - 2) * 25})`}
                />
              ))}
            </g>
          )}
        </g>
      );
    }
    case 'rose': {
      const bloomColor = stage >= 4 ? '#e84393' : '#3a6a1a';
      return (
        <g key={type}>
          {seedMound}
          {stage > 0 && (
            <path
              d={`M ${x} ${y} L ${x} ${y - h}`}
              stroke="#3a6a1a"
              strokeWidth={1 + s * 2}
            />
          )}
          {stage >= 3 && (
             <circle cx={x} cy={y-h} r={s * 12} fill={bloomColor} />
          )}
        </g>
      );
    }
    case 'crystal-flower': {
       const color = stage >= 4 ? '#7dd3fc' : '#4a7a6a';
       return (
         <g key={type}>
           {seedMound}
           {stage > 0 && (
             <line x1={x} y1={y} x2={x} y2={y-h} stroke="#4a7a6a" strokeWidth={1 + s * 2} />
           )}
           {stage >= 4 && (
             <g transform={`translate(${x}, ${y-h}) scale(${s})`}>
                <polygon points="0,-15 13,7 -13,7" fill={color} opacity="0.8" />
                <polygon points="0,15 -13,-7 13,-7" fill={color} opacity="0.8" />
             </g>
           )}
         </g>
       )
    }
    case 'large-leaf': {
      return (
        <g key={type}>
          {seedMound}
          {stage > 0 && (
            <g transform={`translate(${x}, ${y}) scale(${s})`}>
               <path d="M 0 0 Q 40 -20 0 -80 Q -40 -20 0 0" fill="#1a5a1a" />
               <path d="M 0 0 L 0 -80" stroke="#4ade80" strokeWidth="1" opacity="0.5" />
            </g>
          )}
        </g>
      )
    }
    case 'ember-flower': {
       const color = stage >= 4 ? '#f97316' : '#5a3a1a';
       return (
         <g key={type}>
           {seedMound}
           {stage > 0 && (
             <line x1={x} y1={y} x2={x} y2={y-h} stroke="#5a3a1a" strokeWidth={1 + s * 2} />
           )}
           {stage >= 4 && (
             <circle cx={x} cy={y-h} r={s * 15} fill={color} filter="blur(2px)">
                <animate attributeName="r" values={`${s*15};${s*18};${s*15}`} dur="1.5s" repeatCount="indefinite" />
             </circle>
           )}
         </g>
       )
    }
    case 'ancient-tree': {
      const treeH = 20 + s * 150;
      return (
        <g key={type}>
          {seedMound}
          {stage > 0 && (
            <g>
               <path d={`M ${x-5*s} ${y} L ${x-2*s} ${y-treeH} L ${x+2*s} ${y-treeH} L ${x+5*s} ${y} Z`} fill="#5a3a1a" />
               {stage >= 3 && (
                 <circle cx={x} cy={y-treeH} r={s * 60} fill="url(#tree-gradient)" opacity="0.9" />
               )}
            </g>
          )}
          <defs>
            <radialGradient id="tree-gradient">
              <stop offset="20%" stopColor="#1a5a1a" />
              <stop offset="100%" stopColor="#4ade80" />
            </radialGradient>
          </defs>
        </g>
      )
    }
    default:
      return seedMound;
  }
};
