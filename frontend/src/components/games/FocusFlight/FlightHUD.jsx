import React from 'react';
import FocusGauge from '../TideController/FocusGauge';
import DemoBadge from '../shared/DemoBadge';

/**
 * HUD overlay rendered as HTML divs above the canvas.
 * Altitude badge, orbs badge, zone badge, timer, FocusGauge, speaker toggle, exit.
 */
const FlightHUD = ({
  altitude,
  orbs,
  score,
  zone,
  timerLabel,
  isMuted,
  isSimulated,
  isReconnecting,
  simPhase,
  simProfileName,
  onToggleMute,
  onExit,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6">

      {/* ── TOP ROW ──────────────────────────── */}
      <div className="flex justify-between items-start">

        {/* Left: Focus Gauge */}
        <div className="pointer-events-auto glass-panel rounded-2xl px-3 py-2 bg-black/30 border border-amber-500/20 shadow-lg backdrop-blur-md">
          <FocusGauge score={score} />
        </div>

        {/* Center: Altitude + Zone */}
        <div className="flex flex-col items-center gap-1">
          <div className="glass-panel px-5 py-2 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md text-center">
            <div className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Altitude</div>
            <div className="text-xl md:text-2xl font-black text-white tabular-nums leading-none mt-0.5">
              <span className="text-amber-500 mr-1 text-sm">&#9650;</span>
              {Math.floor(altitude).toLocaleString()}m
            </div>
          </div>
          <div className="glass-panel px-3 py-1 rounded-lg bg-black/30 border border-white/5 text-[10px] text-amber-300/70 font-bold uppercase tracking-widest">
            {zone}
          </div>
        </div>

        {/* Right: Orbs + Controls */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            {isReconnecting && (
              <div className="text-[10px] px-2 py-1 rounded-md bg-amber-900/50 text-amber-200 border border-amber-500/30 animate-pulse">
                Reconnecting...
              </div>
            )}
            <DemoBadge isSimulated={isSimulated} phase={simPhase} profileName={simProfileName} />
            {!isSimulated && (
              <div className="text-[10px] px-3 py-1 bg-black/40 border border-white/10 rounded-full text-slate-400 font-bold tracking-widest uppercase">
                Live EEG
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Orbs */}
            <div className="glass-panel px-4 py-2 bg-black/40 border border-white/5 rounded-xl flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-[0_0_8px_rgba(251,191,36,0.4)] animate-pulse" />
              <div>
                <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">Orbs</div>
                <div className="text-lg font-black text-white leading-none">{orbs}</div>
              </div>
            </div>

            {/* Timer */}
            <div className="glass-panel px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-amber-100 text-sm font-mono tabular-nums tracking-wider">
              {timerLabel}
            </div>

            {/* Mute */}
            <button
              onClick={onToggleMute}
              className="glass-panel p-2 bg-black/40 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              )}
            </button>

            {/* Exit */}
            <button
              onClick={onExit}
              className="glass-panel px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all text-sm font-semibold"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM — empty space (balloon is at 62% height) */}
      <div />
    </div>
  );
};

export default FlightHUD;
