import { useState, useEffect } from 'react';
import authService from './services/authService';
import websocketService from './services/websocketService';
import AuthView from './components/AuthView';
import DashboardLayout from './components/DashboardLayout';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Initializing...</p>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-transparent text-white">
      {user ? (
        <DashboardLayout
          user={user}
          onLogout={handleLogout}
          wsConnected={wsConnected}
        />
      ) : (
        <AuthView onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
