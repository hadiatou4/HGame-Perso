import axios from 'axios';
import dotenv from 'dotenv';
import { GameSession } from './submit-session';

// Load environment variables from .env
dotenv.config();

/**
 * Mirror Node API response structure
 */
interface MirrorNodeMessage {
  consensus_timestamp: string;
  message: string;
  payer_account_id: string;
  running_hash: string;
  running_hash_version: number;
  sequence_number: number;
  topic_id: string;
  chunk_info?: {
    initial_transaction_id: string;
    number: number;
    total: number;
  };
}

interface MirrorNodeResponse {
  messages: MirrorNodeMessage[];
  links: {
    next: string | null;
  };
}

/**
 * Parsed game session from HCS
 */
export interface ParsedGameSession extends GameSession {
  sequenceNumber: number;
  consensusTimestamp: string;
  messageId: string;
}

/**
 * Read all game sessions from the HCS topic using Mirror Node API
 * @param options - Query options
 * @returns Array of parsed game sessions
 */
export async function readSessions(options?: {
  player?: string;
  limit?: number;
  startTime?: string;
  endTime?: string;
}): Promise<ParsedGameSession[]> {
  const topicId = process.env.GAME_SESSION_TOPIC_ID;
  
  if (!topicId) {
    throw new Error('GAME_SESSION_TOPIC_ID not set in .env file');
  }

  const mirrorNodeUrl = process.env.MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com';
  const sessions: ParsedGameSession[] = [];

  try {
    console.log('📖 Reading sessions from HCS topic...');
    console.log(`   Topic ID: ${topicId}`);
    if (options?.player) console.log(`   Filtering by player: ${options.player}`);

    // Build query parameters
    const params: Record<string, string> = {
      limit: (options?.limit || 100).toString(),
      order: 'desc' // Most recent first
    };

    if (options?.startTime) {
      params['timestamp'] = `gte:${options.startTime}`;
    }

    if (options?.endTime) {
      params['timestamp'] = params['timestamp'] 
        ? `${params['timestamp']}&timestamp=lte:${options.endTime}`
        : `lte:${options.endTime}`;
    }

    // Fetch messages from Mirror Node
    let url: string | null = `${mirrorNodeUrl}/api/v1/topics/${topicId}/messages`;
    let hasMore = true;
    let fetchedCount = 0;

    while (hasMore && (!options?.limit || fetchedCount < options.limit)) {
      if (!url) break; // no further pages
      const response: import('axios').AxiosResponse<MirrorNodeResponse> = await axios.get<MirrorNodeResponse>(url, { params });
      
      for (const msg of response.data.messages) {
        try {
          // Decode base64 message
          const decodedMessage = Buffer.from(msg.message, 'base64').toString('utf-8');
          const sessionData = JSON.parse(decodedMessage) as GameSession;

          // Filter by player if specified
          if (options?.player && sessionData.player !== options.player) {
            continue;
          }

          // Add metadata
          const parsedSession: ParsedGameSession = {
            ...sessionData,
            sequenceNumber: msg.sequence_number,
            consensusTimestamp: msg.consensus_timestamp,
            messageId: `${msg.topic_id}:${msg.sequence_number}`
          };

          sessions.push(parsedSession);
          fetchedCount++;

          // Stop if we reached the limit
          if (options?.limit && fetchedCount >= options.limit) {
            break;
          }

        } catch (parseError) {
          console.warn(`⚠️  Failed to parse message at sequence ${msg.sequence_number}`);
        }
      }

      // Check if there are more pages
      hasMore = !!response.data.links.next;
      if (hasMore) {
        url = response.data.links.next;
      }
    }

    console.log(`✅ Found ${sessions.length} session(s)`);
    return sessions;

  } catch (error) {
    console.error('❌ Error reading sessions:', error);
    if (axios.isAxiosError(error)) {
      console.error('Mirror Node API error:', error.response?.data || error.message);
    }
    throw error;
  }
}

