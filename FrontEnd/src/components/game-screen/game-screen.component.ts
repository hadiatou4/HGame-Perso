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

  ngOnInit() {
    window.addEventListener('message', this.messageHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.messageHandler);
  }

  private messageHandler = (event: MessageEvent) => {
    if (event.data?.type === 'GAME_STATS') {
      const stats = {
        score: Number(event.data.Score),
        kills: Number(event.data.Kills),
        accuracy: Number(event.data.Accuracy),
        time: Number(event.data.Time),
      };
      console.log('📊 Stats reçues :', stats);

      // Tu peux ensuite envoyer à Supabase ici
      // this.saveStats(score, kills, accuracy, time);
      // 💾 Sauvegarde globale dans Angular
      this.gameStats.updateStats(stats);
    }
  };

  async exitGame() {
    await this.uiService.exitFullscreen();
    // After exiting fullscreen, navigate back to the dashboard.
    // Small delay to ensure the UI transition feels smooth.
    setTimeout(() => {
      this.uiService.setView(View.Dashboard);
    }, 100);
  }
}
