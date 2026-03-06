import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

class EEGWebSocketServer {
  constructor(server) {
    this.wss = new WebSocketServer({ server, path: '/eeg-stream' });
    this.clients = new Map(); // Map of userId -> Set of WebSocket connections
    this.pythonClients = new Set(); // Python EEG pipeline connections
    
    this.initialize();
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
        this.relayToPython(data);
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

      ws.send(JSON.stringify({ 
        type: 'AUTH_SUCCESS', 
        message: 'WebSocket authenticated',
        userId: ws.userId
      }));

      console.log(`React client authenticated: ${ws.userId}`);
    } catch (error) {
      ws.send(JSON.stringify({ 
        type: 'AUTH_ERROR', 
        message: 'Authentication failed' 
      }));
      ws.close();
    }
  }

  registerPythonClient(ws, data) {
    // Simple authentication for Python client (you can enhance this)
    const pythonApiKey = data.apiKey;
    
    if (pythonApiKey === process.env.PYTHON_API_KEY) {
      ws.clientType = 'PYTHON';
      ws.userId = data.userId; // Python should send the userId it's monitoring
      ws.authenticated = true;
      this.pythonClients.add(ws);

      ws.send(JSON.stringify({ 
        type: 'REGISTER_SUCCESS', 
        message: 'Python client registered' 
      }));

      console.log(`Python EEG client registered for user: ${data.userId}`);
    } else {
      ws.send(JSON.stringify({ 
        type: 'REGISTER_ERROR', 
        message: 'Invalid API key' 
      }));
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
        alpha: data.alpha,
        beta: data.beta,
        theta: data.theta,
        delta: data.delta,
        gamma: data.gamma,
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

  relayToPython(data) {
    // Relay control commands from React to Python pipeline
    const userId = data.userId;
    
    // Find Python client for this user
    for (const pythonClient of this.pythonClients) {
      if (pythonClient.userId === userId && pythonClient.readyState === 1) {
        pythonClient.send(JSON.stringify({
          type: data.type,
          command: data.command,
          action: data.action,
          parameters: data.parameters,
          timestamp: new Date().toISOString()
        }));
        
        console.log(`Relayed ${data.type} command to Python for user ${userId}`);
        return;
      }
    }

    console.warn(`No Python client found for user ${userId}`);
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
      console.log(`Python client disconnected for user: ${ws.userId}`);
    }
  }

  // Utility method to check if user has active session
  hasActiveSession(userId) {
    for (const pythonClient of this.pythonClients) {
      if (pythonClient.userId === userId) {
        return true;
      }
    }
    return false;
  }

  // Get connected clients count
  getStats() {
    return {
      reactClients: this.clients.size,
      pythonClients: this.pythonClients.size,
      totalConnections: this.wss.clients.size
    };
  }
}

export default EEGWebSocketServer;
