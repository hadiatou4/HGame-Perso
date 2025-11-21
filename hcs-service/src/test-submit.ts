import { submitSession, generateNonce, generateSessionId } from './submit-session';
import { HederaClient } from './hedera-client';

/**
 * Test script to submit a sample game session
 */
async function testSubmitSession() {
  console.log('🧪 Testing session submission to HCS...\n');

  try {
    // Get operator ID as test player (in real app, this comes from wallet)
    const testPlayer = HederaClient.getOperatorId();

    // Generate test session data
    const testSession = {
      // Player identification
      player: testPlayer,
      sessionId: generateSessionId(),
      nonce: generateNonce(),

      // Game stats
      score: 15750,
      kills: 23,
      accuracy: 78.5,
      timeSurvived: 342, // 5 minutes 42 seconds

      // Metadata
      gameMode: 'singleplayer',
      shipType: 'fighter-class-2',
      timestamp: Date.now(),

      // Optional
      achievements: ['first-blood', 'survivor', 'sharpshooter']
    };

    console.log('📝 Test Session Data:');
    console.log(JSON.stringify(testSession, null, 2));
    console.log('');

    // Submit the session
    const result = await submitSession(testSession);

    if (result.success) {
      console.log('✅ Test successful!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📋 Message ID: ${result.messageId}`);
      console.log(`⏱️  Consensus Timestamp: ${result.consensusTimestamp}`);
      console.log(`🔢 Sequence Number: ${result.sequenceNumber}`);
      console.log(`🔗 Transaction ID: ${result.transactionId}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log('🔗 View on HashScan:');
      console.log(`https://hashscan.io/${HederaClient.getNetwork()}/topic/${result.topicId}\n`);
      
      console.log('💡 Next steps:');
      console.log('   1. View the session: npm run read-history');
      console.log('   2. Subscribe to new sessions: npm run subscribe');
      console.log('   3. Start the API server: npm run dev\n');
      
      process.exit(0);
    } else {
      console.error('❌ Test failed:', result.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  } finally {
    HederaClient.close();
  }
}

// Run the test
testSubmitSession();