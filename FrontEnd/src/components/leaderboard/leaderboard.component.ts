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
  // The username is now available in the wallet state
  currentPlayerUsername = this.walletService.walletState().username;
}