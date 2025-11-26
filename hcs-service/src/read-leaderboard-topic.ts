import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Structure du message du Topic Leaderboard
 */
export interface LeaderboardTopicMessage {
  timestamp: number;
  blockNumber: number;
  leaderboard: Array<{
    rank: number;
    player: string;
    highestScore: number;
    totalKills: number;
    totalSessions: number;
    averageAccuracy: number;
    lastUpdated: number;
  }>;
}

export interface LeaderboardTopicResponse {
  consensusTimestamp: string;
  message: string; // JSON stringifié
  sequenceNumber: number;
}

/**
 * Lit les messages du Topic Leaderboard via Mirror Node API (PLUS FIABLE)
 */
export async function readLeaderboardTopic(
  limit: number = 100
): Promise<LeaderboardTopicResponse[]> {
  
  const topicId = process.env.LEADERBOARD_TOPIC_ID;
  
  if (!topicId) {
    throw new Error('LEADERBOARD_TOPIC_ID not set in .env file');
  }

  const mirrorNodeUrl = process.env.MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com';

  console.log(`📖 Reading messages from Leaderboard Topic ${topicId} via Mirror Node...`);

  try {
    // ⭐ Utiliser l'API REST du Mirror Node (plus fiable que subscribe)
    const response = await axios.get(
      `${mirrorNodeUrl}/api/v1/topics/${topicId}/messages`,
      {
        params: {
          limit: limit,
          order: 'asc'
        },
        timeout: 10000 // 10 secondes de timeout
      }
    );

    const messages: LeaderboardTopicResponse[] = [];

    for (const msg of response.data.messages) {
      try {
        // Décoder le message base64
        const messageString = Buffer.from(msg.message, 'base64').toString('utf-8');
        
        messages.push({
          consensusTimestamp: msg.consensus_timestamp,
          message: messageString,
          sequenceNumber: msg.sequence_number
        });

        console.log(`   📨 Message ${msg.sequence_number} received`);

      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    }

    console.log(`✅ Found ${messages.length} message(s) from Leaderboard Topic`);
    return messages;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Mirror Node API error:', error.response?.data || error.message);
    } else {
      console.error('❌ Error reading topic:', error);
    }
    return [];
  }
}

/**
 * Récupère uniquement le dernier message (le plus récent)
 */
export async function getLatestLeaderboard(): Promise<LeaderboardTopicMessage | null> {
  try {
    const messages = await readLeaderboardTopic(100);
    
    if (messages.length === 0) {
      console.warn('⚠️ No messages found in Leaderboard Topic');
      return null;
    }

    // Prendre le dernier message
    const latestMessage = messages[messages.length - 1];
    const data = JSON.parse(latestMessage.message) as LeaderboardTopicMessage;

    console.log(`✅ Latest leaderboard from block ${data.blockNumber}`);
    console.log(`   Players: ${data.leaderboard.length}`);

    return data;

  } catch (error) {
    console.error('❌ Error reading latest leaderboard:', error);
    return null;
  }
}