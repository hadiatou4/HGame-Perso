import { TopicMessageSubmitTransaction, TopicId } from '@hashgraph/sdk';
import { HederaClient } from './hedera-client';

/**
 * Game session data structure matching the game stats
 */
export interface GameSession {
  // Player identification
  player: string;              // Hedera wallet address (0.0.XXXXXX)
  sessionId: string;           // Unique session identifier
  nonce: string;               // Unique nonce to prevent replay attacks
  
  // Game statistics
  score: number;               // Final score
  kills: number;               // Number of kills
  accuracy: number;            // Shooting accuracy (0-100)
  timeSurvived: number;        // Time survived in seconds
  
  // Metadata
  gameMode: string;            // 'singleplayer' | 'multiplayer'
  shipType?: string;           // Ship configuration used
  timestamp: number;           // Unix timestamp (milliseconds)
  
  // Optional fields
  achievements?: string[];     // Achievement IDs earned
  signature?: string;          // Digital signature for verification (future)
}

/**
 * Result returned after submitting a session to HCS
 */
export interface HCSSubmitResult {
  success: boolean;
  topicId: string;
  sequenceNumber: string;
  consensusTimestamp: string;
  messageId: string;           // Format: "topicId:sequenceNumber"
  transactionId: string;
  error?: string;
}

/**
 * Submit a game session to the Hedera Consensus Service topic
 * @param sessionData - Game session data to submit
 * @returns Promise with submission result
 */
export async function submitSession(sessionData: GameSession): Promise<HCSSubmitResult> {
  // Validate required fields
  const requiredFields: (keyof GameSession)[] = [
    'player', 'sessionId', 'nonce', 'score', 'kills', 
    'accuracy', 'timeSurvived', 'gameMode', 'timestamp'
  ];

  for (const field of requiredFields) {
    if (sessionData[field] === undefined || sessionData[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate player address format (Hedera account ID)
  if (!sessionData.player.match(/^0\.0\.\d+$/)) {
    throw new Error(`Invalid player address format. Expected: 0.0.XXXXXX, got: ${sessionData.player}`);
  }

  // Validate topic ID is configured
  const topicIdString = process.env.GAME_SESSION_TOPIC_ID;
  if (!topicIdString) {
    throw new Error(
      'GAME_SESSION_TOPIC_ID not set in .env file. ' +
      'Run "npm run create-topic" first to create the topic.'
    );
  }

  const client = HederaClient.getClient();

  try {
    // Convert session data to JSON string
    const messageJson = JSON.stringify(sessionData);
    
    console.log('📤 Submitting session to HCS...');
    console.log(`   Player: ${sessionData.player}`);
    console.log(`   Score: ${sessionData.score}`);
    console.log(`   Kills: ${sessionData.kills}`);
    console.log(`   Accuracy: ${sessionData.accuracy}%`);
    console.log(`   Time: ${sessionData.timeSurvived}s`);

    // Submit message to topic
    const transaction = await new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(topicIdString))
      .setMessage(messageJson)
      .execute(client);

    // Get receipt
    const receipt = await transaction.getReceipt(client);
    
    // Get detailed transaction record
    const record = await transaction.getRecord(client);
    const consensusTimestamp = record.consensusTimestamp;
    const sequenceNumber = receipt.topicSequenceNumber;

    if (!sequenceNumber) {
      throw new Error('Failed to get sequence number from receipt');
    }

    const result: HCSSubmitResult = {
      success: true,
      topicId: topicIdString,
      sequenceNumber: sequenceNumber.toString(),
      consensusTimestamp: consensusTimestamp.toString(),
      messageId: `${topicIdString}:${sequenceNumber}`,
      transactionId: transaction.transactionId.toString()
    };

    console.log('✅ Session submitted successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Message ID: ${result.messageId}`);
    console.log(`⏱️  Consensus Time: ${result.consensusTimestamp}`);
    console.log(`🔢 Sequence Number: ${result.sequenceNumber}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return result;

  } catch (error) {
    console.error('❌ Error submitting session:', error);
    
    const errorResult: HCSSubmitResult = {
      success: false,
      topicId: topicIdString,
      sequenceNumber: '',
      consensusTimestamp: '',
      messageId: '',
      transactionId: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return errorResult;
  }
}

/**
 * Generate a unique nonce for the session
 */
export function generateNonce(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Validate session data before submission
 */
export function validateSessionData(data: Partial<GameSession>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!data.player) errors.push('player is required');
  if (!data.sessionId) errors.push('sessionId is required');
  if (!data.nonce) errors.push('nonce is required');
  if (data.score === undefined) errors.push('score is required');
  if (data.kills === undefined) errors.push('kills is required');
  if (data.accuracy === undefined) errors.push('accuracy is required');
  if (data.timeSurvived === undefined) errors.push('timeSurvived is required');
  if (!data.gameMode) errors.push('gameMode is required');
  if (!data.timestamp) errors.push('timestamp is required');

  // Validate ranges
  if (data.accuracy !== undefined && (data.accuracy < 0 || data.accuracy > 100)) {
    errors.push('accuracy must be between 0 and 100');
  }

  if (data.score !== undefined && data.score < 0) {
    errors.push('score must be non-negative');
  }

  if (data.kills !== undefined && data.kills < 0) {
    errors.push('kills must be non-negative');
  }

  if (data.timeSurvived !== undefined && data.timeSurvived < 0) {
    errors.push('timeSurvived must be non-negative');
  }

  // Validate player address format
  if (data.player && !data.player.match(/^0\.0\.\d+$/)) {
    errors.push('player must be a valid Hedera account ID (format: 0.0.XXXXXX)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export { GameSession, HCSSubmitResult };