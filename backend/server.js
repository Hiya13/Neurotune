import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import EEGWebSocketServer from './websocket/websocketServer.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attention-monitoring')
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch((err) => console.error('✗ MongoDB connection error:', err));

// Initialize WebSocket Server
const wsServer = new EEGWebSocketServer(httpServer);

// Make WebSocket server accessible to routes if needed
app.set('wsServer', wsServer);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'NeuroTune API is running',
    timestamp: new Date().toISOString()
  });
});// WebSocket stats endpoint
app.get('/api/ws/stats', (req, res) => {
  res.json({
    success: true,
    data: wsServer.getStats()
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server available at ws://localhost:${PORT}/eeg-stream`);
});

export default app;
