import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService, View } from '../../services/ui.service';
import { GameStatsService } from '../../services/game-stats.service';
import { HcsApiService } from '../../services/hcs-api.service';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-game-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-screen.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameScreenComponent implements OnInit, OnDestroy {
  uiService = inject(UiService);
  gameStats = inject(GameStatsService);
  hcsApi = inject(HcsApiService);
  walletService = inject(WalletService);

  ngOnInit() {
    window.addEventListener('message', this.messageHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.messageHandler);
  }

  private messageHandler = async (event: MessageEvent) => {
    if (event.data?.type === 'GAME_STATS') {
      const stats = {
        score: Number(event.data.Score),
        kills: Number(event.data.Kills),
        accuracy: Number(event.data.Accuracy),
        time: Number(event.data.Time),
      };
      
      console.log('📊 Stats reçues du jeu:', stats);

      // 💾 Sauvegarde locale dans Angular
      this.gameStats.updateStats(stats);

      // 🚀 Envoyer à Hedera HCS
      await this.submitToHCS(stats);
    }
  };

  /**
   * Soumet la session de jeu à Hedera HCS
   */
  private async submitToHCS(stats: {
    score: number;
    kills: number;
    accuracy: number;
    time: number;
  }) {
    try {
      // Vérifier que le wallet est connecté
      const walletState = this.walletService.walletState();
      
      if (walletState.status !== 'connected') {
        console.warn('⚠️  Wallet not connected. Session not submitted to HCS.');
        return;
      }

      console.log('📤 Submitting session to Hedera HCS...');

      // Soumettre à HCS via le backend
      const result = await this.hcsApi.submitGameSession(stats);

      if (result.success) {
        console.log('✅ Session enregistrée sur Hedera!');
        console.log(`   Message ID: ${result.data?.messageId}`);
        console.log(`   Topic ID: ${result.data?.topicId}`);
        console.log(`   Sequence: ${result.data?.sequenceNumber}`);
        
        // Optionnel: Afficher une notification à l'utilisateur
        // this.showSuccessNotification();
      } else {
        console.error('❌ Failed to submit to HCS:', result.error);
      }

    } catch (error) {
      console.error('❌ Error submitting to HCS:', error);
    }
  }

  async exitGame() {
    await this.uiService.exitFullscreen();
    // After exiting fullscreen, navigate back to the dashboard.
    // Small delay to ensure the UI transition feels smooth.
    setTimeout(() => {
      this.uiService.setView(View.Dashboard);
    }, 100);
  }
}