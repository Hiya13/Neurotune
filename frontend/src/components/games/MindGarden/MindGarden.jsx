import { useCallback, useEffect, useRef, useState } from 'react';
import useAttentionScore from '../TideController/useAttentionScore';
import useRollingAverage from '../TideController/useRollingAverage';
import FocusGauge from '../TideController/FocusGauge';
import MindGardenIntroModal from './MindGardenIntroModal';
import GardenScene from './GardenScene';
import GardenDrawer from './GardenDrawer';
import PlantCard from './PlantCard';
import SessionEnd from './SessionEnd';
import useAmbientSound from './useAmbientSound';
import { PLANTS } from './plants.jsx';

const DEFAULT_SESSION_MS = 7 * 60 * 1000;
const DEFAULT_WS = 'ws://localhost:8080';

export default function MindGarden({
  sessionDurationMs = DEFAULT_SESSION_MS,
  wsUrl = DEFAULT_WS,
  onExit,
}) {
  const { rawScore, connectionState, isSimulated, isReconnecting } = useAttentionScore(wsUrl);
  const smoothedScore = useRollingAverage(rawScore, 3000);

  const [tabVisible, setTabVisible] = useState(!document.hidden);
  const [modalOpen, setModalOpen] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  // Game State
  const [plantStages, setPlantStages] = useState(new Array(PLANTS.length).fill(0));
  const [activePlant, setActivePlant] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const sessionStartRef = useRef(Date.now());
  const scoreHistoryRef = useRef([]);
  const lastTickRef = useRef(performance.now());
  const rafRef = useRef(null);

  const { initAudio } = useAmbientSound(smoothedScore, isMuted || modalOpen || sessionEnded);

  const sessionActive = !sessionEnded && !modalOpen && tabVisible;

  // Visibility handling
  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Update session start when modal closes
  useEffect(() => {
    if (!modalOpen) {
      sessionStartRef.current = Date.now();
      lastTickRef.current = performance.now();
    }
  }, [modalOpen]);

  // Main Game Loop (Plant Growth/Wilt Logic)
  useEffect(() => {
    if (!sessionActive) return;

    const tick = (now) => {
      const dt = (now - lastTickRef.current) / 1000; // Delta in seconds
      lastTickRef.current = now;

      setPlantStages((prev) => {
        const next = [...prev];
        let anyChanged = false;

        PLANTS.forEach((plant, i) => {
          const currentStage = prev[i];
          const threshold = plant.threshold;
          const advanceTime = plant.advanceTime;

          let newStage = currentStage;
          if (smoothedScore >= threshold) {
            // Grow
            if (currentStage < 5) {
              newStage = Math.min(5, currentStage + dt / advanceTime);
            }
          } else {
            // Wilt
            if (currentStage > 0) {
              newStage = Math.max(0, currentStage - dt / (advanceTime * 1.5));
            }
          }

          if (newStage !== currentStage) {
            next[i] = newStage;
            anyChanged = true;
          }
        });

        return anyChanged ? next : prev;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [sessionActive, smoothedScore]);

  // Session timer and History sampling
  useEffect(() => {
    if (!sessionActive) return;

    const id = setInterval(() => {
      const elapsed = Date.now() - sessionStartRef.current;
      scoreHistoryRef.current.push(smoothedScore);
      
      if (elapsed >= sessionDurationMs) {
        setSessionEnded(true);
      }
    }, 500);

    return () => clearInterval(id);
  }, [sessionActive, sessionDurationMs]);

  // Auto-end if all plants bloomed
  useEffect(() => {
    if (!sessionEnded && plantStages.every((s) => s >= 5)) {
      setSessionEnded(true);
    }
  }, [plantStages, sessionEnded]);

  const handleStart = () => {
    initAudio();
    setModalOpen(false);
  };

  const handlePlayAgain = () => {
    setPlantStages(new Array(PLANTS.length).fill(0));
    setSessionEnded(false);
    setModalOpen(true);
    setSessionKey((k) => k + 1);
    scoreHistoryRef.current = [];
  };

  const elapsed = sessionActive || sessionEnded ? Date.now() - sessionStartRef.current : 0;
  const remainingMs = Math.max(0, sessionDurationMs - elapsed);
  const mm = Math.floor(remainingMs / 60000);
  const ss = Math.floor((remainingMs % 60000) / 1000);
  const timerLabel = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  
  const bloomedCount = plantStages.filter((s) => s >= 5).length;

  return (
    <div className="fixed inset-0 z-[70] bg-[#0a1208] overflow-hidden flex flex-col font-sans select-none">
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
      
      <div className="relative flex-1 min-h-0 bg-black">
        <GardenScene 
          score={smoothedScore} 
          plantStages={plantStages} 
          onPlantClick={setActivePlant} 
        />

        {/* HUD */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-4 pointer-events-none">
          <div className="pointer-events-auto glass-panel rounded-2xl px-4 py-3 bg-black/30 border border-emerald-500/20 shadow-lg backdrop-blur-md">
             <FocusGauge score={smoothedScore} />
          </div>

          <div className="flex flex-col items-end gap-3 pointer-events-auto">
             <div className="flex items-center gap-2">
                {isReconnecting && (
                  <div className="text-[10px] px-2 py-1 rounded-md bg-amber-900/50 text-amber-200 border border-amber-500/30 animate-pulse">
                    Reconnecting...
                  </div>
                )}
                <div className="text-[10px] px-3 py-1 bg-black/40 border border-white/10 rounded-full text-slate-400 font-bold tracking-widest uppercase">
                  {isSimulated ? 'Demo Mode' : 'Live EEG'}
                </div>
             </div>

             <div className="flex items-center gap-2">
                <div className="glass-panel px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-emerald-100 text-sm font-mono tabular-nums tracking-wider">
                  {timerLabel}
                </div>
                <div className="glass-panel px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-emerald-100 text-sm">
                  <span className="text-emerald-500/60 font-medium mr-2">Bloomed</span>
                  <span className="font-bold">{bloomedCount}/8</span>
                </div>
                <button 
                  onClick={() => setDrawerOpen(true)}
                  className="glass-panel px-4 py-2 bg-emerald-950/30 border border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-200 text-sm font-semibold rounded-xl transition-all"
                >
                  Garden
                </button>
                
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="glass-panel p-2 bg-black/40 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  )}
                </button>

                <button 
                  onClick={onExit}
                  className="glass-panel px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all text-sm font-semibold"
                >
                  Exit
                </button>
             </div>
          </div>
        </div>

        {/* MODALS / OVERLAYS */}
        {modalOpen && <MindGardenIntroModal onStart={handleStart} />}
        
        {drawerOpen && (
          <GardenDrawer 
            plantStages={plantStages} 
            onPlantClick={setActivePlant} 
            onClose={() => setDrawerOpen(false)} 
          />
        )}

        {activePlant && (
          <PlantCard 
            plant={activePlant} 
            stage={plantStages[PLANTS.findIndex(p => p.id === activePlant.id)]} 
            onClose={() => setActivePlant(null)} 
          />
        )}

        {sessionEnded && (
          <SessionEnd 
            scoreHistory={scoreHistoryRef.current}
            plantStages={plantStages}
            sessionDurationMs={elapsed}
            onPlayAgain={handlePlayAgain}
            onExit={onExit}
          />
        )}
      </div>
    </div>
  );
}
