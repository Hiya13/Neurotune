import React from 'react';
import { getStageLabel } from './plants.jsx';

const PlantCard = ({ plant, stage, onClose }) => {
  const progress = (stage / 5) * 100;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]" onClick={onClose}>
      <div 
        className="w-full max-w-sm bg-slate-900/95 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">{plant.name}</h3>
              <p className="text-emerald-400 text-xs font-semibold tracking-wider uppercase mt-1">
                {getStageLabel(stage)}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">
            "{plant.flavor}"
          </p>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <span>Growth Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full border border-white/5 p-[1px]">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {stage >= 5 ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">In Full Bloom</span>
            </div>
          ) : (
            <p className="text-slate-400 text-[11px] text-center">
              Keep focusing above <span className="text-emerald-500">{plant.threshold}%</span> to help it grow.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantCard;
