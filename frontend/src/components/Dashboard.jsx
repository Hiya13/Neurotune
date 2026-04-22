import { useState, useEffect, useRef } from 'react';
import websocketService from '../services/websocketService';
import authService from '../services/authService';
import LoggingForm from './LoggingForm';
import ScoreTrendChart from './ScoreTrendChart';
import LatestSessionDetails from './LatestSessionDetails';
import LiveEEGMonitor from './LiveEEGMonitor';
import SessionControls from './SessionControls';
import { createSimulator, PROFILE_LABELS } from '../utils/eegSimulator';
import BrowserSoundEngine from '../audio/browserSoundEngine';

const ZERO_AUDIO_LEVELS = { binaural: 0, pulse: 0, rain: 0, drone: 0, noise: 0 };

function Dashboard({ user, sessions, onRefresh, isLoading, wsConnected }) {
  const browserSoundRef = useRef(null);
  const onRefreshRef = useRef(onRefresh);

  if (!browserSoundRef.current) {
    browserSoundRef.current = new BrowserSoundEngine();
  }

  const [stats, setStats] = useState({
    totalSessions: 0,
    avgAttentionScore: 0,
    maxAttentionScore: 0,
    minAttentionScore: 0
  });

  const [liveMetrics, setLiveMetrics] = useState({
    attentionScore: 0,
    alpha: 0,
    beta: 0,
    theta: 0,
    delta: 0,
    gamma: 0,
    sessionPhase: 'IDLE',
    baselineFocus: 0,
    audioLevels: ZERO_AUDIO_LEVELS,
    isSoundActive: false,
    timestamp: null
  });

  const [sessionActive, setSessionActive] = useState(false);
  const [viewMode, setViewMode] = useState('live'); // 'live' or 'manual'
  const [runtimeReady, setRuntimeReady] = useState(false);

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      const scores = sessions.map(s => s.attentionScore);
      setStats({
        totalSessions: sessions.length,
        avgAttentionScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
        maxAttentionScore: Math.max(...scores),
        minAttentionScore: Math.min(...scores)
      });
    }
  }, [sessions]);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    // Listen for real-time EEG data
    const handleEEGData = (data) => {
      const audioLevels = data.audioLevels || ZERO_AUDIO_LEVELS;
      const isSoundActive = Boolean(data.isSoundActive);

      if (browserSoundRef.current?.started) {
        browserSoundRef.current.updateParams(isSoundActive ? audioLevels : ZERO_AUDIO_LEVELS);
      }

      setLiveMetrics({
        attentionScore: data.attentionScore || 0,
        alpha: data.alpha || 0,
        beta: data.beta || 0,
        theta: data.theta || 0,
        delta: data.delta || 0,
        gamma: data.gamma || 0,
        sessionPhase: data.sessionPhase || 'IDLE',
        baselineFocus: data.baselineFocus || 0,
        audioLevels,
        isSoundActive,
        timestamp: data.timestamp
      });
    };

    const handleSessionComplete = (data) => {
      console.log('Session completed:', data);
      setSessionActive(false);
      setLiveMetrics({
        attentionScore: 0,
        alpha: 0,
        beta: 0,
        theta: 0,
        delta: 0,
        gamma: 0,
        sessionPhase: 'IDLE',
        baselineFocus: 0,
        audioLevels: ZERO_AUDIO_LEVELS,
        isSoundActive: false,
        timestamp: null
      });

      if (browserSoundRef.current?.started) {
        void browserSoundRef.current.stop();
      }
      // Refresh session list
      if (onRefreshRef.current) {
        onRefreshRef.current();
      }

      alert('Session completed and saved successfully!');
    };

    const handleRuntimeStatus = (data) => {
      setRuntimeReady(Boolean(data.isAvailable));
    };

    const handleCommandError = (data) => {
      if (data?.code === 'RUNTIME_UNAVAILABLE') {
        setSessionActive(false);
        setRuntimeReady(false);
        if (browserSoundRef.current?.started) {
          void browserSoundRef.current.stop();
        }
        alert('Python runtime is not connected. Start python_eeg_pipeline first.');
      }
    };

    websocketService.on('eeg_data', handleEEGData);
    websocketService.on('session_complete', handleSessionComplete);
    websocketService.on('runtime_status', handleRuntimeStatus);
    websocketService.on('command_error', handleCommandError);

    return () => {
      if (browserSoundRef.current?.started) {
        void browserSoundRef.current.stop();
      }

      websocketService.off('eeg_data', handleEEGData);
      websocketService.off('session_complete', handleSessionComplete);
      websocketService.off('runtime_status', handleRuntimeStatus);
      websocketService.off('command_error', handleCommandError);
    };
  }, []);

  // ── Simulator fallback when no live WS ────────────
  const simRef = useRef(null);
  const simRafRef = useRef(null);
  const simLastTime = useRef(null);
  const [simProfileLabel, setSimProfileLabel] = useState(null);

  useEffect(() => {
    // Only run simulator when WS is NOT connected
    if (wsConnected) {
      if (simRafRef.current) cancelAnimationFrame(simRafRef.current);
      simRef.current = null;
      simLastTime.current = null;
      setSimProfileLabel(null);
      return;
    }

    simRef.current = createSimulator();
    const state = simRef.current.getState();
    setSimProfileLabel(PROFILE_LABELS[state.profileName] || state.profileName);

    const loop = (ts) => {
      if (!simRef.current) return;
      if (simLastTime.current == null) simLastTime.current = ts;
      const dt = Math.min((ts - simLastTime.current) / 1000, 0.1);
      simLastTime.current = ts;

      const result = simRef.current.tick(dt);
      setLiveMetrics({
        attentionScore: Math.round(result.attentionScore),
        alpha: +(result.bandPowers.alpha * 100).toFixed(1),
        beta:  +(result.bandPowers.beta  * 100).toFixed(1),
        theta: +(result.bandPowers.theta * 100).toFixed(1),
        delta: +(result.bandPowers.delta * 100).toFixed(1),
        gamma: +(result.bandPowers.gamma * 100).toFixed(1),
        isSoundActive: false,
        timestamp: new Date().toISOString(),
      });

      simRafRef.current = requestAnimationFrame(loop);
    };

    simRafRef.current = requestAnimationFrame(loop);

    return () => {
      if (simRafRef.current) cancelAnimationFrame(simRafRef.current);
      simRef.current = null;
      simLastTime.current = null;
    };
  }, [wsConnected]);

  const handleStartSession = async (config) => {
    if (!runtimeReady) {
      alert('Python runtime is offline. Start the EEG pipeline and retry.');
      return;
    }

    if (config?.interventionType === 'auditory' || config?.interventionType === 'multi-modal') {
      try {
        await browserSoundRef.current.start();
        browserSoundRef.current.setMasterVolume((config.soundVolume || 50) / 100);
      } catch (error) {
        console.warn('Browser audio start failed:', error);
      }
    } else if (browserSoundRef.current?.started) {
      browserSoundRef.current.updateParams(ZERO_AUDIO_LEVELS);
    }

    const success = websocketService.startSession(user.id, config);
    if (success) {
      setSessionActive(true);
      console.log('Session started with config:', config);
    } else {
      if (browserSoundRef.current?.started) {
        void browserSoundRef.current.stop();
      }
      alert('Failed to start session. Please check WebSocket connection.');
    }
  };

  const handleStopSession = async () => {
    if (browserSoundRef.current?.started) {
      browserSoundRef.current.updateParams(ZERO_AUDIO_LEVELS);
      void browserSoundRef.current.stop();
    }

    const success = websocketService.stopSession(user.id);
    if (success) {
      console.log('Stop session command sent');
    } else {
      alert('Failed to stop session. Please check WebSocket connection.');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const latestSession = sessions && sessions.length > 0 ? sessions[0] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="glass-panel p-1 rounded-lg flex gap-1">
            <button
              onClick={() => setViewMode('live')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'live'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-md border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              Live Monitoring
            </button>
            <button
              onClick={() => setViewMode('manual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'manual'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-md border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              Manual Entry
            </button>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="glass-button bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 border-emerald-500/30 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6 rounded-xl hover:border-emerald-500/30 transition-all duration-300">
          <div className="text-sm font-medium text-slate-400">Total Sessions</div>
          <div className="mt-2 text-3xl font-display font-semibold text-white">{stats.totalSessions}</div>
        </div>
        <div className="glass-card p-6 rounded-xl hover:border-emerald-500/30 transition-all duration-300">
          <div className="text-sm font-medium text-slate-400">Average Score</div>
          <div className={`mt-2 text-3xl font-display font-semibold ${getScoreColor(stats.avgAttentionScore)}`}>
            {stats.avgAttentionScore}
          </div>
        </div>
        <div className="glass-card p-6 rounded-xl hover:border-emerald-500/30 transition-all duration-300">
          <div className="text-sm font-medium text-slate-400">Highest Score</div>
          <div className="mt-2 text-3xl font-display font-semibold text-emerald-400">{stats.maxAttentionScore}</div>
        </div>
        <div className="glass-card p-6 rounded-xl hover:border-emerald-500/30 transition-all duration-300">
          <div className="text-sm font-medium text-slate-400">Lowest Score</div>
          <div className="mt-2 text-3xl font-display font-semibold text-rose-400">{stats.minAttentionScore}</div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'live' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Controls */}
          <div className="lg:col-span-1">
            <SessionControls
              user={user}
              onStartSession={handleStartSession}
              onStopSession={handleStopSession}
              sessionActive={sessionActive}
              wsConnected={wsConnected}
              runtimeReady={runtimeReady}
            />
          </div>

          {/* Live EEG Monitor */}
          <div className="lg:col-span-2">
            <LiveEEGMonitor
              liveMetrics={liveMetrics}
              sessionActive={sessionActive || (!wsConnected && !!simRef.current)}
              simProfileLabel={!wsConnected ? simProfileLabel : null}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manual Logging Form */}
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Log Session Manually</h3>
            <LoggingForm user={user} onSuccess={onRefresh} />
          </div>

          {/* Latest Session Details */}
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Latest Session</h3>
            <LatestSessionDetails session={latestSession} />
          </div>
        </div>
      )}

      {/* Historical Trend Chart */}
      <div className="glass-card p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Attention Score Trend (Historical)</h3>
        <ScoreTrendChart sessions={sessions} />
      </div>
    </div>
  );
}

export default Dashboard;
