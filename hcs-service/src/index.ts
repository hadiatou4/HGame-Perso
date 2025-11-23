import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { submitSession, GameSession, validateSessionData, generateNonce, generateSessionId } from './submit-session';
import { readSessions, getPlayerSessions, getLatestSessions, getLeaderboard } from './read-sessions';
import { HederaClient } from './hedera-client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ========================================
// HEALTH CHECK
// ========================================

app.get('/health', (req: Request, res: Response) => {
  const validation = HederaClient.validateEnv();
  
  res.json({
    status: validation.valid ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    network: HederaClient.getNetwork(),
    topicId: process.env.GAME_SESSION_TOPIC_ID || 'NOT_SET',
    errors: validation.errors
  });
});

// ========================================
// SESSION ENDPOINTS
// ========================================

/**
 * POST /api/sessions - Submit a new game session
 */
app.post('/api/sessions', async (req: Request, res: Response) => {
  try {
    const sessionData = req.body as GameSession;

    // Auto-fill server-only fields if missing so clients can send a minimal payload
    if (!sessionData.sessionId) sessionData.sessionId = generateSessionId();
    if (!sessionData.nonce) sessionData.nonce = generateNonce();
    if (!sessionData.gameMode) sessionData.gameMode = 'singleplayer';

    // Validate session data
    const validation = validateSessionData(sessionData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session data',
        details: validation.errors
      });
    }

    // Submit to HCS
    const result = await submitSession(sessionData);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: {
          messageId: result.messageId,
          topicId: result.topicId,
          sequenceNumber: result.sequenceNumber,
          consensusTimestamp: result.consensusTimestamp,
          transactionId: result.transactionId
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to submit session'
      });
    }

  } catch (error) {
    console.error('Error submitting session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/sessions - Get all sessions (with optional filters)
 * Query params:
 *   - player: Filter by player address
 *   - limit: Maximum number of sessions to return (default: 20)
 */
app.get('/api/sessions', async (req: Request, res: Response) => {
  try {
    const player = req.query.player as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const sessions = await readSessions({ player, limit });

    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });

  } catch (error) {
    console.error('Error reading sessions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/sessions/latest - Get latest sessions
 * Query params:
 *   - limit: Maximum number of sessions (default: 10)
 */
app.get('/api/sessions/latest', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const sessions = await getLatestSessions(limit);

    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });

  } catch (error) {
    console.error('Error reading latest sessions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/sessions/player/:address - Get sessions for a specific player
 * Query params:
 *   - limit: Maximum number of sessions (default: 20)
 */
app.get('/api/sessions/player/:address', async (req: Request, res: Response) => {
  try {
    const playerAddress = req.params.address;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    // Validate Hedera address format
    if (!playerAddress.match(/^0\.0\.\d+$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid player address format. Expected: 0.0.XXXXXX'
      });
    }

    const sessions = await getPlayerSessions(playerAddress, limit);

    res.json({
      success: true,
      player: playerAddress,
      count: sessions.length,
      data: sessions
    });

  } catch (error) {
    console.error('Error reading player sessions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/leaderboard - Get leaderboard
 * Query params:
 *   - limit: Number of top players (default: 10)
 */
app.get('/api/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const leaderboard = await getLeaderboard(limit);

    res.json({
      success: true,
      count: leaderboard.length,
      data: leaderboard
    });

  } catch (error) {
    console.error('Error generating leaderboard:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// ========================================
// SERVER START
// ========================================

function startServer() {
  // Validate environment before starting
  const validation = HederaClient.validateEnv();
  
  if (!validation.valid) {
    console.error('❌ Environment validation failed:');
    validation.errors.forEach(err => console.error(`   - ${err}`));
    console.error('\n💡 Please check your .env file');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 HCS Game Session API Server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🌐 Network: ${HederaClient.getNetwork()}`);
    console.log(`📋 Topic ID: ${process.env.GAME_SESSION_TOPIC_ID}`);
    console.log(`👤 Operator: ${HederaClient.getOperatorId()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📚 Available endpoints:');
    console.log('   GET  /health');
    console.log('   POST /api/sessions');
    console.log('   GET  /api/sessions');
    console.log('   GET  /api/sessions/latest');
    console.log('   GET  /api/sessions/player/:address');
    console.log('   GET  /api/leaderboard');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });
}

startServer();

export default app;