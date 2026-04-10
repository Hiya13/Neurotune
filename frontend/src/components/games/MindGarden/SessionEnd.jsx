import React, { useMemo } from 'react';
import GardenScene from './GardenScene';
import authService from '../../../services/authService';

const SessionEnd = ({ scoreHistory, plantStages, sessionDurationMs, onPlayAgain, onExit }) => {
  const avgFocus = useMemo(() => {
    if (scoreHistory.length === 0) return 0;
    return Math.round(scoreHistory.reduce((a, b) => a + b, 0) / scoreHistory.length);
  }, [scoreHistory]);

  const peakFocus = useMemo(() => {
    if (scoreHistory.length === 0) return 0;
    return Math.round(Math.max(...scoreHistory));
  }, [scoreHistory]);

  const bloomedCount = plantStages.filter(s => s >= 5).length;
  const allBloomed = bloomedCount === 8;

  const handleSave = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attentionScore: avgFocus,
          interventionType: 'visual',
          taskContext: 'MindGarden',
          sessionDuration: Math.round(sessionDurationMs / 60000),
          baselineScore: scoreHistory[0] || 0,
          peakScore: peakFocus,
          averageScore: avgFocus,
          notes: `${bloomedCount}/8 plants reached full bloom`,
          eegData: { 
            game: 'MindGarden', 
            plantsFullyBloomed: bloomedCount, 
            plantStages,
            scoreHistorySample: scoreHistory.filter((_, i) => i % 5 === 0) // Subsample for storage
          }
        })
      });

      if (response.ok) {
        alert('Session saved successfully!');
        onExit();
      }
    } catch (err) {
      console.error('Error saving session:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-700">
      <div className="w-full max-w-2xl bg-[#0e1a10] border border-emerald-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left: Garden Portrait */}
        <div className="w-full md:w-5/12 bg-black/40 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5">
           <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-emerald-500/30 shadow-inner bg-slate-900 mb-4">
              <GardenScene score={avgFocus} plantStages={plantStages} onPlantClick={() => {}} />
           </div>
           <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-widest">Garden Portrait</h4>
           <p className="text-slate-500 text-[10px] uppercase font-medium mt-1">Status at termination</p>
        </div>

        {/* Right: Stats & Actions */}
        <div className="w-full md:w-7/12 p-8 flex flex-col">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-1">
              {allBloomed ? 'A Lush Sanctuary' : 'Session Complete'}
            </h2>
            <p className="text-emerald-500/60 text-sm font-medium">Your garden reflects your inner focus.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Bloomed</div>
              <div className="text-xl font-bold text-emerald-400">{bloomedCount}/8</div>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Avg Focus</div>
              <div className="text-xl font-bold text-white">{avgFocus}%</div>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Peak Focus</div>
              <div className="text-xl font-bold text-white">{peakFocus}%</div>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Duration</div>
              <div className="text-xl font-bold text-white">{Math.round(sessionDurationMs / 60000)}m</div>
            </div>
          </div>

          {/* Sparkline (Simplified) */}
          <div className="space-y-2 mb-8 flex-1">
             <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Focus Timeline</div>
             <div className="h-16 w-full bg-black/40 rounded-xl overflow-hidden border border-white/5 flex items-end px-1 gap-[1px]">
               {scoreHistory.filter((_, i) => i % Math.max(1, Math.floor(scoreHistory.length / 40)) === 0).map((s, i) => (
                 <div 
                   key={i} 
                   className="flex-1 bg-emerald-500/40 rounded-t-sm transition-all"
                   style={{ height: `${s}%`, opacity: 0.3 + (s/100)*0.7 }}
                 />
               ))}
             </div>
          </div>

          <div className="space-y-3">
             <button 
               onClick={handleSave}
               className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/20"
             >
               Save Session & Exit
             </button>
             <div className="flex gap-3">
                <button 
                  onClick={onPlayAgain}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-semibold text-sm transition-all"
                >
                  Play Again
                </button>
                <button 
                  onClick={onExit}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-semibold text-sm transition-all"
                >
                  Discard
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionEnd;