/**
 * Get sessions for a specific player
 */
export async function getPlayerSessions(playerAddress: string, limit?: number): Promise<ParsedGameSession[]> {
  return readSessions({ player: playerAddress, limit });
}

/**
 * Get the latest sessions
 */
export async function getLatestSessions(limit: number = 10): Promise<ParsedGameSession[]> {
  return readSessions({ limit });
}

/**
 * Get a specific session by sequence number
 */
export async function getSessionBySequence(sequenceNumber: number): Promise<ParsedGameSession | null> {
  const sessions = await readSessions({ limit: 1000 });
  return sessions.find(s => s.sequenceNumber === sequenceNumber) || null;
}

/**
 * Get leaderboard (top players by score)
 */
export async function getLeaderboard(limit: number = 10): Promise<Array<{
  player: string;
  highestScore: number;
  totalSessions: number;
  totalKills: number;
  averageAccuracy: number;
}>> {
  const sessions = await readSessions();

  // Group by player
  const playerStats = new Map<string, {
    scores: number[];
    kills: number;
    accuracies: number[];
  }>();

  for (const session of sessions) {
    if (!playerStats.has(session.player)) {
      playerStats.set(session.player, {
        scores: [],
        kills: 0,
        accuracies: []
      });
    }

    const stats = playerStats.get(session.player)!;
    stats.scores.push(session.score);
    stats.kills += session.kills;
    stats.accuracies.push(session.accuracy);
  }

  // Calculate leaderboard
  const leaderboard = Array.from(playerStats.entries()).map(([player, stats]) => ({
    player,
    highestScore: Math.max(...stats.scores),
    totalSessions: stats.scores.length,
    totalKills: stats.kills,
    averageAccuracy: stats.accuracies.reduce((a, b) => a + b, 0) / stats.accuracies.length
  }));

  // Sort by highest score
  leaderboard.sort((a, b) => b.highestScore - a.highestScore);

  return leaderboard.slice(0, limit);
}

// CLI usage
if (require.main === module) {
  (async () => {
    try {
      console.log('🔍 Reading game sessions from HCS...\n');

      // Get command line arguments
      const args = process.argv.slice(2);
      const playerFilter = args.find(arg => arg.startsWith('--player='))?.split('=')[1];
      const limitArg = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
      const limit = limitArg ? parseInt(limitArg, 10) : 20;

      const sessions = await readSessions({ 
        player: playerFilter, 
        limit 
      });

      if (sessions.length === 0) {
        console.log('📭 No sessions found.');
        return;
      }

      console.log(`\n📊 Displaying ${sessions.length} session(s):\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      for (const session of sessions) {
        console.log(`\n📋 Session #${session.sequenceNumber}`);
        console.log(`   Message ID: ${session.messageId}`);
        console.log(`   Player: ${session.player}`);
        console.log(`   Score: ${session.score}`);
        console.log(`   Kills: ${session.kills}`);
        console.log(`   Accuracy: ${session.accuracy.toFixed(1)}%`);
        console.log(`   Time Survived: ${session.timeSurvived}s`);
        // console.log(`   Game Mode: ${session.gameMode}`);
        console.log(`   Timestamp: ${new Date(session.timestamp).toLocaleString()}`);
        console.log(`   Consensus Time: ${session.consensusTimestamp}`);
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Show leaderboard if no player filter
      if (!playerFilter) {
        console.log('\n🏆 Top 5 Leaderboard:\n');
        const leaderboard = await getLeaderboard(5);
        
        leaderboard.forEach((entry, index) => {
          console.log(`${index + 1}. ${entry.player}`);
          console.log(`   Highest Score: ${entry.highestScore}`);
          console.log(`   Total Sessions: ${entry.totalSessions}`);
          console.log(`   Total Kills: ${entry.totalKills}`);
          console.log(`   Avg Accuracy: ${entry.averageAccuracy.toFixed(1)}%\n`);
        });
      }

      process.exit(0);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}