import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

class EEGWebSocketServer {
  constructor(server) {
    this.wss = new WebSocketServer({ server, path: '/eeg-stream' });
    this.clients = new Map(); // Map of userId -> Set of WebSocket connections
    this.pythonClients = new Set(); // Python EEG pipeline connections
    this.pythonClientsByUser = new Map(); // userId -> python websocket
    
    this.initialize();
  }

  sendToClient(ws, payload) {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(payload));
    }
  }

  notifyRuntimeStatus(userId, isAvailable) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    const payload = {
      type: 'RUNTIME_STATUS',
      userId,
      isAvailable,
      timestamp: new Date().toISOString()
    };

    userClients.forEach((client) => {
      this.sendToClient(client, payload);
    });
  }

  initialize() {
    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection attempt');
      
      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log('✓ WebSocket server initialized on path /eeg-stream');
  }

  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message.toString());

      // Handle authentication from React clients
      if (data.type === 'AUTH') {
        this.authenticateClient(ws, data.token);
        return;
      }

      // Handle Python pipeline registration
      if (data.type === 'PYTHON_REGISTER') {
        this.registerPythonClient(ws, data);
        return;
      }

      // Handle EEG data from Python pipeline
      if (data.type === 'EEG_DATA') {
        this.broadcastEEGData(data);
        return;
      }

      // Handle control commands from React (to Python)
      if (data.type === 'SOUND_CONTROL' || data.type === 'SESSION_CONTROL') {
        this.relayToPython(ws, data);
        return;
      }

      // Handle session complete from Python
      if (data.type === 'SESSION_COMPLETE') {
        this.handleSessionComplete(data);
        return;
      }

    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      ws.send(JSON.stringify({ 
        type: 'ERROR', 
        message: 'Invalid message format' 
      }));
    }
  }

  authenticateClient(ws, token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.userId = decoded.userId;
      ws.clientType = 'REACT';
      ws.authenticated = true;

      // Add to clients map
      if (!this.clients.has(ws.userId)) {
        this.clients.set(ws.userId, new Set());
      }
      this.clients.get(ws.userId).add(ws);

      this.sendToClient(ws, {
        type: 'AUTH_SUCCESS', 
        message: 'WebSocket authenticated',
        userId: ws.userId,
        runtimeAvailable: this.pythonClientsByUser.has(ws.userId)
      });

      this.sendToClient(ws, {
        type: 'RUNTIME_STATUS',
        userId: ws.userId,
        isAvailable: this.pythonClientsByUser.has(ws.userId),
        timestamp: new Date().toISOString()
      });

      console.log(`React client authenticated: ${ws.userId}`);
    } catch (error) {
      this.sendToClient(ws, {
        type: 'AUTH_ERROR', 
        message: 'Authentication failed' 
      });
      ws.close();
    }
  }

  registerPythonClient(ws, data) {
    // Simple authentication for Python client (you can enhance this)
    const pythonApiKey = data.apiKey;
    
    if (pythonApiKey === process.env.PYTHON_API_KEY) {
      const userId = String(data.userId || '').trim();
      if (!userId) {
        this.sendToClient(ws, {
          type: 'REGISTER_ERROR',
          message: 'Missing userId during Python registration'
        });
        ws.close();
        return;
      }

      // Ensure only one runtime client per user to avoid split-brain control loops.
      const existing = this.pythonClientsByUser.get(userId);
      if (existing && existing !== ws) {
        this.sendToClient(existing, {
          type: 'REGISTER_REPLACED',
          message: 'Another runtime client registered for this user. Closing old connection.'
        });
        existing.close();
        this.pythonClients.delete(existing);
      }

      ws.clientType = 'PYTHON';
      ws.userId = userId; // Python should send the userId it's monitoring
      ws.authenticated = true;
      this.pythonClients.add(ws);
      this.pythonClientsByUser.set(userId, ws);

      this.sendToClient(ws, {
        type: 'REGISTER_SUCCESS', 
        message: 'Python client registered' 
      });

      this.notifyRuntimeStatus(userId, true);

      console.log(`Python EEG client registered for user: ${userId}`);
    } else {
      this.sendToClient(ws, {
        type: 'REGISTER_ERROR', 
        message: 'Invalid API key' 
      });
      ws.close();
    }
  }

  broadcastEEGData(data) {
    // Broadcast EEG data to all React clients for the specific user
    const userId = data.userId;
    
    if (this.clients.has(userId)) {
      const userClients = this.clients.get(userId);
      const message = JSON.stringify({
        type: 'EEG_DATA',
        timestamp: data.timestamp || new Date().toISOString(),
        attentionScore: data.attentionScore,
        focusScore: data.focusScore ?? data.attentionScore,
        alpha: data.alpha,
        beta: data.beta,
        theta: data.theta,
        delta: data.delta,
        gamma: data.gamma,
        sessionPhase: data.sessionPhase,
        baselineFocus: data.baselineFocus,
        audioLevels: data.audioLevels,
        isSoundActive: data.isSoundActive,
        interventionType: data.interventionType,
        rawData: data.rawData // Optional: for advanced visualization
      });

      userClients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      });
    }
  }

  relayToPython(ws, data) {
    // Relay control commands from React to Python pipeline
    const userId = String(data.userId || ws.userId || '').trim();
    if (!userId) {
      this.sendToClient(ws, {
        type: 'COMMAND_ERROR',
        code: 'MISSING_USER_ID',
        message: 'Missing user id for command routing',
        commandType: data.type
      });
      return;
    }
    
    const pythonClient = this.pythonClientsByUser.get(userId);
    if (pythonClient && pythonClient.readyState === 1) {
      this.sendToClient(pythonClient, {
        type: data.type,
        command: data.command,
        action: data.action,
        parameters: data.parameters,
        timestamp: new Date().toISOString()
      });

      this.sendToClient(ws, {
        type: 'COMMAND_ACK',
        commandType: data.type,
        action: data.action,
        userId,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Relayed ${data.type} command to Python for user ${userId}`);
      return;
    }

    console.warn(`No Python client found for user ${userId}`);
    this.sendToClient(ws, {
      type: 'COMMAND_ERROR',
      code: 'RUNTIME_UNAVAILABLE',
      commandType: data.type,
      action: data.action,
      userId,
      message: 'Python runtime client is not connected for this user',
      timestamp: new Date().toISOString()
    });
    this.notifyRuntimeStatus(userId, false);
  }

  handleSessionComplete(data) {
    // When Python sends session complete, notify React clients
    const userId = data.userId;
    
    if (this.clients.has(userId)) {
      const userClients = this.clients.get(userId);
      const message = JSON.stringify({
        type: 'SESSION_COMPLETE',
        sessionData: data.sessionData,
        timestamp: new Date().toISOString()
      });

      userClients.forEach(client => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
    }
  }

  handleDisconnect(ws) {
    if (ws.clientType === 'REACT' && ws.userId) {
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(ws.userId);
        }
      }
      console.log(`React client disconnected: ${ws.userId}`);
    } else if (ws.clientType === 'PYTHON') {
      this.pythonClients.delete(ws);
      if (ws.userId && this.pythonClientsByUser.get(ws.userId) === ws) {
        this.pythonClientsByUser.delete(ws.userId);
        this.notifyRuntimeStatus(ws.userId, false);
      }
      console.log(`Python client disconnected for user: ${ws.userId}`);
    }
  }

  // Utility method to check if user has active session
  hasActiveSession(userId) {
    return this.pythonClientsByUser.has(userId);
  }

  // Get connected clients count
  getStats() {
    return {
      reactClients: this.clients.size,
      pythonClients: this.pythonClients.size,
      pythonUsers: Array.from(this.pythonClientsByUser.keys()),
      totalConnections: this.wss.clients.size
    };
  }
}

export default EEGWebSocketServer;
