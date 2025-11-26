import { TopicCreateTransaction } from '@hashgraph/sdk';
import { HederaClient } from './hedera-client';

/**
 * Create a new HCS topic for game sessions
 * This script should only be run ONCE to create the topic
 */
async function createGameSessionTopic() {
  console.log('🚀 Creating GameSession HCS Topic on Hedera Testnet...\n');

  const client = HederaClient.getClient();

  try {
    // Create the topic transaction
    const transaction = await new TopicCreateTransaction()
      .setTopicMemo('Space War - Leaderboard Topic')
      .setAdminKey(HederaClient.getOperatorKey().publicKey)
      // Note: No submitKey set = anyone can submit messages (public topic)
      // If you want restricted submission, uncomment:
      // .setSubmitKey(HederaClient.getOperatorKey().publicKey)
      .execute(client);

    // Get the receipt with the topic ID
    const receipt = await transaction.getReceipt(client);
    const topicId = receipt.topicId;

    if (!topicId) {
      throw new Error('Failed to get topic ID from receipt');
    }

    console.log('✅ Topic Created Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Topic ID: ${topicId.toString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('⚠️  IMPORTANT: Add this to your .env file:');
    console.log(`GAME_SESSION_TOPIC_ID=${topicId.toString()}\n`);
    
    console.log('🔗 View on HashScan:');
    console.log(`https://hashscan.io/${HederaClient.getNetwork()}/topic/${topicId.toString()}\n`);
    
    console.log('📝 Topic Configuration:');
    console.log(`   - Memo: Space War - Game Sessions Topic`);
    console.log(`   - Admin Key: ${HederaClient.getOperatorId()}`);
    console.log(`   - Submit Key: Public (anyone can submit)`);
    console.log(`   - Network: ${HederaClient.getNetwork()}\n`);

    return topicId.toString();

  } catch (error) {
    console.error('❌ Error creating topic:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  } finally {
    HederaClient.close();
  }
}

// Run the script
if (require.main === module) {
  createGameSessionTopic()
    .then(topicId => {
      console.log('🎉 Setup complete! Topic ID:', topicId);
      console.log('\n📋 Next steps:');
      console.log('   1. Copy the GAME_SESSION_TOPIC_ID to your .env file');
      console.log('   2. Test submitting a session: npm run test-submit');
      console.log('   3. Start the API server: npm run dev');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

export { createGameSessionTopic };