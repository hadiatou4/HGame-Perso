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
  // Basic validation of required runtime fields (core stats)
  // Detailed validation is also available via `validateSessionData` used by the API.
  if (!sessionData.player) throw new Error('Missing required field: player');
  if (sessionData.score === undefined) throw new Error('Missing required field: score');
  if (sessionData.kills === undefined) throw new Error('Missing required field: kills');
  if (sessionData.accuracy === undefined) throw new Error('Missing required field: accuracy');
  if (sessionData.timeSurvived === undefined) throw new Error('Missing required field: timeSurvived');
  if (sessionData.timestamp === undefined) throw new Error('Missing required field: timestamp');

  // Validate player address format (Hedera account ID OR EVM address)
  const isHederaFormat = sessionData.player.match(/^0\.0\.\d+$/);
  const isEvmFormat = sessionData.player.match(/^0x[a-fA-F0-9]{40}$/);
  
  if (!isHederaFormat && !isEvmFormat) {
    throw new Error(`Invalid player address format. Expected: 0.0.XXXXXX or 0x... EVM address, got: ${sessionData.player}`);
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
    // Build a minimal message payload for HCS (exclude server-only fields like sessionId/nonce)
    const messagePayload: Partial<GameSession> = {
      player: sessionData.player,
      score: sessionData.score,
      kills: sessionData.kills,
      accuracy: sessionData.accuracy,
      timeSurvived: sessionData.timeSurvived,
      timestamp: sessionData.timestamp
    };

    // Include optional fields if present
    if (sessionData.shipType) messagePayload.shipType = sessionData.shipType;
    if (sessionData.achievements) messagePayload.achievements = sessionData.achievements;

    const messageJson = JSON.stringify(messagePayload);
    
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
  // sessionId and nonce are generated server-side if not provided, so they are optional here
  if (data.score === undefined) errors.push('score is required');
  if (data.kills === undefined) errors.push('kills is required');
  if (data.accuracy === undefined) errors.push('accuracy is required');
  if (data.timeSurvived === undefined) errors.push('timeSurvived is required');
  // gameMode is optional and will default to 'singleplayer' if not provided
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

  // Validate player address format (both Hedera and EVM formats accepted)
  if (data.player && !data.player.match(/^0\.0\.\d+$/) && !data.player.match(/^0x[a-fA-F0-9]{40}$/)) {
    errors.push('player must be a valid Hedera account ID (0.0.XXXXXX) or EVM address (0x...)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Interfaces `GameSession` and `HCSSubmitResult` are exported where declared above.
// No trailing named export needed — removed to avoid TS2484 duplicate export error.