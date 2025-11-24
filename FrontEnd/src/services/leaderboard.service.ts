import { Injectable, signal, inject } from '@angular/core';
import { LeaderboardEntry } from '../models/leaderboard.model';
import { HcsApiService } from './hcs-api.service';
import { interval } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private hcsApi = inject(HcsApiService);

  private readonly _leaderboardData = signal<LeaderboardEntry[]>([]);
  public readonly leaderboardData = this._leaderboardData.asReadonly();

  private readonly _isLoading = signal(false);
  public readonly isLoading = this._isLoading.asReadonly();

  private readonly _error = signal<string | null>(null);
  public readonly error = this._error.asReadonly();

  constructor() {
    this.getLeaderboard();
    
    // Auto-refresh toutes les 30 secondes
    interval(30000).subscribe(() => {
      this.getLeaderboard(true); // silent refresh
    });
  }

  async getLeaderboard(silent: boolean = false) {
    if (!silent) {
      this._isLoading.set(true);
    }
    this._error.set(null);

    try {
      const response = await this.hcsApi.getLeaderboard(10).toPromise();

      if (response && response.success) {
        // Avatars emoji (comme avant)
        const avatars = ['🤖', '👽', '👾', '🚀', '🛸', '☄️', '✨', '🌟', '🧑‍🚀', '🪐'];

        // Mapper les données HCS vers LeaderboardEntry
        const leaderboardEntries: LeaderboardEntry[] = response.data.map((hcsEntry, index) => ({
          rank: index + 1,
          player: this.formatPlayerName(hcsEntry.player),
          score: hcsEntry.highestScore,
          avatar: avatars[index % avatars.length],
          
          // Champs additionnels HCS
          highestScore: hcsEntry.highestScore,
          totalKills: hcsEntry.totalKills,
          averageAccuracy: hcsEntry.averageAccuracy,
          totalSessions: hcsEntry.totalSessions
        }));

        this._leaderboardData.set(leaderboardEntries);
        console.log('Leaderboard loaded from HCS:', leaderboardEntries.length, 'players');
      } else {
        throw new Error('Failed to load leaderboard from HCS');
      }
    } catch (error) {
      console.error(' Error fetching leaderboard:', error);
      this._error.set(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      if (!silent) {
        this._isLoading.set(false);
      }
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