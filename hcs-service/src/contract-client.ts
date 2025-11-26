import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Client pour interagir avec le smart contract LeaderboardManager
 */
export class ContractClient {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  
  constructor() {
    // Valider les variables d'environnement
    const contractAddress = process.env.LEADERBOARD_CONTRACT_ADDRESS;
    const privateKey = process.env.GAME_SERVER_PRIVATE_KEY;
    const rpcUrl = process.env.HEDERA_RPC_URL || 'https://testnet.hashio.io/api';

    if (!contractAddress) {
      throw new Error('LEADERBOARD_CONTRACT_ADDRESS not set in .env file');
    }

    if (!privateKey) {
      throw new Error('GAME_SERVER_PRIVATE_KEY not set in .env file');
    }

    // Connexion au provider Hedera
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Créer le wallet avec la clé privée
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    // Charger l'ABI du contrat
    const abiPath = path.join(__dirname, '../abis/LeaderboardManager.json');
    if (!fs.existsSync(abiPath)) {
      throw new Error(`ABI file not found at ${abiPath}`);
    }

    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

    // Créer l'instance du contrat
    this.contract = new ethers.Contract(contractAddress, abi, this.wallet);

    console.log('✅ ContractClient initialized');
    console.log(`   Contract: ${contractAddress}`);
    console.log(`   Wallet: ${this.wallet.address}`);
    console.log(`   RPC: ${rpcUrl}`);
  }

  /**
   * Soumettre une session complète au contrat (100% on-chain)
   */
  async submitSession(
    playerAddress: string,
    score: number,
    kills: number,
    accuracy: number,
    timeSurvived: number,
    timestamp: number,
    hcsMessageId: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log('📤 Submitting session to smart contract...');
      console.log(`   Player: ${playerAddress}`);
      console.log(`   Score: ${score}`);
      console.log(`   Kills: ${kills}`);
      console.log(`   Accuracy: ${accuracy}%`);
      console.log(`   Time Survived: ${timeSurvived}s`);

      // ⭐ CORRIGÉ: Utiliser la syntaxe ['methodName'] pour passer les options correctement
      const tx = await this.contract['submitSession'](
        playerAddress,
        BigInt(score),
        BigInt(kills),
        BigInt(accuracy),
        BigInt(timeSurvived),
        BigInt(timestamp),
        hcsMessageId,
        {
          gasLimit: 500000  // ⭐ Gas limit augmenté à 500k
        }
      );

      console.log(`⏳ Transaction sent: ${tx.hash}`);
      console.log(`   Waiting for confirmation...`);

      const receipt = await tx.wait();

      console.log('✅ Session submitted and leaderboard updated!');
      console.log(`   Block: ${receipt.blockNumber}`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

      return {
        success: true,
        txHash: tx.hash
      };

    } catch (error) {
      console.error('❌ Error submitting session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Ancienne méthode updatePlayerScore (deprecated, gardée pour compatibilité)
   */
  async updatePlayerScore(
    playerAddress: string,
    sessionScore: number,
    kills: number,
    hcsMessageId: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    console.warn('⚠️ updatePlayerScore is deprecated, use submitSession instead');
    return this.submitSession(playerAddress, sessionScore, kills, 0, 0, Date.now(), hcsMessageId);
  }

  /**
   * Récupérer le top 10 depuis le contrat
   */
  async getTop10(): Promise<Array<{
    playerAddress: string;
    highestScore: bigint;
    totalKills: bigint;
    totalSessions: bigint;
    lastUpdated: bigint;
    exists: boolean;
  }>> {
    try {
      const top10 = await this.contract.getTop10();
      return top10.map((player: any) => ({
        playerAddress: player.playerAddress,
        highestScore: player.highestScore,
        totalKills: player.totalKills,
        totalSessions: player.totalSessions,
        lastUpdated: player.lastUpdated,
        exists: player.exists
      }));
    } catch (error) {
      console.error('❌ Error fetching top 10:', error);
      throw error;
    }
  }

  /**
   * Récupérer le rang d'un joueur
   */
  async getPlayerRank(playerAddress: string): Promise<number> {
    try {
      const rank = await this.contract.getPlayerRank(playerAddress);
      return Number(rank);
    } catch (error) {
      console.error('❌ Error fetching player rank:', error);
      return 0;
    }
  }

  /**
   * Récupérer les stats d'un joueur
   */
  async getPlayerStats(playerAddress: string): Promise<{
    playerAddress: string;
    highestScore: bigint;
    totalKills: bigint;
    totalSessions: bigint;
    lastUpdated: bigint;
    exists: boolean;
  } | null> {
    try {
      const stats = await this.contract.getPlayerStats(playerAddress);
      if (!stats.exists) return null;
      
      return {
        playerAddress: stats.playerAddress,
        highestScore: stats.highestScore,
        totalKills: stats.totalKills,
        totalSessions: stats.totalSessions,
        lastUpdated: stats.lastUpdated,
        exists: stats.exists
      };
    } catch (error) {
      console.error('❌ Error fetching player stats:', error);
      return null;
    }
  }

  /**
   * Obtenir l'adresse du contrat
   */
  getContractAddress(): string {
    return this.contract.target as string;
  }

  /**
   * Obtenir l'adresse du wallet
   */
  getWalletAddress(): string {
    return this.wallet.address;
  }
}

export default ContractClient;