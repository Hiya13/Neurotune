import React from 'react';
import SkyLayer from './SkyLayer';
import GroundLayer from './GroundLayer';
import PondFeature from './PondFeature';
import Plant from './Plant';
import ParticleLayer from './ParticleLayer';
import { PLANTS } from './plants.jsx';

const GardenScene = ({ score, plantStages, onPlantClick }) => {
  const scoreRatio = score / 100;
  
  // Sunlight overlay intensity
  const overlayOpacity = score / 400;

  return (
    <svg
      viewBox="0 0 1000 700"
      preserveAspectRatio="xMidYMid slice"
      className="w-full h-full block"
    >
      <SkyLayer score={score} />
      <GroundLayer score={score} />
      <PondFeature score={score} />
      
      {/* Background/Special plant (Heartroot) rendered behind others */}
      <Plant 
        plant={PLANTS.find(p => p.id === 8)} 
        stage={plantStages[7]} 
        scoreRatio={scoreRatio} 
        onClick={onPlantClick} 
      />

      <g>
        {PLANTS.filter(p => p.id !== 8).map((plant, index) => (
          <Plant 
            key={plant.id} 
            plant={plant} 
            stage={plantStages[index]} 
            scoreRatio={scoreRatio}
            onClick={onPlantClick}
          />
        ))}
      </g>
      
      <ParticleLayer score={score} plantStages={plantStages} />

      {/* Ambient Light Overlay */}
      <rect 
        width="1000" 
        height="700" 
        fill="#f5e090" 
        style={{ 
          opacity: overlayOpacity,
          mixBlendMode: 'overlay',
          transition: 'opacity 0.5s linear'
        }} 
        pointerEvents="none" 
      />
    </svg>
  );
};

export default GardenScene;
