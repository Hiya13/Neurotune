import React from 'react';

const MindGardenIntroModal = ({ onStart }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-[460px] bg-[#0e2008] border border-[#3b6d11]/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 delay-100">
        
        {/* HEADER */}
        <div className="p-6 text-center border-b border-white/5 bg-gradient-to-b from-emerald-900/20 to-transparent">
          <div className="text-[10px] font-bold text-emerald-500 tracking-[0.2em] uppercase mb-2">
            Neurotune — Attention Game
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">The Mind Garden</h2>
          <p className="text-emerald-200/60 text-sm">Your focus is the sunlight.</p>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {/* ROW 1 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b6d11" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </div>
              <p className="text-[13px] text-slate-300 leading-relaxed">
                Your attention score determines how much light falls on the garden. <span className="text-emerald-400 font-medium">Higher focus = more growth.</span>
              </p>
            </div>

            {/* ROW 2 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b6d11" strokeWidth="2">
                  <path d="M12 20V10M12 10a4 4 0 0 1 4 4v2M12 10a4 4 0 0 0-4 4v2" />
                  <path d="M12 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                </svg>
              </div>
              <p className="text-[13px] text-slate-300 leading-relaxed">
                Each plant has 5 growth stages. Hold focus above its <span className="text-emerald-400 font-medium">threshold</span> long enough to advance.
              </p>
            </div>

            {/* ROW 3 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b6d11" strokeWidth="2">
                  <path d="M12 10s-3-4-8 0c4 4 8 10 8 10s4-6 8-10c-5-4-8 0-8 0Z" />
                </svg>
              </div>
              <p className="text-[13px] text-slate-300 leading-relaxed">
                Reach full bloom to attract <span className="text-emerald-400 font-medium">butterflies and fireflies</span>. Let focus drop and plants slowly wilt.
              </p>
            </div>
          </div>

          {/* TIPS STRIP */}
          <div className="flex justify-between items-center px-4 py-2 bg-black/40 rounded-lg border border-white/5 text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
            <span>Breathe evenly</span>
            <div className="w-1 h-1 rounded-full bg-emerald-900" />
            <span>Find stillness</span>
          </div>

          {/* SCORE PREVIEW */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              <span>Attention Level</span>
              <span className="text-emerald-500">Growth Rate</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div className="h-full w-1/3 bg-slate-700" />
              <div className="h-full w-full bg-gradient-to-r from-emerald-900 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-black/20 border-t border-white/5">
          <button 
            onClick={onStart}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all transform active:scale-95 shadow-lg shadow-emerald-900/20"
          >
            Begin Growing →
          </button>
        </div>
      </div>
    </div>
  );
};

export default MindGardenIntroModal;
