import React from 'react';

const TideIntroModal = ({ onStart }) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[fadeIn_250ms_ease-in]"
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-[460px] bg-[#0e2038] border-[0.5px] border-[#5dc2a559] rounded-2xl overflow-hidden shadow-2xl animate-[scaleIn_250ms_ease-out]">
        <div className="p-8 space-y-8">
          {/* HEADER */}
          <div className="text-center">
            <span className="text-[11px] text-[#5dcaa5] tracking-[1px] uppercase block mb-2 font-medium">
              Neurotune — Attention Game
            </span>
            <h2 className="text-[22px] text-white font-medium mb-1">
              The Tide Controller
            </h2>
            <p className="text-[14px] text-slate-400 font-normal">
              Your focus controls the ocean.
            </p>
          </div>

          {/* HOW IT WORKS */}
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-[#5dcaa515] rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5dcaa5" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
              <p className="text-[13px] text-slate-300 leading-[1.6]">
                Your EEG attention score (0–100) controls the tide level in real time. 
                <span className="text-white font-medium ml-1">Higher focus = lower water.</span>
              </p>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-[#5dcaa515] rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5dcaa5" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <p className="text-[13px] text-slate-300 leading-[1.6]">
                Six artifacts are buried on the seafloor. Each one unlocks when your focus holds 
                above its threshold for <span className="text-white font-medium">4 continuous seconds.</span>
              </p>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-[#5dcaa515] rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5dcaa5" strokeWidth="2" strokeLinecap="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <p className="text-[13px] text-slate-300 leading-[1.6]">
                Find all 6 artifacts before the 5-minute timer runs out to complete the session. 
                Click any unlocked artifact to read its discovery story.
              </p>
            </div>
          </div>

          {/* TIPS STRIP */}
          <div className="flex justify-between gap-2">
            <span className="bg-[#1d9e751f] border-[0.5px] border-[#5dcaa54d] text-[#9fe1cb] text-[12px] px-[14px] py-[5px] rounded-[20px] transition-all whitespace-nowrap">
              Breathe slowly
            </span>
            <span className="bg-[#1d9e751f] border-[0.5px] border-[#5dcaa54d] text-[#9fe1cb] text-[12px] px-[14px] py-[5px] rounded-[20px] transition-all whitespace-nowrap">
              Minimise movement
            </span>
            <span className="bg-[#1d9e751f] border-[0.5px] border-[#5dcaa54d] text-[#9fe1cb] text-[12px] px-[14px] py-[5px] rounded-[20px] transition-all whitespace-nowrap">
              Stay present
            </span>
          </div>

          {/* SCORE PREVIEW */}
          <div className="space-y-3 pt-2">
            <div 
              className="w-full h-2 rounded-[4px]" 
              style={{ background: 'linear-gradient(to right, #e24b4a, #ef9f27, #1d9e75)' }}
            />
            <div className="flex justify-between text-[10px] text-white/40 tracking-tight">
              <span>Distracted (0)</span>
              <span>Focused (50)</span>
              <span>Deep focus (100)</span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-8 pt-0">
          <button
            onClick={onStart}
            className="w-full bg-[#1d9e752e] border-[0.5px] border-[#1d9e75] text-[#5dcaa5] text-[15px] py-3 rounded-[10px] font-medium transition-all hover:bg-[#1d9e7552] active:scale-[0.98]"
          >
            Start Session →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.93); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TideIntroModal;
