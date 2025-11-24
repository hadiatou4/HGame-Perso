import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { Activity, ActivityStatus, ActivityType } from '../models/activity.model';
import { HcsApiService, HCSSession } from './hcs-api.service';
import { interval, Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ActivityFeedService implements OnDestroy {
  private hcsApi = inject(HcsApiService);
  
  private readonly _activities = signal<Activity[]>([]);
  public readonly activities = this._activities.asReadonly();

  private lastSequenceNumber: number = 0;
  private pollSubscription: Subscription | null = null;

  constructor() {
    this.fetchInitialActivities();
    
    // Vérifier les nouvelles activités toutes les 5 secondes
    this.pollSubscription = interval(5000).subscribe(() => {
      this.checkForNewActivities();
    });
  }

  /**
   * Récupérer les activités initiales depuis HCS
   */
  private async fetchInitialActivities() {
    try {
      const response = await this.hcsApi.getLatestSessions(20).toPromise();

      if (response && response.success && response.data.length > 0) {
        const activities = response.data.map(session => this.mapHcsSessionToActivity(session));
        
        // Trier par timestamp décroissant ET par sequence number (plus récent en premier)
        activities.sort((a, b) => {
          // D'abord par sequence number (plus grand = plus récent)
          const seqA = a.metadata?.sequenceNumber || 0;
          const seqB = b.metadata?.sequenceNumber || 0;
          if (seqB !== seqA) return seqB - seqA;
          
          // Ensuite par timestamp
          return b.timestamp.getTime() - a.timestamp.getTime();
        });
        
        this._activities.set(activities);
        
        // Mémoriser le dernier numéro de séquence
        this.lastSequenceNumber = Math.max(...response.data.map(s => s.sequenceNumber));
        
        console.log('✅ Loaded', activities.length, 'activities from HCS');
      }
    } catch (error) {
      console.error('❌ Error fetching initial activities:', error);
    }
  }

  /**
   * Vérifier s'il y a de nouvelles activités
   */
  private async checkForNewActivities() {
    try {
      const response = await this.hcsApi.getLatestSessions(10).toPromise();

      if (response && response.success) {
        // Filtrer les nouvelles sessions (numéro de séquence > dernier connu)
        const newSessions = response.data.filter(s => s.sequenceNumber > this.lastSequenceNumber);

        if (newSessions.length > 0) {
          console.log('🔔 New activities detected:', newSessions.length);

          // Convertir en activités
          const newActivities = newSessions.map(session => this.mapHcsSessionToActivity(session));

          // Ajouter au début de la liste
          const currentActivities = this._activities();
          const updatedActivities = [...newActivities, ...currentActivities];

          // Limiter à 50 activités max
          const limitedActivities = updatedActivities.slice(0, 50);

          this._activities.set(limitedActivities);

          // Mettre à jour le dernier numéro de séquence
          this.lastSequenceNumber = Math.max(...response.data.map(s => s.sequenceNumber));
        }
      }
    } catch (error) {
      console.error('❌ Error checking for new activities:', error);
    }
  }

  /**
   * Mapper une session HCS vers une Activity
   */
  private mapHcsSessionToActivity(session: HCSSession): Activity {
    // Déterminer le type d'activité basé sur le score
    let type: ActivityType;
    let payload: string;

    if (session.score >= 1000) {
      type = 'MINT';
      payload = `🏆 Epic game! Score: ${session.score}`;
    } else if (session.score >= 500) {
      type = 'TRANSFER';
      payload = `🎮 Great game! Score: ${session.score}`;
    } else {
      type = 'GAME_SESSION';
      payload = `Score: ${session.score}`;
    }

    return {
      type: type,
      txId: session.messageId,
      status: 'CONFIRMED',
      timestamp: new Date(session.timestamp),
      payload: payload,
      player: session.player,
      transactionId: session.messageId, // Pour HashScan
      metadata: {
        score: session.score,
        kills: session.kills,
        accuracy: session.accuracy,
        timeSurvived: session.timeSurvived,
        sequenceNumber: session.sequenceNumber,
        consensusTimestamp: session.consensusTimestamp
      }
    };
  }

  /**
   * Rafraîchir manuellement les activités
   */
  async refresh(): Promise<void> {
    await this.fetchInitialActivities();
  }

  ngOnDestroy() {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
  }
}