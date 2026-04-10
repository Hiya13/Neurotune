import React from 'react';
import { renderPlant } from './plants.jsx';

const Plant = ({ plant, stage, scoreRatio, onClick }) => {
  return (
    <g 
      className="cursor-pointer" 
      onClick={() => onClick(plant)}
      style={{ transition: 'transform 0.5s ease' }}
    >
      {renderPlant(plant.type, stage, plant.x, plant.y, scoreRatio)}
    </g>
  );
};

export default Plant;
