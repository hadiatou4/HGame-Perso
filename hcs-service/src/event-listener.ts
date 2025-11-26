import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { publishLeaderboard, LeaderboardEntry } from './leaderboard-publisher';

dotenv.config();

/**
 * Event Listener qui écoute LeaderboardUpdated et publie sur HCS
 */
class LeaderboardEventListener {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private contractAddress: string;

  constructor() {
    const contractAddress = process.env.LEADERBOARD_CONTRACT_ADDRESS;
    const rpcUrl = process.env.HEDERA_RPC_URL || 'https://testnet.hashio.io/api';

    if (!contractAddress) {
      throw new Error('LEADERBOARD_CONTRACT_ADDRESS not set in .env file');
    }

    if (!process.env.LEADERBOARD_TOPIC_ID) {
      throw new Error('LEADERBOARD_TOPIC_ID not set in .env file');
    }

    this.contractAddress = contractAddress;

    // Provider (read-only, pas besoin de wallet)
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Charger l'ABI
    const abiPath = path.join(__dirname, '../abis/LeaderboardManager.json');
    if (!fs.existsSync(abiPath)) {
      throw new Error(`ABI file not found at ${abiPath}`);
    }

    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

    // Créer l'instance du contrat (read-only)
    this.contract = new ethers.Contract(contractAddress, abi, this.provider);

    console.log('✅ Event Listener initialized');
    console.log(`   Contract: ${contractAddress}`);
    console.log(`   RPC: ${rpcUrl}`);
    console.log(`   Leaderboard Topic: ${process.env.LEADERBOARD_TOPIC_ID}`);
  }

  /**
   * Démarre le polling des events (vérifie toutes les 5 secondes)
   */
  async start() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👂 Starting Event Listener (Polling Mode)...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Checking for LeaderboardUpdated events every 5 seconds...\n');

    let lastBlockChecked = await this.provider.getBlockNumber();
    console.log(`📦 Starting from block: ${lastBlockChecked}\n`);

    // Polling toutes les 5 secondes
    const pollInterval = 5000; // 5 secondes
    
    setInterval(async () => {
      try {
        const currentBlock = await this.provider.getBlockNumber();
        
        if (currentBlock > lastBlockChecked) {
          console.log(`🔍 Checking blocks ${lastBlockChecked + 1} to ${currentBlock}...`);
          
          // Récupérer les events depuis le dernier bloc vérifié
          const filter = this.contract.filters.LeaderboardUpdated();
          const events = await this.contract.queryFilter(
            filter,
            lastBlockChecked + 1,
            currentBlock
          );

          if (events.length > 0) {
            console.log(`🔔 Found ${events.length} LeaderboardUpdated event(s)!\n`);
            
            for (const event of events) {
              await this.handleLeaderboardUpdate(event);
            }
          }

          lastBlockChecked = currentBlock;
        }
      } catch (error) {
        console.error('❌ Error during polling:', error);
      }
    }, pollInterval);

    console.log('✅ Event listener is active (polling mode). Press Ctrl+C to stop.\n');

    // Garder le process actif
    await new Promise(() => {});
  }

  /**
   * Traite l'event LeaderboardUpdated
   */
  private async handleLeaderboardUpdate(event: ethers.Log | ethers.EventLog) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔔 LeaderboardUpdated Event Detected!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const eventLog = event as ethers.EventLog;

    console.log(`📦 Block Number: ${eventLog.blockNumber}`);
    console.log(`🔗 Transaction Hash: ${eventLog.transactionHash}`);
    console.log('');

    try {
      // Décoder les arguments de l'event
      const decodedArgs = eventLog.args;
      const blockNumber = decodedArgs[0]; // blockNumber
      const timestamp = decodedArgs[1];   // timestamp
      const leaderboardData = decodedArgs[2]; // leaderboard array

      console.log(`⏰ Timestamp: ${new Date(Number(timestamp) * 1000).toLocaleString()}`);

      // Convertir les données
      const leaderboard: LeaderboardEntry[] = leaderboardData.map((entry: any) => ({
        rank: Number(entry.rank),
        player: entry.player,
        highestScore: Number(entry.highestScore),
        totalKills: Number(entry.totalKills),
        totalSessions: Number(entry.totalSessions),
        averageAccuracy: Number(entry.averageAccuracy),
        lastUpdated: Number(entry.lastUpdated)
      }));

      // Filtrer les joueurs valides
      const validPlayers = leaderboard.filter(
        entry => entry.player !== '0x0000000000000000000000000000000000000000' && entry.highestScore > 0
      );

      console.log(`👥 Valid players in top 10: ${validPlayers.length}`);

      if (validPlayers.length === 0) {
        console.log('⚠️  No valid players to publish, skipping...\n');
        return;
      }

      // Afficher le top 3
      console.log('\n🏆 Current Top 3:');
      validPlayers.slice(0, 3).forEach(entry => {
        console.log(`   ${entry.rank}. ${entry.player}`);
        console.log(`      Score: ${entry.highestScore} | Kills: ${entry.totalKills} | Sessions: ${entry.totalSessions}`);
      });
      console.log('');

      // Publier sur HCS
      console.log('📤 Publishing to HCS Topic Leaderboard...');
      const result = await publishLeaderboard(validPlayers, Number(blockNumber));

      if (result.success) {
        console.log('✅ Successfully published to HCS!');
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   View: https://hashscan.io/testnet/topic/${process.env.LEADERBOARD_TOPIC_ID}\n`);
      } else {
        console.error('❌ Failed to publish:', result.error, '\n');
      }

    } catch (error) {
      console.error('❌ Error handling LeaderboardUpdated event:', error, '\n');
    }
  }

  /**
   * Arrête le polling (pas vraiment utilisé avec setInterval, mais gardé pour cohérence)
   */
  stop() {
    this.contract.removeAllListeners();
    console.log('🛑 Event listener stopped');
  }
}

// Démarrer le listener si exécuté directement
if (require.main === module) {
  const listener = new LeaderboardEventListener();
  
  listener.start().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    listener.stop();
    process.exit(0);
  });
}

export default LeaderboardEventListener;