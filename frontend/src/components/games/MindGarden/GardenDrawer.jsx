import React from 'react';
import { PLANTS, getStageLabel } from './plants.jsx';

const GardenDrawer = ({ plantStages, onPlantClick, onClose }) => {
  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-black/40 backdrop-blur-[1px]" onClick={onClose}>
      <div 
        className="w-full max-w-sm h-full bg-[#0a1208]/95 border-l border-emerald-500/20 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold text-emerald-200">The Garden</h3>
            <p className="text-xs text-slate-500 font-medium tracking-widest uppercase mt-0.5">Progress Tracking</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {PLANTS.map((plant, index) => {
            const stage = plantStages[index];
            const progress = (stage / 5) * 100;
            
            return (
              <button 
                key={plant.id}
                onClick={() => onPlantClick(plant)}
                className="w-full text-left p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all group"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                    {plant.name}
                  </span>
                  {stage >= 5 ? (
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Full Bloom
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {getStageLabel(stage)}
                    </span>
                  )}
                </div>

                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500/80 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GardenDrawer;
