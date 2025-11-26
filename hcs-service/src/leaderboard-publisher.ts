import { TopicMessageSubmitTransaction, TopicId } from '@hashgraph/sdk';
import { HederaClient } from './hedera-client';

/**
 * Structure du message leaderboard (correspond au struct du contrat)
 */
export interface LeaderboardEntry {
  rank: number;
  player: string;
  highestScore: number;
  totalKills: number;
  totalSessions: number;
  averageAccuracy: number;
  lastUpdated: number;
}

export interface LeaderboardMessage {
  timestamp: number;
  blockNumber: number;
  leaderboard: LeaderboardEntry[];
}

/**
 * Publie le leaderboard sur le Topic HCS Leaderboard
 */
export async function publishLeaderboard(
  leaderboard: LeaderboardEntry[],
  blockNumber: number
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  const topicId = process.env.LEADERBOARD_TOPIC_ID;
  
  if (!topicId) {
    throw new Error('LEADERBOARD_TOPIC_ID not set in .env file');
  }

  const client = HederaClient.getClient();

  try {
    // Créer le message JSON
    const message: LeaderboardMessage = {
      timestamp: Date.now(),
      blockNumber: blockNumber,
      leaderboard: leaderboard.filter(entry => entry.player !== '0x0000000000000000000000000000000000000000') // Filtrer les slots vides
    };

    const messageJson = JSON.stringify(message);

    console.log('📤 Publishing leaderboard to HCS Topic...');
    console.log(`   Topic ID: ${topicId}`);
    console.log(`   Block Number: ${blockNumber}`);
    console.log(`   Players in top 10: ${message.leaderboard.length}`);

    // Soumettre au topic
    const transaction = await new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(topicId))
      .setMessage(messageJson)
      .execute(client);

    const receipt = await transaction.getReceipt(client);
    const record = await transaction.getRecord(client);
    const consensusTimestamp = record.consensusTimestamp;
    const sequenceNumber = receipt.topicSequenceNumber;

    if (!sequenceNumber) {
      throw new Error('Failed to get sequence number');
    }

    const messageId = `${topicId}:${sequenceNumber}`;

    console.log('✅ Leaderboard published to HCS!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Message ID: ${messageId}`);
    console.log(`⏱️  Consensus Time: ${consensusTimestamp.toString()}`);
    console.log(`🔢 Sequence Number: ${sequenceNumber}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Afficher le top 3
    console.log('🏆 Top 3:');
    message.leaderboard.slice(0, 3).forEach(entry => {
      console.log(`   ${entry.rank}. ${entry.player.slice(0, 10)}... - Score: ${entry.highestScore}`);
    });
    console.log('');

    return {
      success: true,
      messageId: messageId
    };

  } catch (error) {
    console.error('❌ Error publishing leaderboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
