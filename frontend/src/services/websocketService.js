// WebSocket service for real-time EEG data streaming
class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.listeners = new Map();
    this.isConnecting = false;
  }

  connect(token, userId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return Promise.resolve();
    }

    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return Promise.resolve();
    }

    this.isConnecting = true;
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/eeg-stream';

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✓ WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          // Authenticate the connection
          this.ws.send(JSON.stringify({
            type: 'AUTH',
            token: token
          }));

          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected', event.code, event.reason);
          this.isConnecting = false;
          this.emit('disconnected');
          
          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
              this.connect(token, userId);
            }, this.reconnectDelay);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        console.error('Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  handleMessage(data) {
    switch (data.type) {
      case 'AUTH_SUCCESS':
        console.log('WebSocket authenticated successfully');
        this.emit('authenticated', data);
        break;
      
      case 'AUTH_ERROR':
        console.error('WebSocket authentication failed:', data.message);
        this.emit('auth_error', data);
        break;
      
      case 'EEG_DATA':
        this.emit('eeg_data', data);
        break;
      
      case 'SESSION_COMPLETE':
        this.emit('session_complete', data);
        break;
      
      case 'ERROR':
        console.error('WebSocket error message:', data.message);
        this.emit('error', data);
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  // Send control command to Python pipeline
  sendCommand(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type,
        ...data,
        timestamp: new Date().toISOString()
      }));
      return true;
    } else {
      console.warn('WebSocket is not connected');
      return false;
    }
  }

  // Start sound/session
  startSession(userId, config = {}) {
    return this.sendCommand('SESSION_CONTROL', {
      userId,
      command: 'start',
      action: 'start',
      parameters: {
        interventionType: config.interventionType || 'auditory',
        taskContext: config.taskContext || '',
        soundVolume: config.soundVolume || 50
      }
    });
  }

  // Stop sound/session
  stopSession(userId) {
    return this.sendCommand('SESSION_CONTROL', {
      userId,
      command: 'stop',
      action: 'stop'
    });
  }

  // Control sound
  controlSound(userId, action, parameters = {}) {
    return this.sendCommand('SOUND_CONTROL', {
      userId,
      command: action,
      action,
      parameters
    });
  }

  // Event listener system
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default new WebSocketService();
