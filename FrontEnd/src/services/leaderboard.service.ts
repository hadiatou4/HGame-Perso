import { Injectable, signal, inject } from '@angular/core';
import { LeaderboardEntry } from '../models/leaderboard.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private supabase = inject(SupabaseService);

  private readonly _leaderboardData = signal<LeaderboardEntry[]>([]);
  public readonly leaderboardData = this._leaderboardData.asReadonly();

  constructor() {
    this.getLeaderboard();
  }

  async getLeaderboard() {
    const { data, error } = await this.supabase.client
      .from('leaderboard_view')
      .select('*')
      .order('total_score', { ascending: false })
      .limit(10);
      
    if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
    }
    
    const avatars = ['🤖', '👽', '👾', '🚀', '🛸', '☄️', '✨', '🌟', '🧑‍🚀', '🪐'];
    const leaderboardEntries: LeaderboardEntry[] = data.map((player, index) => ({
        rank: player.rank,
        player: player.username || `Player-${player.wallet_address?.slice(0, 6)}`,
        score: player.total_score || 0,
        avatar: avatars[index % avatars.length]
    }));
    
    this._leaderboardData.set(leaderboardEntries);
  }
}