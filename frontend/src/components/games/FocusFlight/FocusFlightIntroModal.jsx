import React from 'react';
import DemoProfileSelector from '../shared/DemoProfileSelector';

const FocusFlightIntroModal = ({ onStart, isDemo, simulatorProfile, onProfileSelect }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-[460px] bg-[#21180b] border border-[#ba7517]/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 delay-100">
        
        {/* HEADER */}
        <div className="p-6 text-center border-b border-white/5 bg-gradient-to-b from-amber-900/20 to-transparent">
          <div className="text-[10px] font-bold text-amber-500 tracking-[0.2em] uppercase mb-2">
            Neurotune — Attention Game
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Focus Flight</h2>
          <p className="text-amber-200/60 text-sm italic">Your focus is the wind beneath you.</p>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {/* ROW 1 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/20 text-amber-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <path d="M12 2v10M12 12a4 4 0 0 1 4 4v2M12 12a4 4 0 0 0-4 4v2" />
                </svg>
              </div>
              <p className="text-[13px] text-slate-300 leading-relaxed">
                Your EEG attention score controls lift. <span className="text-amber-400 font-medium">Stronger focus = faster ascent</span> into clearer skies.
              </p>
            </div>

            {/* ROW 2 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/20 text-amber-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2" />
                </svg>
              </div>
              <p className="text-[13px] text-slate-300 leading-relaxed">
                Collect glowing <span className="text-amber-400 font-medium">Focus Orbs</span> to boost your score. They float into your path when focus is high.
              </p>
            </div>

            {/* ROW 3 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/20 text-amber-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <path d="M17.5 19a3.5 3.5 0 1 1-5.83-2.67 3.5 3.5 0 1 1 5.83-2.67V19Z" />
                </svg>
              </div>
              <p className="text-[13px] text-slate-300 leading-relaxed">
                Low focus causes <span className="text-amber-400 font-medium">turbulence</span>. Re-center your mind to stabilize the balloon and stay on course.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center px-4 py-2 bg-black/40 rounded-lg border border-white/5 text-[11px] text-slate-400 uppercase tracking-widest font-semibold italic">
            <span>Breathe deeply</span>
            <span>Soft gaze</span>
            <span>Let go of effort</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              <span>Ascent Strength</span>
              <span className="text-amber-500">Focus Range</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div className="h-full w-1/4 bg-rose-500/50" />
              <div className="h-full w-1/4 bg-amber-500/50" />
              <div className="h-full w-1/2 bg-emerald-500 shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
            </div>
          </div>

          {/* DEMO PROFILE SELECTOR */}
          {isDemo && (
            <DemoProfileSelector
              selected={simulatorProfile}
              onSelect={onProfileSelect}
              accentColor="#ba7517"
            />
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-black/20 border-t border-white/5">
          <button 
            onClick={onStart}
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm transition-all transform active:scale-95 shadow-lg shadow-amber-900/20"
          >
            Take Off →
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocusFlightIntroModal;
