import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService } from '../../services/leaderboard.service';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardComponent {
  leaderboardService = inject(LeaderboardService);
  walletService = inject(WalletService);

  leaderboard = this.leaderboardService.leaderboardData;
  isLoading = this.leaderboardService.isLoading;
  error = this.leaderboardService.error;

  // Username du joueur connecté (pour highlight)
  currentPlayerUsername = this.walletService.walletState().username;

  /**
   * Rafraîchir manuellement le leaderboard
   */
  async refresh(): Promise<void> {
    await this.leaderboardService.refresh();
  }
}