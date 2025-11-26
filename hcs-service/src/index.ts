import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { submitSession, GameSession, validateSessionData } from './submit-session';
import { readSessions, getPlayerSessions, getLatestSessions, getLeaderboard } from './read-sessions';
import { HederaClient } from './hedera-client';
import ContractClient from './contract-client';
import { readLeaderboardTopic } from './read-leaderboard-topic';
import { MarketplaceClient } from './marketplace-client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialiser le client du contrat leaderboard
let contractClient: ContractClient | null = null;
try {
  if (process.env.LEADERBOARD_CONTRACT_ADDRESS) {
    contractClient = new ContractClient();
    console.log('Contract client initialized');
  }
} catch (error) {
  console.warn('Contract client not initialized:', error);
}

// Initialiser le client marketplace
let marketplaceClient: MarketplaceClient | null = null;
try {
  if (process.env.MARKETPLACE_CONTRACT_ADDRESS && process.env.NFT_CONTRACT_ADDRESS) {
    marketplaceClient = new MarketplaceClient();
    console.log('Marketplace client initialized');
  }
} catch (error) {
  console.warn('Marketplace client not initialized:', error);
}

// Middleware
app.use(express.json());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'];
app.use(cors({
  origin: (origin, callback) => {
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
    leaderboardTopicId: process.env.LEADERBOARD_TOPIC_ID || 'NOT_SET',
    contractAddress: process.env.LEADERBOARD_CONTRACT_ADDRESS || 'NOT_SET',
    contractAvailable: !!contractClient,
    marketplaceAddress: process.env.MARKETPLACE_CONTRACT_ADDRESS || 'NOT_SET',
    nftContractAddress: process.env.NFT_CONTRACT_ADDRESS || 'NOT_SET',
    marketplaceAvailable: !!marketplaceClient,
    errors: validation.errors
  });
});

// ========================================
// SESSION ENDPOINTS (HCS)
// ========================================

