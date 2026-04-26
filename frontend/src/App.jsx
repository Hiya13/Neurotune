import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import authService from './services/authService';
import websocketService from './services/websocketService';
import AuthView from './components/AuthView';
import DashboardLayout from './components/DashboardLayout';
import GamesPage from './pages/GamesPage';
import TideController from './components/games/TideController/TideController';
import MindGarden from './components/games/MindGarden/MindGarden';
import FocusFlight from './components/games/FocusFlight/FocusFlight';

function AppRoutes({ user, onLogout, wsConnected }) {
  const navigate = useNavigate();
  const handleExit = () => navigate('/games');

  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      wsConnected={wsConnected}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={null} />
        <Route path="/history" element={null} />
        <Route path="/profile" element={null} />
        <Route path="/games" element={<GamesPage wsConnected={wsConnected} />} />
        <Route path="/games/tide-controller" element={<TideController onExit={handleExit} />} />
        <Route path="/games/mind-garden" element={
          <MindGarden 
            wsUrl={import.meta.env.VITE_TIDE_WS_URL || 'ws://localhost:8080/'} 
            onExit={handleExit} 
          />
        } />
        <Route path="/games/focus-flight" element={
          <FocusFlight 
            wsUrl={import.meta.env.VITE_TIDE_WS_URL || 'ws://localhost:8080/'} 
            onExit={handleExit} 
          />
        } />
      </Routes>
    </DashboardLayout>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();

      if (token) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);

        // Connect to WebSocket after authentication
        if (currentUser) {
          try {
            await websocketService.connect(token, currentUser.id);
            setWsConnected(true);
          } catch (error) {
            console.error('Failed to connect WebSocket:', error);
          }
        }
      }

      setIsAuthReady(true);
      setIsLoading(false);
    };

    initAuth();

    // WebSocket event listeners
    websocketService.on('connected', () => {
      console.log('WebSocket connected event');
      setWsConnected(true);
    });

    websocketService.on('disconnected', () => {
      console.log('WebSocket disconnected event');
      setWsConnected(false);
    });

    websocketService.on('authenticated', () => {
      console.log('WebSocket authenticated');
    });

    // Cleanup
    return () => {
      websocketService.disconnect();
    };
  }, []);

  const handleLogin = async (userData) => {
    setUser(userData.user);

    // Connect WebSocket after login
    try {
      const token = authService.getToken();
      await websocketService.connect(token, userData.user.id);
      setWsConnected(true);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const handleLogout = () => {
    authService.logout();
    websocketService.disconnect();
    setUser(null);
    setWsConnected(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1218]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2dd4bf] mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading Neurotune...</p>
        </div>
      </div>
    );
  }

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1218]">
        <p className="text-slate-400">Initializing...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="dark min-h-screen bg-[#0a1218] text-white">
        {user ? (
          <AppRoutes 
            user={user} 
            onLogout={handleLogout} 
            wsConnected={wsConnected} 
          />
        ) : (
          <AuthView onLogin={handleLogin} />
        )}
      </div>
    </Router>
  );
}

export default App;
