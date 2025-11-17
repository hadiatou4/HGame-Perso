import { Injectable, signal } from '@angular/core';

export type GameResult = {
  score: number;
  kills: number;
  accuracy: number;
  time: number;
};

@Injectable({ providedIn: 'root' })
export class GameStatsService {
  // Signal qui contient les dernières stats reçues
  private readonly _lastStats = signal<GameResult | null>(null);

  // lecture seule pour les autres components
  public readonly lastStats = this._lastStats.asReadonly();

  updateStats(stats: GameResult) {
    console.log('📦 Stats enregistrées globalement :', stats);
    this._lastStats.set(stats);
  }

  clear() {
    this._lastStats.set(null);
  }
}
