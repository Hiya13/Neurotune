import { useEffect, useState } from 'react';

function LiveEEGMonitor({ liveMetrics, sessionActive }) {
  const [history, setHistory] = useState([]);
  const maxHistoryLength = 60; // Keep last 60 data points

  useEffect(() => {
    if (liveMetrics.timestamp) {
      setHistory(prev => {
        const newHistory = [...prev, {
          timestamp: liveMetrics.timestamp,
          attentionScore: liveMetrics.attentionScore,
          alpha: liveMetrics.alpha,
          beta: liveMetrics.beta
        }];
        return newHistory.slice(-maxHistoryLength);
      });
    }
  }, [liveMetrics.timestamp]);

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getThemeColor = (score) => {
    if (score >= 75) return '#34d399'; // emerald-400
    if (score >= 50) return '#fbbf24'; // amber-400
    return '#fb7185'; // rose-400
  };

  // Modern circular progress ring matching the requested design
  const AttentionGauge = ({ value }) => {
    const percentage = Math.min(100, Math.max(0, value));
    
    // Circle properties
    const r = 85; 
    const circumference = 2 * Math.PI * r;
    const gap = 8;
    const segmentLength = (circumference / 4) - gap;
    const fillOffset = circumference - (percentage / 100) * circumference;
    
    const currentColor = getThemeColor(percentage);

    return (
      <div className="relative w-64 h-64 mx-auto mb-2 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Mask to create the 4 beautiful cutouts like the reference image */}
            <mask id="gap-mask">
               <circle 
                  cx="100" cy="100" r={r}
                  fill="none"
                  stroke="white"
                  strokeWidth="20"
                  strokeDasharray={`${segmentLength} ${gap}`}
                  transform="rotate(45 100 100)"
               />
            </mask>
          </defs>

          {/* Background Segmented Track */}
          <circle 
            cx="100" cy="100" r={r}
            fill="none"
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth="3"
            mask="url(#gap-mask)"
          />

          {/* Foreground Progress Ring with Glow */}
          <circle 
            cx="100" cy="100" r={r}
            fill="none"
            stroke={currentColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={fillOffset}
            mask="url(#gap-mask)"
            filter="url(#glow)"
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 1s ease'
            }}
          />
        </svg>

        {/* Center Text Layout matching the image typography */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
          <span 
            className="text-7xl font-display text-white transition-colors duration-500" 
            style={{ textShadow: `0 0 20px ${currentColor}40` }}
          >
            {Math.round(value)}
          </span>
          <span className="text-[10px] font-semibold tracking-[0.25em] text-slate-400 mt-3 uppercase opacity-80">
            Attention Score
          </span>
        </div>
      </div>
    );
  };

  const WaveRing = ({ label, value, color }) => {
    const percentage = Math.min(100, Math.max(0, value));
    
    // Circle properties for a smaller ring
    const r = 40; 
    const circumference = 2 * Math.PI * r;
    const gap = 4;
    const segmentLength = (circumference / 4) - gap;
    const fillOffset = circumference - (percentage / 100) * circumference;
    
    const [band, rangePart1, rangePart2] = label.split(' ');
    const bandId = band.toLowerCase();

    return (
      <div className="flex flex-col items-center justify-center p-5 glass-card rounded-2xl group transition-all duration-300 hover:border-emerald-500/20 shadow-lg">
        <div className="relative w-24 h-24 flex items-center justify-center mb-3">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <defs>
              <filter id={`glow-${bandId}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              
              <mask id={`gap-mask-${bandId}`}>
                 <circle 
                    cx="50" cy="50" r={r}
                    fill="none"
                    stroke="white"
                    strokeWidth="12"
                    strokeDasharray={`${segmentLength} ${gap}`}
                    transform="rotate(45 50 50)"
                 />
              </mask>
            </defs>

            {/* Background Track */}
            <circle 
              cx="50" cy="50" r={r}
              fill="none"
              stroke="rgba(148, 163, 184, 0.15)"
              strokeWidth="2.5"
              mask={`url(#gap-mask-${bandId})`}
            />

            {/* Foreground Progress Ring */}
            <circle 
              cx="50" cy="50" r={r}
              fill="none"
              stroke={color}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={fillOffset}
              mask={`url(#gap-mask-${bandId})`}
              filter={`url(#glow-${bandId})`}
              style={{
                transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 1s ease'
              }}
            />
          </svg>

          {/* Center Value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
            <span 
              className="text-2xl font-display text-white transition-colors duration-500 font-medium" 
              style={{ textShadow: `0 0 15px ${color}60` }}
            >
              {value.toFixed(1)}
            </span>
          </div>
        </div>
        
        {/* Label and Range */}
        <div className="text-center mt-1">
            <h4 className="text-[11px] font-bold uppercase tracking-widest mb-1 opacity-90" style={{ color: color }}>
              {band}
            </h4>
            <p className="text-[9px] text-slate-400 font-medium">
              {rangePart1} {rangePart2}
            </p>
        </div>
      </div>
    );
  };

  const AudioLevelBar = ({ label, value, color }) => {
    const pct = Math.max(0, Math.min(100, (value || 0) * 100));
    return (
      <div className="mb-3">
        <div className="flex justify-between mb-1 text-xs">
          <span className="text-gray-300 font-semibold">{label}</span>
          <span className="text-gray-200">{pct.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-900/70 h-2 rounded-full overflow-hidden border border-slate-700/60">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`p-5 rounded-2xl transition-all duration-500 glass-panel border border-white/5 ${sessionActive
          ? 'shadow-[0_0_15px_rgba(16,185,129,0.15)] border-emerald-500/30'
          : ''
        }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${sessionActive ? 'animate-pulse bg-white shadow-lg' : 'bg-gray-500'}`} />
            <span className={`font-bold text-lg ${sessionActive ? 'text-white' : 'text-gray-300'}`}>
              {sessionActive ? 'Live Session Active' : 'No Active Session'}
            </span>
          </div>
          {liveMetrics.isSoundActive && (
            <div className="flex items-center space-x-2 text-white bg-slate-700/50 backdrop-blur px-4 py-2 rounded-full">
              <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3.75a.75.75 0 01.75.75v11a.75.75 0 01-1.5 0v-11a.75.75 0 01.75-.75zm-4.5 3a.75.75 0 01.75.75v5a.75.75 0 01-1.5 0v-5a.75.75 0 01.75-.75zm9 0a.75.75 0 01.75.75v5a.75.75 0 01-1.5 0v-5a.75.75 0 01.75-.75z" />
              </svg>
              <span className="text-sm font-bold">Sound Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Attention Score Gauge */}
      <div className="glass-panel rounded-2xl p-8 hover:border-emerald-500/20 transition-all duration-500 group">
        <h3 className="text-2xl font-display font-semibold gradient-text mb-6 text-center flex items-center justify-center gap-2 drop-shadow-md">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
          </svg>
          Real-Time Attention Score
        </h3>
        <AttentionGauge value={liveMetrics.attentionScore || 0} />
        <p className="text-center text-sm text-gray-400 mt-4 font-medium">
          {liveMetrics.timestamp
            ? `⏱️ Last update: ${new Date(liveMetrics.timestamp).toLocaleTimeString()}`
            : '⌛ Waiting for data...'}
        </p>
      </div>

      {/* Session Phase + Baseline + Action Levels */}
      <div className="glass-effect rounded-2xl shadow-2xl p-8 border-2 border-white/50">
        <h3 className="text-2xl font-bold gradient-text mb-6">Closed-Loop Session State</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-slate-800/70 border border-slate-700 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Session Phase</p>
            <p className="text-lg font-bold text-white mt-1">{liveMetrics.sessionPhase || 'IDLE'}</p>
          </div>
          <div className="rounded-xl bg-slate-800/70 border border-slate-700 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Baseline Focus</p>
            <p className="text-lg font-bold text-orange-300 mt-1">{(liveMetrics.baselineFocus || 0).toFixed(1)}</p>
          </div>
          <div className="rounded-xl bg-slate-800/70 border border-slate-700 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Current Focus</p>
            <p className={`text-lg font-bold mt-1 ${getScoreColor(liveMetrics.attentionScore || 0)}`}>
              {(liveMetrics.attentionScore || 0).toFixed(1)}
            </p>
          </div>
        </div>

        <h4 className="text-sm font-bold text-gray-200 mb-3">Adaptive Sound Action Levels</h4>
        <AudioLevelBar label="Binaural" value={liveMetrics.audioLevels?.binaural} color="#38bdf8" />
        <AudioLevelBar label="Pulse" value={liveMetrics.audioLevels?.pulse} color="#f59e0b" />
        <AudioLevelBar label="Rain" value={liveMetrics.audioLevels?.rain} color="#22c55e" />
        <AudioLevelBar label="Drone" value={liveMetrics.audioLevels?.drone} color="#a855f7" />
        <AudioLevelBar label="Noise" value={liveMetrics.audioLevels?.noise} color="#94a3b8" />
      </div>

      {/* Brain Wave Powers */}
      <div className="glass-panel rounded-2xl p-8 hover:border-emerald-500/20 transition-all duration-500">
        <h3 className="text-2xl font-display font-semibold gradient-text mb-6 flex items-center gap-2 drop-shadow-md">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Brain Wave Activity
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mt-8">
          <WaveRing label="Alpha (8-13 Hz)" value={liveMetrics.alpha || 0} color="#c084fc" />
          <WaveRing label="Beta (13-30 Hz)" value={liveMetrics.beta || 0} color="#a855f7" />
          <WaveRing label="Theta (4-8 Hz)" value={liveMetrics.theta || 0} color="#f472b6" />
          <WaveRing label="Delta (0.5-4 Hz)" value={liveMetrics.delta || 0} color="#34d399" />
          {(liveMetrics.gamma !== undefined || true) && (
            <WaveRing label="Gamma (30-100 Hz)" value={liveMetrics.gamma || 0} color="#fbbf24" />
          )}
        </div>
      </div>

      {/* Mini Timeline Chart */}
      {history.length > 0 && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Score Timeline</h3>
          <div className="h-32 flex items-end space-x-1">
            {history.map((point, index) => {
              const height = (point.attentionScore / 100) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all duration-300 hover:from-purple-500 hover:to-purple-300"
                  style={{ height: `${height}%` }}
                  title={`${point.attentionScore.toFixed(1)} at ${new Date(point.timestamp).toLocaleTimeString()}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>-60s</span>
            <span>Now</span>
          </div>
        </div>
      )}

      {/* Session Stats */}
      {history.length > 0 && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Session Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-400">Average</p>
              <p className="text-xl font-bold text-white">
                {(history.reduce((sum, p) => sum + p.attentionScore, 0) / history.length).toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Peak</p>
              <p className="text-xl font-bold text-green-400">
                {Math.max(...history.map(p => p.attentionScore)).toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Duration</p>
              <p className="text-xl font-bold text-white">
                {Math.floor(history.length * 0.2)}s
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveEEGMonitor;
