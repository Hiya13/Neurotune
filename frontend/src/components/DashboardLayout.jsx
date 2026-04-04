import { useState, useEffect } from 'react';
import authService from '../services/authService';
import Dashboard from './Dashboard';
import SessionHistory from './SessionHistory';
import Profile from './Profile';

function DashboardLayout({ user, onLogout, wsConnected }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [historicalSessions, setHistoricalSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSessions = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = authService.getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setHistoricalSessions(data.data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSessions();

      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchSessions, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    onLogout();
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            sessions={historicalSessions}
            onRefresh={fetchSessions}
            isLoading={isLoading}
            wsConnected={wsConnected}
          />
        );
      case 'history':
        return (
          <SessionHistory
            sessions={historicalSessions}
            isLoading={isLoading}
          />
        );
      case 'profile':
        return <Profile user={user} />;
      default:
        return <Dashboard user={user} sessions={historicalSessions} wsConnected={wsConnected} />;
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Navigation Bar */}
      <nav className="glass-panel sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-[#2dd4bf]">
                  <svg className="w-8 h-8 text-[#2dd4bf]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 7H7v6h6V7z" />
                    <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                  </svg>
                  <span>NeuroTune</span>
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`${currentView === 'dashboard'
                      ? 'border-[#2dd4bf] text-[#2dd4bf] font-semibold'
                      : 'border-transparent text-slate-400 hover:text-[#2dd4bf]'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('history')}
                  className={`${currentView === 'history'
                      ? 'border-[#2dd4bf] text-[#2dd4bf] font-semibold'
                      : 'border-transparent text-slate-400 hover:text-[#2dd4bf]'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300`}
                >
                  Session History
                </button>
                <button
                  onClick={() => setCurrentView('profile')}
                  className={`${currentView === 'profile'
                      ? 'border-[#2dd4bf] text-[#2dd4bf] font-semibold'
                      : 'border-transparent text-slate-400 hover:text-[#2dd4bf]'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300`}
                >
                  Profile
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-300">{user.email}</span>
              <button
                onClick={handleLogout}
                className="glass-button text-gray-200 px-6 py-2 rounded-lg text-sm font-semibold hover:text-red-400 border border-white/5"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="sm:hidden bg-slate-800 border-b border-slate-700">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`${currentView === 'dashboard'
                ? 'bg-slate-700/50 border-[#2dd4bf] text-[#2dd4bf]'
                : 'border-transparent text-gray-400 hover:bg-slate-700/30 hover:text-[#2dd4bf]'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left transition-colors duration-200`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`${currentView === 'history'
                ? 'bg-slate-700/50 border-[#2dd4bf] text-[#2dd4bf]'
                : 'border-transparent text-gray-400 hover:bg-slate-700/30 hover:text-[#2dd4bf]'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left transition-colors duration-200`}
          >
            Session History
          </button>
          <button
            onClick={() => setCurrentView('profile')}
            className={`${currentView === 'profile'
                ? 'bg-slate-700/50 border-[#2dd4bf] text-[#2dd4bf]'
                : 'border-transparent text-gray-400 hover:bg-slate-700/30 hover:text-[#2dd4bf]'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left transition-colors duration-200`}
          >
            Profile
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {renderView()}
      </main>
    </div>
  );
}

export default DashboardLayout;
