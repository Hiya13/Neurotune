import { useState, useEffect } from 'react';
import websocketService from '../services/websocketService';
import authService from '../services/authService';
import LoggingForm from './LoggingForm';
import ScoreTrendChart from './ScoreTrendChart';
import LatestSessionDetails from './LatestSessionDetails';
import LiveEEGMonitor from './LiveEEGMonitor';
import SessionControls from './SessionControls';

function Dashboard({ user, sessions, onRefresh, isLoading, wsConnected }) {
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
    isSoundActive: false,
    timestamp: null
  });

  const [sessionActive, setSessionActive] = useState(false);
  const [viewMode, setViewMode] = useState('live'); // 'live' or 'manual'

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
    // Listen for real-time EEG data
    const handleEEGData = (data) => {
      setLiveMetrics({
        attentionScore: data.attentionScore || 0,
        alpha: data.alpha || 0,
        beta: data.beta || 0,
        theta: data.theta || 0,
        delta: data.delta || 0,
        gamma: data.gamma || 0,
        isSoundActive: data.isSoundActive || false,
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
        isSoundActive: false,
        timestamp: null
      });
      
      // Refresh session list
      if (onRefresh) {
        onRefresh();
      }

      alert('Session completed and saved successfully!');
    };

    websocketService.on('eeg_data', handleEEGData);
    websocketService.on('session_complete', handleSessionComplete);

    return () => {
      websocketService.off('eeg_data', handleEEGData);
      websocketService.off('session_complete', handleSessionComplete);
    };
  }, [onRefresh]);

  const handleStartSession = async (config) => {
    const success = websocketService.startSession(user.id, config);
    if (success) {
      setSessionActive(true);
      console.log('Session started with config:', config);
    } else {
      alert('Failed to start session. Please check WebSocket connection.');
    }
  };

  const handleStopSession = async () => {
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
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-1 flex">
            <button
              onClick={() => setViewMode('live')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'live'
                  ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              Live Monitoring
            </button>
            <button
              onClick={() => setViewMode('manual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'manual'
                  ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              Manual Entry
            </button>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5568d3] hover:to-[#653a8b] text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6 hover:border-purple-500/50 transition-all">
          <div className="text-sm font-medium text-gray-400">Total Sessions</div>
          <div className="mt-2 text-3xl font-bold text-white">{stats.totalSessions}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6 hover:border-purple-500/50 transition-all">
          <div className="text-sm font-medium text-gray-400">Average Score</div>
          <div className={`mt-2 text-3xl font-bold ${getScoreColor(stats.avgAttentionScore)}`}>
            {stats.avgAttentionScore}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6 hover:border-purple-500/50 transition-all">
          <div className="text-sm font-medium text-gray-400">Highest Score</div>
          <div className="mt-2 text-3xl font-bold text-green-400">{stats.maxAttentionScore}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6 hover:border-purple-500/50 transition-all">
          <div className="text-sm font-medium text-gray-400">Lowest Score</div>
          <div className="mt-2 text-3xl font-bold text-red-400">{stats.minAttentionScore}</div>
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
            />
          </div>

          {/* Live EEG Monitor */}
          <div className="lg:col-span-2">
            <LiveEEGMonitor
              liveMetrics={liveMetrics}
              sessionActive={sessionActive}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manual Logging Form */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Log Session Manually</h3>
            <LoggingForm user={user} onSuccess={onRefresh} />
          </div>

          {/* Latest Session Details */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Latest Session</h3>
            <LatestSessionDetails session={latestSession} />
          </div>
        </div>
      )}

      {/* Historical Trend Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Attention Score Trend (Historical)</h3>
        <ScoreTrendChart sessions={sessions} />
      </div>
    </div>
  );
}

export default Dashboard;
