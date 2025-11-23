import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { WalletService } from './wallet.service';

/**
 * Game session data structure for HCS
 */
export interface GameSessionData {
  player: string;              // Hedera account ID or EVM address
  score: number;
  kills: number;
  accuracy: number;
  timeSurvived: number;
  timestamp: number;
}

/**
 * HCS submission result
 */
export interface HCSSubmitResult {
  success: boolean;
  data?: {
    messageId: string;
    topicId: string;
    sequenceNumber: string;
    consensusTimestamp: string;
    transactionId: string;
  };
  error?: string;
  details?: string[];
}

/**
 * Parsed session from HCS
 */
export interface HCSSession extends GameSessionData {
  sequenceNumber: number;
  consensusTimestamp: string;
  messageId: string;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  player: string;
  highestScore: number;
  totalSessions: number;
  totalKills: number;
  averageAccuracy: number;
}

@Injectable({ providedIn: 'root' })
export class HcsApiService {
  private http = inject(HttpClient);
  private walletService = inject(WalletService);

  // Backend HCS API URL
  private readonly API_URL = 'http://localhost:3001/api';

  /**
   * Submit a game session to HCS
   */
  async submitGameSession(stats: {
    score: number;
    kills: number;
    accuracy: number;
    time: number;
  }): Promise<HCSSubmitResult> {
    try {
      const walletState = this.walletService.walletState();

      // Vérifier que le wallet est connecté
      if (walletState.status !== 'connected' || !walletState.address) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      // Valider les données AVANT de les envoyer
      if (stats.score === undefined || stats.score === null) {
        throw new Error('Score is required');
      }
      if (stats.kills === undefined || stats.kills === null) {
        throw new Error('Kills is required');
      }
      if (stats.accuracy === undefined || stats.accuracy === null) {
        throw new Error('Accuracy is required');
      }
      if (stats.time === undefined || stats.time === null) {
        throw new Error('Time survived is required');
      }

      // Préparer les données de session
      const sessionData: GameSessionData = {
        player: walletState.address, // EVM address or Hedera Account ID
        score: Number(stats.score),
        kills: Number(stats.kills),
        accuracy: Number(stats.accuracy),
        timeSurvived: Number(stats.time),
        timestamp: Date.now()
      };

      console.log('📤 Submitting session to HCS:', sessionData);

      // Envoyer au backend HCS
      const result = await firstValueFrom(
        this.http.post<HCSSubmitResult>(`${this.API_URL}/sessions`, sessionData)
      );

      if (result.success) {
        console.log('✅ Session submitted successfully:', result.data?.messageId);
      } else {
        console.error('❌ Session submission failed:', result.error);
        if (result.details) {
          console.error('❌ Validation errors:', result.details);
        }
      }

      return result;

    } catch (error) {
      console.error('❌ Error submitting session:', error);
      
      // Gérer les erreurs HTTP spécifiquement
      if (error instanceof HttpErrorResponse) {
        console.error('❌ HTTP Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error
        });
        
        return {
          success: false,
          error: error.error?.error || error.message || 'HTTP request failed',
          details: error.error?.details || []
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all sessions (with optional filters)
   */
  getSessions(params?: {
    player?: string;
    limit?: number;
  }): Observable<{ success: boolean; count: number; data: HCSSession[] }> {
    return this.http.get<any>(`${this.API_URL}/sessions`, { params: params as any });
  }

  /**
   * Get latest sessions
   */
  getLatestSessions(limit: number = 10): Observable<{ success: boolean; count: number; data: HCSSession[] }> {
    return this.http.get<any>(`${this.API_URL}/sessions/latest`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Get sessions for a specific player
   */
  getPlayerSessions(playerAddress: string, limit: number = 20): Observable<{ success: boolean; player: string; count: number; data: HCSSession[] }> {
    return this.http.get<any>(`${this.API_URL}/sessions/player/${playerAddress}`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(limit: number = 10): Observable<{ success: boolean; count: number; data: LeaderboardEntry[] }> {
    return this.http.get<any>(`${this.API_URL}/leaderboard`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Check API health
   */
  checkHealth(): Observable<{
    status: string;
    timestamp: string;
    network: string;
    topicId: string;
    errors: string[];
  }> {
    return this.http.get<any>(`${this.API_URL.replace('/api', '')}/health`);
  }
}