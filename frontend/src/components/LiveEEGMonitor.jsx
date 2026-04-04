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
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getGaugeColor = (score) => {
    if (score >= 75) return '#10b981'; // green
    if (score >= 50) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  // Smooth and classy gauge visualization
  const AttentionGauge = ({ value }) => {
    const percentage = Math.min(100, Math.max(0, value));
    const rotation = (percentage / 100) * 180 - 90; // -90 to 90 degrees
    const circumference = Math.PI * 160; // π * diameter for semicircle
    const offset = circumference - (percentage / 100) * circumference;
    const currentColor = getGaugeColor(percentage);

    return (
      <div className="relative w-80 h-48 mx-auto mb-6">
        <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Dynamic gradient that matches the needle position */}
            <linearGradient id="gaugeGradient" gradientUnits="userSpaceOnUse" x1="20" y1="100" x2="180" y2="100">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#10b981" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
            </linearGradient>
            {/* Subtle shadow filter */}
            <filter id="gaugeShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
              <feOffset dx="0" dy="1" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Soft glow effect */}
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Subtle outer glow ring */}
          <path
            d="M 18 100 A 82 82 0 0 1 182 100"
            fill="none"
            stroke={currentColor}
            strokeWidth="0.5"
            strokeLinecap="round"
            opacity="0.15"
          />

          {/* Background arc - thinner and more elegant */}
          <path
            d="M 25 100 A 75 75 0 0 1 175 100"
            fill="none"
            stroke="#334155"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.4"
          />

          {/* Progress arc - single color based on current value */}
          <path
            d="M 25 100 A 75 75 0 0 1 175 100"
            fill="none"
            stroke={currentColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            filter="url(#gaugeGlow)"
            style={{
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.6s ease',
              strokeLinejoin: 'round'
            }}
          />

          {/* Refined tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = (tick / 100) * 180 - 90;
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + 68 * Math.cos(rad);
            const y1 = 100 + 68 * Math.sin(rad);
            const x2 = 100 + (tick === 0 || tick === 100 ? 64 : tick === 50 ? 63 : 65) * Math.cos(rad);
            const y2 = 100 + (tick === 0 || tick === 100 ? 64 : tick === 50 ? 63 : 65) * Math.sin(rad);

            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#9ca3af"
                strokeWidth={tick === 0 || tick === 100 ? "2" : "1.5"}
                strokeLinecap="round"
                opacity="0.5"
              />
            );
          })}

          {/* Labels with refined positioning */}
          <text x="25" y="115" fontSize="10" fill="#6b7280" textAnchor="start" fontWeight="600">0</text>
          <text x="100" y="26" fontSize="10" fill="#6b7280" textAnchor="middle" fontWeight="600">50</text>
          <text x="175" y="115" fontSize="10" fill="#6b7280" textAnchor="end" fontWeight="600">100</text>

          {/* Elegant needle with smooth transition */}
          <g
            transform={`rotate(${rotation} 100 100)`}
            style={{ transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {/* Needle glow matching gauge color */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="32"
              stroke={currentColor}
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.25"
              filter="url(#gaugeGlow)"
            />
            {/* Main needle - sleek and thin */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="32"
              stroke="#1f2937"
              strokeWidth="2"
              strokeLinecap="round"
              filter="url(#gaugeShadow)"
            />
            {/* Needle tip with color indicator */}
            <circle cx="100" cy="32" r="2.5" fill={currentColor} filter="url(#gaugeGlow)" />
            <circle cx="100" cy="32" r="1.5" fill="#ffffff" opacity="0.9" />
            {/* Center hub with refined design */}
            <circle cx="100" cy="100" r="7" fill="#1f2937" filter="url(#gaugeShadow)" />
            <circle cx="100" cy="100" r="5" fill="#374151" />
            <circle cx="100" cy="100" r="2.5" fill={currentColor} opacity="0.7" />
            <circle cx="100" cy="100" r="1" fill="#9ca3af" />
          </g>
        </svg>
        <div className="absolute bottom-14 left-0 right-0 text-center">
          <div className="inline-block px-5 py-2 rounded-full bg-slate-800/95 backdrop-blur-sm shadow-lg border border-slate-600/50">
            <span className={`text-4xl font-bold ${getScoreColor(value)}`} style={{ letterSpacing: '-0.02em' }}>
              {value.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const WaveBar = ({ label, value, color }) => {
    const percentage = Math.min(100, Math.max(0, value));

    return (
      <div className="mb-4 p-4 rounded-xl glass-card transition-all duration-300 hover:border-emerald-500/20 group">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-gray-100">{label}</span>
          <span className="text-sm font-bold px-3 py-1 rounded-full text-white shadow-md" style={{ backgroundColor: color }}>
            {value.toFixed(2)}
          </span>
        </div>
        <div className="w-full bg-slate-900/60 rounded-full h-4 overflow-hidden shadow-inner border border-slate-700/50">
          <div
            className="h-4 rounded-full transition-all duration-500 ease-out shadow-lg"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${color}dd, ${color})`
            }}
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

      {/* Brain Wave Powers */}
      <div className="glass-panel rounded-2xl p-8 hover:border-emerald-500/20 transition-all duration-500">
        <h3 className="text-2xl font-display font-semibold gradient-text mb-6 flex items-center gap-2 drop-shadow-md">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Brain Wave Activity
        </h3>
        <div className="space-y-3">
          <WaveBar label="Alpha (8-13 Hz)" value={liveMetrics.alpha || 0} color="#8b5cf6" />
          <WaveBar label="Beta (13-30 Hz)" value={liveMetrics.beta || 0} color="#a855f7" />
          <WaveBar label="Theta (4-8 Hz)" value={liveMetrics.theta || 0} color="#ec4899" />
          <WaveBar label="Delta (0.5-4 Hz)" value={liveMetrics.delta || 0} color="#10b981" />
          {liveMetrics.gamma !== undefined && (
            <WaveBar label="Gamma (30-100 Hz)" value={liveMetrics.gamma} color="#f59e0b" />
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
