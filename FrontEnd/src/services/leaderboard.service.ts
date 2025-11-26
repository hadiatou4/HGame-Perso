import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LeaderboardEntry } from '../models/leaderboard.model';
import { interval, firstValueFrom } from 'rxjs';

/**
 * Structure du message du Topic Leaderboard
 */
interface LeaderboardTopicMessage {
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

/**
 * Réponse de l'API /api/leaderboard/topic
 */
interface LeaderboardTopicResponse {
  success: boolean;
  source: string;
  topicId: string;
  count: number;
  data: Array<{
    consensusTimestamp: string;
    message: string; // JSON stringifié
    sequenceNumber: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private http = inject(HttpClient);
  
  // URL du backend HCS
  private readonly API_URL = 'http://localhost:3001'; // Change si nécessaire

  private readonly _leaderboardData = signal<LeaderboardEntry[]>([]);
  public readonly leaderboardData = this._leaderboardData.asReadonly();

  private readonly _isLoading = signal(false);
  public readonly isLoading = this._isLoading.asReadonly();

  private readonly _error = signal<string | null>(null);
  public readonly error = this._error.asReadonly();

  private readonly _lastUpdate = signal<Date | null>(null);
  public readonly lastUpdate = this._lastUpdate.asReadonly();

  constructor() {
    this.getLeaderboard();
    
    // Auto-refresh toutes les 30 secondes
    interval(30000).subscribe(() => {
      this.getLeaderboard(true); // silent refresh
    });
  }

  /**
   * Récupère le leaderboard depuis le Topic Leaderboard HCS
   */
  async getLeaderboard(silent: boolean = false) {
    if (!silent) {
      this._isLoading.set(true);
    }
    this._error.set(null);

    try {
      console.log('🔥 Fetching leaderboard from Topic Leaderboard...');

      // Appeler le backend pour récupérer les messages du Topic Leaderboard
      const response = await firstValueFrom(
        this.http.get<LeaderboardTopicResponse>(`${this.API_URL}/api/leaderboard/topic`)
      );

      if (response && response.success && response.data.length > 0) {
        // Prendre le dernier message (le plus récent)
        const latestMessage = response.data[response.data.length - 1];
        const messageData: LeaderboardTopicMessage = JSON.parse(latestMessage.message);

        console.log('✅ Leaderboard loaded from Topic');
        console.log(`   Block: ${messageData.blockNumber}`);
        console.log(`   Timestamp: ${new Date(messageData.timestamp).toISOString()}`);
        console.log(`   Entries: ${messageData.leaderboard.length}`);

        // Avatars emoji
        const avatars = ['🤖', '👽', '👾', '🚀', '🛸', '☄️', '✨', '🌟', '🧑‍🚀', '🪐'];

        // Mapper vers LeaderboardEntry
        const leaderboardEntries: LeaderboardEntry[] = messageData.leaderboard
          .filter(entry => entry.player !== '0x0000000000000000000000000000000000000000')
          .map((entry, index) => ({
            rank: entry.rank,
            player: this.formatPlayerName(entry.player),
            score: entry.highestScore,
            avatar: avatars[index % avatars.length],
            
            // Champs additionnels
            highestScore: entry.highestScore,
            totalKills: entry.totalKills,
            averageAccuracy: entry.averageAccuracy,
            totalSessions: entry.totalSessions
          }));

        this._leaderboardData.set(leaderboardEntries);
        this._lastUpdate.set(new Date(messageData.timestamp));
        
      } else {
        console.warn('⚠️ No leaderboard data found in Topic. Using fallback...');
        await this.getFallbackLeaderboard();
      }
    } catch (error) {
      console.error('❌ Error fetching leaderboard from Topic:', error);
      console.log('🔄 Trying fallback leaderboard from HCS aggregation...');
      await this.getFallbackLeaderboard();
    } finally {
      if (!silent) {
        this._isLoading.set(false);
      }
    }
  }

  /**
   * Fallback : Récupère le leaderboard depuis l'agrégation HCS (ancienne méthode)
   */
  private async getFallbackLeaderboard() {
    try {
      const response = await firstValueFrom(
        this.http.get<{
          success: boolean;
          data: Array<{
            player: string;
            highestScore: number;
            totalKills: number;
            averageAccuracy: number;
            totalSessions: number;
          }>;
        }>(`${this.API_URL}/api/leaderboard`)
      );

      if (response && response.success) {
        const avatars = ['🤖', '👽', '👾', '🚀', '🛸', '☄️', '✨', '🌟', '🧑‍🚀', '🪐'];

        const leaderboardEntries: LeaderboardEntry[] = response.data.map((hcsEntry, index) => ({
          rank: index + 1,
          player: this.formatPlayerName(hcsEntry.player),
          score: hcsEntry.highestScore,
          avatar: avatars[index % avatars.length],
          
          highestScore: hcsEntry.highestScore,
          totalKills: hcsEntry.totalKills,
          averageAccuracy: hcsEntry.averageAccuracy,
          totalSessions: hcsEntry.totalSessions
        }));

        this._leaderboardData.set(leaderboardEntries);
        console.log('✅ Fallback leaderboard loaded:', leaderboardEntries.length, 'players');
      }
    } catch (error) {
      console.error('❌ Error fetching fallback leaderboard:', error);
      this._error.set('Unable to load leaderboard');
    }
  }

  /**
   * Formater l'adresse du joueur pour l'affichage
   */
  private formatPlayerName(address: string): string {
    if (address.startsWith('0x')) {
      // EVM address: afficher les 6 premiers caractères
      return `Player-${address.slice(2, 8)}`;
    } else {
      // Hedera Account ID: afficher tel quel
      return address;
    }
  }

  /**
   * Rafraîchir manuellement
   */
  async refresh(): Promise<void> {
    await this.getLeaderboard();
  }
}