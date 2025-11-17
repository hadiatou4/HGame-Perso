import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';
import { UiService, View } from '../../services/ui.service';
import { GameStatsService } from '../../services/game-stats.service';

@Component({
  selector: 'app-game-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameDashboardComponent {
  walletService = inject(WalletService);
  uiService = inject(UiService);
  gameStats = inject(GameStatsService);

  walletState = this.walletService.walletState;

  playNow() {
    this.uiService.enterFullscreen();
    this.uiService.setView(View.Play);
  }

  viewLeaderboard() {
    this.uiService.setView(View.Leaderboard);
  }

  viewActivity() {
    this.uiService.setView(View.Activity);
  }
}