app.post('/api/sessions', async (req: Request, res: Response) => {
  try {
    const sessionData = req.body as GameSession;
    const validation = validateSessionData(sessionData);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session data',
        details: validation.errors
      });
    }

    console.log('Step 1/2: Submitting to HCS Topic GameSession...');
    const hcsResult = await submitSession(sessionData);

    if (!hcsResult.success) {
      return res.status(500).json({
        success: false,
        error: hcsResult.error || 'Failed to submit session to HCS'
      });
    }

    console.log(`Submitted to HCS: ${hcsResult.messageId}`);

    let contractTxHash: string | undefined;
    if (contractClient) {
      console.log('Step 2/2: Submitting to Smart Contract...');
      
      const contractResult = await contractClient.submitSession(
        sessionData.player,
        sessionData.score,
        sessionData.kills,
        sessionData.accuracy,
        sessionData.timeSurvived,
        Math.floor(sessionData.timestamp / 1000),
        hcsResult.messageId || 'unknown'
      );

      if (contractResult.success) {
        contractTxHash = contractResult.txHash;
        console.log(`Smart Contract updated: ${contractTxHash}`);
      } else {
        console.warn('Failed to submit to smart contract:', contractResult.error);
      }
    } else {
      console.warn('Contract client not available, skipping smart contract submission');
    }

    res.status(201).json({
      success: true,
      data: {
        messageId: hcsResult.messageId,
        topicId: hcsResult.topicId,
        sequenceNumber: hcsResult.sequenceNumber,
        consensusTimestamp: hcsResult.consensusTimestamp,
        transactionId: hcsResult.transactionId,
        contractTxHash: contractTxHash,
        contractSubmitted: !!contractTxHash
      }
    });

  } catch (error) {
    console.error('Error submitting session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

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

app.get('/api/sessions/player/:address', async (req: Request, res: Response) => {
  try {
    const playerAddress = req.params.address;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    if (!playerAddress.match(/^0\.0\.\d+$/) && !playerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid player address format'
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

// ========================================
// LEADERBOARD ENDPOINTS
// ========================================

app.get('/api/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const leaderboard = await getLeaderboard(limit);

    res.json({
      success: true,
      source: 'hcs',
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

app.get('/api/leaderboard/topic', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    
    console.log('Reading Leaderboard Topic messages...');
    const messages = await readLeaderboardTopic(limit);

    if (messages.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'No leaderboard data published yet. Play a game to populate it!'
      });
    }

    res.json({
      success: true,
      source: 'leaderboard-topic',
      topicId: process.env.LEADERBOARD_TOPIC_ID,
      count: messages.length,
      data: messages
    });

  } catch (error) {
    console.error('Error reading leaderboard topic:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/leaderboard/contract', async (req: Request, res: Response) => {
  if (!contractClient) {
    return res.status(503).json({
      success: false,
      error: 'Contract client not available. Check LEADERBOARD_CONTRACT_ADDRESS in .env'
    });
  }

  try {
    const top10 = await contractClient.getTop10();

    const formattedLeaderboard = top10
      .filter(player => player.exists)
      .map(player => ({
        player: player.playerAddress,
        highestScore: Number(player.highestScore),
        totalKills: Number(player.totalKills),
        totalSessions: Number(player.totalSessions),
        averageAccuracy: 0,
        lastUpdated: Number(player.lastUpdated)
      }));

    res.json({
      success: true,
      source: 'contract',
      contractAddress: contractClient.getContractAddress(),
      count: formattedLeaderboard.length,
      data: formattedLeaderboard
    });
  } catch (error) {
    console.error('Error reading contract leaderboard:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/leaderboard/contract/player/:address', async (req: Request, res: Response) => {
  if (!contractClient) {
    return res.status(503).json({
      success: false,
      error: 'Contract client not available'
    });
  }

  try {
    const playerAddress = req.params.address;
    
    const stats = await contractClient.getPlayerStats(playerAddress);
    const rank = await contractClient.getPlayerRank(playerAddress);

    if (!stats) {
      return res.json({
        success: true,
        found: false,
        player: playerAddress
      });
    }

    res.json({
      success: true,
      found: true,
      data: {
        player: stats.playerAddress,
        rank: rank,
        highestScore: Number(stats.highestScore),
        totalKills: Number(stats.totalKills),
        totalSessions: Number(stats.totalSessions),
        lastUpdated: Number(stats.lastUpdated)
      }
    });
  } catch (error) {
    console.error('Error reading player stats from contract:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========================================
// MARKETPLACE ENDPOINTS
// ========================================

app.get('/api/marketplace/listings', async (req: Request, res: Response) => {
  if (!marketplaceClient) {
    return res.status(503).json({
      success: false,
      error: 'Marketplace not available. Check MARKETPLACE_CONTRACT_ADDRESS in .env'
    });
  }

  try {
    console.log('Fetching marketplace listings...');
    const listings = await marketplaceClient.getActiveListings();

    const enrichedListings = await Promise.all(
      listings.map(async (listing) => {
        const metadata = await marketplaceClient.getNFTMetadata(listing.tokenId);
        return {
          ...listing,
          metadata
        };
      })
    );

    res.json({
      success: true,
      count: enrichedListings.length,
      data: enrichedListings
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/marketplace/list', async (req: Request, res: Response) => {
  if (!marketplaceClient) {
    return res.status(503).json({
      success: false,
      error: 'Marketplace not available'
    });
  }

  try {
    const { tokenId, price } = req.body;

    if (!tokenId || !price) {
      return res.status(400).json({
        success: false,
        error: 'tokenId and price are required'
      });
    }

    if (parseFloat(price) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be greater than 0'
      });
    }

    console.log(`Listing NFT ${tokenId} for ${price} HBAR...`);
    const result = await marketplaceClient.listNFT(tokenId, price);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      data: {
        listingId: result.listingId,
        txHash: result.txHash
      }
    });
  } catch (error) {
    console.error('Error listing NFT:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/marketplace/cancel', async (req: Request, res: Response) => {
  if (!marketplaceClient) {
    return res.status(503).json({
      success: false,
      error: 'Marketplace not available'
    });
  }

  try {
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({
        success: false,
        error: 'listingId is required'
      });
    }

    console.log(`Cancelling listing ${listingId}...`);
    const result = await marketplaceClient.cancelListing(listingId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: {
        txHash: result.txHash
      }
    });
  } catch (error) {
    console.error('Error cancelling listing:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========================================
// ERROR HANDLING
// ========================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

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
  const validation = HederaClient.validateEnv();
  
  if (!validation.valid) {
    console.error('Environment validation failed:');
    validation.errors.forEach(err => console.error(`   - ${err}`));
    console.error('\nPlease check your .env file');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('HCS Game Session API Server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Server running on: http://localhost:${PORT}`);
    console.log(`Network: ${HederaClient.getNetwork()}`);
    console.log(`GameSession Topic: ${process.env.GAME_SESSION_TOPIC_ID}`);
    console.log(`Leaderboard Topic: ${process.env.LEADERBOARD_TOPIC_ID}`);
    console.log(`Leaderboard Contract: ${process.env.LEADERBOARD_CONTRACT_ADDRESS || 'Not configured'}`);
    console.log(`Marketplace Contract: ${process.env.MARKETPLACE_CONTRACT_ADDRESS || 'Not configured'}`);
    console.log(`NFT Contract: ${process.env.NFT_CONTRACT_ADDRESS || 'Not configured'}`);
    console.log(`Operator: ${HederaClient.getOperatorId()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Available endpoints:');
    console.log('   GET  /health');
    console.log('   POST /api/sessions');
    console.log('   GET  /api/sessions');
    console.log('   GET  /api/sessions/latest');
    console.log('   GET  /api/sessions/player/:address');
    console.log('   GET  /api/leaderboard');
    console.log('   GET  /api/leaderboard/topic');
    console.log('   GET  /api/leaderboard/contract');
    console.log('   GET  /api/leaderboard/contract/player/:address');
    console.log('   GET  /api/marketplace/listings');
    console.log('   POST /api/marketplace/list');
    console.log('   POST /api/marketplace/cancel');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });
}

startServer();

export default app;