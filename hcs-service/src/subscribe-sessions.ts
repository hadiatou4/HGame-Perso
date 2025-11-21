import { TopicMessageQuery, TopicId } from '@hashgraph/sdk';
import { HederaClient } from './hedera-client';
import { GameSession } from './submit-session';

/**
 * Subscribe to new game sessions in real-time using HCS
 * @param onMessage - Callback function when new session is received
 * @param options - Subscription options
 */
export async function subscribeSessions(
  onMessage: (session: GameSession & { sequenceNumber: number; consensusTimestamp: string }) => void,
  options?: {
    player?: string;
    startTime?: Date;
  }
): Promise<void> {
  const topicId = process.env.GAME_SESSION_TOPIC_ID;
  
  if (!topicId) {
    throw new Error('GAME_SESSION_TOPIC_ID not set in .env file');
  }

  const client = HederaClient.getClient();

  try {
    console.log('👂 Subscribing to game sessions...');
    console.log(`   Topic ID: ${topicId}`);
    if (options?.player) console.log(`   Filtering by player: ${options.player}`);
    console.log('   Waiting for new sessions...\n');

    // Create subscription query
    let query = new TopicMessageQuery()
      .setTopicId(TopicId.fromString(topicId));

    // Set start time if provided, otherwise start from now
    if (options?.startTime) {
      query = query.setStartTime(options.startTime);
    }

    // Subscribe to messages
    query.subscribe(
      client,
      null, // no error handler needed here
      (message) => {
        try {
          // Decode message
          const messageString = Buffer.from(message.contents).toString('utf-8');
          const sessionData = JSON.parse(messageString) as GameSession;

          // Filter by player if specified
          if (options?.player && sessionData.player !== options.player) {
            return; // Skip this message
          }

          // Call the callback with session data and metadata
          onMessage({
            ...sessionData,
            sequenceNumber: Number(message.sequenceNumber),
            consensusTimestamp: message.consensusTimestamp.toString()
          });

        } catch (parseError) {
          console.error('⚠️  Failed to parse message:', parseError);
        }
      }
    );

    console.log('✅ Subscription active. Press Ctrl+C to stop.\n');

  } catch (error) {
    console.error('❌ Error subscribing to sessions:', error);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  (async () => {
    try {
      // Get command line arguments
      const args = process.argv.slice(2);
      const playerFilter = args.find(arg => arg.startsWith('--player='))?.split('=')[1];

      await subscribeSessions(
        (session) => {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🎮 New Game Session Received!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`📋 Sequence: #${session.sequenceNumber}`);
          console.log(`👤 Player: ${session.player}`);
          console.log(`🎯 Score: ${session.score}`);
          console.log(`💀 Kills: ${session.kills}`);
          console.log(`🎯 Accuracy: ${session.accuracy.toFixed(1)}%`);
          console.log(`⏱️  Time Survived: ${session.timeSurvived}s`);
          console.log(`🎲 Game Mode: ${session.gameMode}`);
          console.log(`📅 Timestamp: ${new Date(session.timestamp).toLocaleString()}`);
          console.log(`⏰ Consensus: ${session.consensusTimestamp}`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        },
        {
          player: playerFilter
        }
      );

      // Keep process running
      await new Promise(() => {}); // Never resolves, keeps running until Ctrl+C

    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}

export { subscribeSessions };
import { TopicMessageQuery, TopicId } from '@hashgraph/sdk';
import { HederaClient } from './hedera-client';
import { GameSession } from './submit-session';

/**
 * Subscribe to new game sessions in real-time using HCS
 * @param onMessage - Callback function when new session is received
 * @param options - Subscription options
 */
export async function subscribeSessions(
  onMessage: (session: GameSession & { sequenceNumber: number; consensusTimestamp: string }) => void,
  options?: {
    player?: string;
    startTime?: Date;
  }
): Promise<void> {
  const topicId = process.env.GAME_SESSION_TOPIC_ID;
  
  if (!topicId) {
    throw new Error('GAME_SESSION_TOPIC_ID not set in .env file');
  }

  const client = HederaClient.getClient();

  try {
    console.log('👂 Subscribing to game sessions...');
    console.log(`   Topic ID: ${topicId}`);
    if (options?.player) console.log(`   Filtering by player: ${options.player}`);
    console.log('   Waiting for new sessions...\n');

    // Create subscription query
    let query = new TopicMessageQuery()
      .setTopicId(TopicId.fromString(topicId));

    // Set start time if provided, otherwise start from now
    if (options?.startTime) {
      query = query.setStartTime(options.startTime);
    }

    // Subscribe to messages
    query.subscribe(
      client,
      null, // no error handler needed here
      (message) => {
        try {
          // Decode message
          const messageString = Buffer.from(message.contents).toString('utf-8');
          const sessionData = JSON.parse(messageString) as GameSession;

          // Filter by player if specified
          if (options?.player && sessionData.player !== options.player) {
            return; // Skip this message
          }

          // Call the callback with session data and metadata
          onMessage({
            ...sessionData,
            sequenceNumber: Number(message.sequenceNumber),
            consensusTimestamp: message.consensusTimestamp.toString()
          });

        } catch (parseError) {
          console.error('⚠️  Failed to parse message:', parseError);
        }
      }
    );

    console.log('✅ Subscription active. Press Ctrl+C to stop.\n');

  } catch (error) {
    console.error('❌ Error subscribing to sessions:', error);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  (async () => {
    try {
      // Get command line arguments
      const args = process.argv.slice(2);
      const playerFilter = args.find(arg => arg.startsWith('--player='))?.split('=')[1];

      await subscribeSessions(
        (session) => {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🎮 New Game Session Received!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`📋 Sequence: #${session.sequenceNumber}`);
          console.log(`👤 Player: ${session.player}`);
          console.log(`🎯 Score: ${session.score}`);
          console.log(`💀 Kills: ${session.kills}`);
          console.log(`🎯 Accuracy: ${session.accuracy.toFixed(1)}%`);
          console.log(`⏱️  Time Survived: ${session.timeSurvived}s`);
          console.log(`🎲 Game Mode: ${session.gameMode}`);
          console.log(`📅 Timestamp: ${new Date(session.timestamp).toLocaleString()}`);
          console.log(`⏰ Consensus: ${session.consensusTimestamp}`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        },
        {
          player: playerFilter
        }
      );

      // Keep process running
      await new Promise(() => {}); // Never resolves, keeps running until Ctrl+C

    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}

export { subscribeSessions };
import { TopicMessageQuery, TopicId } from '@hashgraph/sdk';
import { HederaClient } from './hedera-client';
import { GameSession } from './submit-session';

/**
 * Subscribe to new game sessions in real-time using HCS
 * @param onMessage - Callback function when new session is received
 * @param options - Subscription options
 */
export async function subscribeSessions(
  onMessage: (session: GameSession & { sequenceNumber: number; consensusTimestamp: string }) => void,
  options?: {
    player?: string;
    startTime?: Date;
  }
): Promise<void> {
  const topicId = process.env.GAME_SESSION_TOPIC_ID;
  
  if (!topicId) {
    throw new Error('GAME_SESSION_TOPIC_ID not set in .env file');
  }

  const client = HederaClient.getClient();

  try {
    console.log('👂 Subscribing to game sessions...');
    console.log(`   Topic ID: ${topicId}`);
    if (options?.player) console.log(`   Filtering by player: ${options.player}`);
    console.log('   Waiting for new sessions...\n');

    // Create subscription query
    let query = new TopicMessageQuery()
      .setTopicId(TopicId.fromString(topicId));

    // Set start time if provided, otherwise start from now
    if (options?.startTime) {
      query = query.setStartTime(options.startTime);
    }

    // Subscribe to messages
    query.subscribe(
      client,
      null, // no error handler needed here
      (message) => {
        try {
          // Decode message
          const messageString = Buffer.from(message.contents).toString('utf-8');
          const sessionData = JSON.parse(messageString) as GameSession;

          // Filter by player if specified
          if (options?.player && sessionData.player !== options.player) {
            return; // Skip this message
          }

          // Call the callback with session data and metadata
          onMessage({
            ...sessionData,
            sequenceNumber: Number(message.sequenceNumber),
            consensusTimestamp: message.consensusTimestamp.toString()
          });

        } catch (parseError) {
          console.error('⚠️  Failed to parse message:', parseError);
        }
      }
    );

    console.log('✅ Subscription active. Press Ctrl+C to stop.\n');

  } catch (error) {
    console.error('❌ Error subscribing to sessions:', error);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  (async () => {
    try {
      // Get command line arguments
      const args = process.argv.slice(2);
      const playerFilter = args.find(arg => arg.startsWith('--player='))?.split('=')[1];

      await subscribeSessions(
        (session) => {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🎮 New Game Session Received!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`📋 Sequence: #${session.sequenceNumber}`);
          console.log(`👤 Player: ${session.player}`);
          console.log(`🎯 Score: ${session.score}`);
          console.log(`💀 Kills: ${session.kills}`);
          console.log(`🎯 Accuracy: ${session.accuracy.toFixed(1)}%`);
          console.log(`⏱️  Time Survived: ${session.timeSurvived}s`);
          console.log(`🎲 Game Mode: ${session.gameMode}`);
          console.log(`📅 Timestamp: ${new Date(session.timestamp).toLocaleString()}`);
          console.log(`⏰ Consensus: ${session.consensusTimestamp}`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        },
        {
          player: playerFilter
        }
      );

      // Keep process running
      await new Promise(() => {}); // Never resolves, keeps running until Ctrl+C

    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}

export { subscribeSessions };

import { TopicMessageQuery, TopicId } from '@hashgraph/sdk';
import { HederaClient } from './hedera-client';
import { GameSession } from './submit-session';

/**
 * Subscribe to new game sessions in real-time using HCS
 * @param onMessage - Callback function when new session is received
 * @param options - Subscription options
 */
export async function subscribeSessions(
  onMessage: (session: GameSession & { sequenceNumber: number; consensusTimestamp: string }) => void,
  options?: {
    player?: string;
    startTime?: Date;
  }
): Promise<void> {
  const topicId = process.env.GAME_SESSION_TOPIC_ID;
  
  if (!topicId) {
    throw new Error('GAME_SESSION_TOPIC_ID not set in .env file');
  }

  const client = HederaClient.getClient();

  try {
    console.log('👂 Subscribing to game sessions...');
    console.log(`   Topic ID: ${topicId}`);
    if (options?.player) console.log(`   Filtering by player: ${options.player}`);
    console.log('   Waiting for new sessions...\n');

    // Create subscription query
    let query = new TopicMessageQuery()
      .setTopicId(TopicId.fromString(topicId));

    // Set start time if provided, otherwise start from now
    if (options?.startTime) {
      import { TopicMessageQuery, TopicId } from '@hashgraph/sdk';
      import { HederaClient } from './hedera-client';
      import { GameSession } from './submit-session';

      /**
       * Subscribe to new game sessions in real-time using HCS
       * @param onMessage - Callback function when new session is received
       * @param options - Subscription options
       */
      export async function subscribeSessions(
        onMessage: (session: GameSession & { sequenceNumber: number; consensusTimestamp: string }) => void,
        options?: {
          player?: string;
          startTime?: Date;
        }
      ): Promise<void> {
        const topicId = process.env.GAME_SESSION_TOPIC_ID;
  
        if (!topicId) {
          throw new Error('GAME_SESSION_TOPIC_ID not set in .env file');
        }

        const client = HederaClient.getClient();

        try {
          console.log('👂 Subscribing to game sessions...');
          console.log(`   Topic ID: ${topicId}`);
          if (options?.player) console.log(`   Filtering by player: ${options.player}`);
          console.log('   Waiting for new sessions...\n');

          // Create subscription query
          let query = new TopicMessageQuery()
            .setTopicId(TopicId.fromString(topicId));

          // Set start time if provided, otherwise start from now
          if (options?.startTime) {
            query = query.setStartTime(options.startTime);
          }

          // Subscribe to messages
          query.subscribe(
            client,
            null, // no error handler needed here
            (message) => {
              try {
                // Decode message
                const messageString = Buffer.from(message.contents).toString('utf-8');
                const sessionData = JSON.parse(messageString) as GameSession;

                // Filter by player if specified
                if (options?.player && sessionData.player !== options.player) {
                  return; // Skip this message
                }

                // Call the callback with session data and metadata
                onMessage({
                  ...sessionData,
                  sequenceNumber: Number(message.sequenceNumber),
                  consensusTimestamp: message.consensusTimestamp.toString()
                });

              } catch (parseError) {
                console.error('⚠️  Failed to parse message:', parseError);
              }
            }
          );

          console.log('✅ Subscription active. Press Ctrl+C to stop.\n');

        } catch (error) {
          console.error('❌ Error subscribing to sessions:', error);
          throw error;
        }
      }

      // CLI usage
      if (require.main === module) {
        (async () => {
          try {
            // Get command line arguments
            const args = process.argv.slice(2);
            const playerFilter = args.find(arg => arg.startsWith('--player='))?.split('=')[1];

            await subscribeSessions(
              (session) => {
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('🎮 New Game Session Received!');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`📋 Sequence: #${session.sequenceNumber}`);
                console.log(`👤 Player: ${session.player}`);
                console.log(`🎯 Score: ${session.score}`);
                console.log(`💀 Kills: ${session.kills}`);
                console.log(`🎯 Accuracy: ${session.accuracy.toFixed(1)}%`);
                console.log(`⏱️  Time Survived: ${session.timeSurvived}s`);
                console.log(`🎲 Game Mode: ${session.gameMode}`);
                console.log(`📅 Timestamp: ${new Date(session.timestamp).toLocaleString()}`);
                console.log(`⏰ Consensus: ${session.consensusTimestamp}`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
              },
              {
                player: playerFilter
              }
            );

            // Keep process running
            await new Promise(() => {}); // Never resolves, keeps running until Ctrl+C

          } catch (error) {
            console.error('❌ Error:', error);
            process.exit(1);
          }
        })();
      }

      export { subscribeSessions };