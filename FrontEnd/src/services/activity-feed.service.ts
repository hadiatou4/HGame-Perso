import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { Activity, ActivityStatus, ActivityType } from '../models/activity.model';
import { SupabaseService } from './supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class ActivityFeedService implements OnDestroy {
  private supabase = inject(SupabaseService);
  private channel: RealtimeChannel | null = null;
  
  private readonly _activities = signal<Activity[]>([]);
  public readonly activities = this._activities.asReadonly();

  constructor() {
    this.fetchInitialActivities();
    this.subscribeToChanges();
  }

  private async fetchInitialActivities() {
    const { data, error } = await this.supabase.client
      .from('blockchain_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching activities:', error);
      return;
    }

    const mappedActivities = data.map(this.mapDbRecordToActivity);
    this._activities.set(mappedActivities);
  }

  private subscribeToChanges() {
    this.channel = this.supabase.client
      .channel('blockchain_transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blockchain_transactions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newActivity = this.mapDbRecordToActivity(payload.new);
            this._activities.update(activities => [newActivity, ...activities.slice(0, 19)]);
          } else if (payload.eventType === 'UPDATE') {
             const updatedActivity = this.mapDbRecordToActivity(payload.new);
             this._activities.update(activities => 
                activities.map(act => act.txId === updatedActivity.txId ? updatedActivity : act)
             );
          }
        }
      )
      .subscribe();
  }
  
  private mapDbRecordToActivity(record: any): Activity {
      const payload = record.metadata?.score ? `Score: ${record.metadata.score}` 
                      : record.metadata?.serialNumber ? `NFT Serial #${record.metadata.serialNumber}`
                      : 'Details unavailable';
                      
      return {
        type: record.transaction_type.toUpperCase() as ActivityType,
        txId: record.id,
        status: record.status.toUpperCase() as ActivityStatus,
        timestamp: new Date(record.created_at),
        payload: payload,
      };
  }

  ngOnDestroy() {
    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
    }
  }
}