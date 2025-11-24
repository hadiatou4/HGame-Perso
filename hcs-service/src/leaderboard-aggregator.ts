import { subscribeSessions } from './subscribe-sessions';
import ContractClient from './contract-client';
import { GameSession } from './submit-session';

/**
 * Service qui écoute les nouvelles sessions HCS et met à jour le contrat
 */
class LeaderboardAggregator {
  private contractClient: ContractClient;
  private processedMessages: Set<string> = new Set();

  constructor() {
    console.log('🎯 Leaderboard Aggregator starting...\n');

    // Initialiser le client du contrat
    try {
      this.contractClient = new ContractClient();
    } catch (error) {
      console.error('❌ Failed to initialize ContractClient:', error);
      process.exit(1);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Configuration:');
    console.log(`   Contract: ${this.contractClient.getContractAddress()}`);
    console.log(`   Game Server: ${this.contractClient.getWalletAddress()}`);
    console.log(`   HCS Topic: ${process.env.GAME_SESSION_TOPIC_ID}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Démarrer l'écoute des sessions HCS
   */
  async start() {
    console.log('👂 Starting HCS subscription...\n');

    try {
      await subscribeSessions(
        async (session) => {
          await this.processSession(session);
        },
        {
          // Optionnel: filtrer par joueur
          // player: '0x...',
          
          // Optionnel: commencer à partir d'une date spécifique
          // startTime: new Date('2024-01-01')
        }
      );

      console.log('✅ Aggregator is now listening for new sessions...\n');
      console.log('Press Ctrl+C to stop.\n');

    } catch (error) {
      console.error('❌ Failed to start subscription:', error);
      process.exit(1);
    }
  }

  /**
   * Traiter une session HCS
   */
  private async processSession(
    session: GameSession & { sequenceNumber: number; consensusTimestamp: string }
  ) {
    const messageId = `${process.env.GAME_SESSION_TOPIC_ID}:${session.sequenceNumber}`;

    // Éviter de traiter deux fois le même message
    if (this.processedMessages.has(messageId)) {
      console.log(`⏭️  Skipping already processed message: ${messageId}`);
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎮 New game session detected!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Message ID: ${messageId}`);
    console.log(`👤 Player: ${session.player}`);
    console.log(`🎯 Score: ${session.score}`);
    console.log(`💀 Kills: ${session.kills}`);
    console.log(`📊 Accuracy: ${session.accuracy}%`);
    console.log(`⏱️  Time: ${session.timeSurvived}s`);
    console.log(`⏰ Consensus: ${session.consensusTimestamp}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Valider les données
    if (!this.validateSession(session)) {
      console.warn('⚠️  Invalid session data, skipping...\n');
      return;
    }

    // Convertir l'adresse EVM si nécessaire
    const playerAddress = this.normalizeAddress(session.player);

    try {
      // Mettre à jour le contrat
      console.log('📤 Updating leaderboard contract...');
      
      const result = await this.contractClient.updatePlayerScore(
        playerAddress,
        session.score,
        session.kills,
        messageId
      );

      if (result.success) {
        console.log('✅ Leaderboard updated successfully!');
        console.log(`   TX Hash: ${result.txHash}`);
        console.log(`   View: https://hashscan.io/testnet/transaction/${result.txHash}\n`);

        // Marquer comme traité
        this.processedMessages.add(messageId);

        // Afficher le nouveau rang du joueur
        await this.displayPlayerRank(playerAddress);

      } else {
        console.error('❌ Failed to update leaderboard:', result.error, '\n');
      }

    } catch (error) {
      console.error('❌ Error processing session:', error, '\n');
    }
  }

  /**
   * Valider une session
   */
  private validateSession(session: GameSession): boolean {
    // Vérifier que les champs requis sont présents
    if (!session.player) {
      console.warn('⚠️  Missing player address');
      return false;
    }

    if (session.score === undefined || session.kills === undefined) {
      console.warn('⚠️  Missing score or kills');
      return false;
    }

    // Score peut être 0 (le joueur a perdu immédiatement)
    if (session.score < 0 || session.kills < 0) {
      console.warn('⚠️  Negative score or kills');
      return false;
    }

    if (session.accuracy < 0 || session.accuracy > 100) {
      console.warn('⚠️  Invalid accuracy');
      return false;
    }

    // Optionnel: détection de scores impossibles (anti-cheat basique)
    const MAX_REASONABLE_SCORE = 100000;
    if (session.score > MAX_REASONABLE_SCORE) {
      console.warn(`⚠️  Suspicious score detected: ${session.score} (max: ${MAX_REASONABLE_SCORE})`);
      return false;
    }

    return true;
  }

  /**
   * Normaliser l'adresse du joueur
   */
  private normalizeAddress(address: string): string {
    // Si c'est déjà une adresse EVM, la retourner telle quelle
    if (address.startsWith('0x')) {
      return address;
    }

    // Si c'est un Hedera Account ID, on ne peut pas le convertir directement
    // Dans ce cas, il faudrait avoir un mapping Account ID <-> EVM Address
    // Pour l'instant, on retourne l'adresse telle quelle et on laisse le contrat gérer
    console.warn(`⚠️  Non-EVM address detected: ${address}`);
    console.warn('   Make sure this is the correct format for your contract');
    
    return address;
  }

  /**
   * Afficher le rang actuel du joueur
   */
  private async displayPlayerRank(playerAddress: string) {
    try {
      const rank = await this.contractClient.getPlayerRank(playerAddress);
      const stats = await this.contractClient.getPlayerStats(playerAddress);

      if (rank > 0 && stats) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🏆 Player Stats:');
        console.log(`   Rank: #${rank}`);
        console.log(`   Highest Score: ${stats.highestScore}`);
        console.log(`   Total Kills: ${stats.totalKills}`);
        console.log(`   Total Sessions: ${stats.totalSessions}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      } else {
        console.log('📊 Player is not in top 10 yet.\n');
      }
    } catch (error) {
      console.error('❌ Error fetching player rank:', error);
    }
  }
}

// Démarrer l'aggregator
if (require.main === module) {
  const aggregator = new LeaderboardAggregator();
  aggregator.start().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export default LeaderboardAggregator;