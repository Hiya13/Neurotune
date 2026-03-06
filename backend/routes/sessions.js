import express from 'express';
import Session from '../models/Session.js';
import { authenticateUser, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET all sessions for authenticated user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const sessions = await Session.find({ userId })
      .sort({ timestamp: -1 })
      .lean();
    
    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch sessions',
      message: error.message 
    });
  }
});

// GET single session by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user.uid
    });
    
    if (!session) {
      return res.status(404).json({ 
        success: false,
        error: 'Session not found' 
      });
    }
    
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch session',
      message: error.message 
    });
  }
});

// POST create new session
router.post('/', authenticateUser, async (req, res) => {
  try {
    const sessionData = {
      userId: req.user.uid,
      ...req.body
    };
    
    const session = new Session(sessionData);
    await session.save();
    
    res.status(201).json({
      success: true,
      message: 'Session logged successfully',
      data: session
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(400).json({ 
      success: false,
      error: 'Failed to create session',
      message: error.message 
    });
  }
});

// POST create session from Python pipeline (API key auth)
router.post('/python', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (apiKey !== process.env.PYTHON_API_KEY) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid API key' 
      });
    }
    
    const sessionData = {
      userId: req.body.userId,
      ...req.body
    };
    
    const session = new Session(sessionData);
    await session.save();
    
    res.status(201).json({
      success: true,
      message: 'Session logged successfully',
      data: session
    });
  } catch (error) {
    console.error('Error creating session from Python:', error);
    res.status(400).json({ 
      success: false,
      error: 'Failed to create session',
      message: error.message 
    });
  }
});

// PUT update session
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.uid },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!session) {
      return res.status(404).json({ 
        success: false,
        error: 'Session not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Session updated successfully',
      data: session
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(400).json({ 
      success: false,
      error: 'Failed to update session',
      message: error.message 
    });
  }
});

// DELETE session
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.uid
    });
    
    if (!session) {
      return res.status(404).json({ 
        success: false,
        error: 'Session not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete session',
      message: error.message 
    });
  }
});

// GET statistics for user
router.get('/stats/summary', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const stats = await Session.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgAttentionScore: { $avg: '$attentionScore' },
          maxAttentionScore: { $max: '$attentionScore' },
          minAttentionScore: { $min: '$attentionScore' },
          totalDuration: { $sum: '$sessionDuration' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: stats[0] || {
        totalSessions: 0,
        avgAttentionScore: 0,
        maxAttentionScore: 0,
        minAttentionScore: 0,
        totalDuration: 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
});

export default router;
