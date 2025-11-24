import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivityFeedService } from '../../services/activity-feed.service';
import { Activity, ActivityStatus, ActivityType } from '../../models/activity.model';

@Component({
  selector: 'app-contract-activity-feed',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './contract-activity-feed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractActivityFeedComponent {
  activityFeedService = inject(ActivityFeedService);
  activities = this.activityFeedService.activities;

  /**
   * Rafraîchir manuellement
   */
  async refresh(): Promise<void> {
    await this.activityFeedService.refresh();
  }

  /**
   * Obtenir la couleur du badge de statut
   */
  getStatusColor(status: ActivityStatus): string {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500/20 text-green-400';
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400';
      case 'FAILED': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }

  /**
   * Obtenir le style du type d'activité
   */
  getTypeStyle(type: ActivityType): string {
    switch (type) {
      case 'MINT': return 'text-yellow-400'; // Epic
      case 'TRANSFER': return 'text-blue-400'; // Great
      case 'GAME_SESSION': return 'text-[rgb(var(--accent-rgb))]'; // Normal
      case 'REWARD': return 'text-green-400';
      case 'SCORE_UPDATE': return 'text-purple-400';
      default: return 'text-neutral-300';
    }
  }

  /**
   * Ouvrir HashScan pour voir le message HCS
   */
  openHashScan(activity: Activity): void {
    if (!activity.metadata?.sequenceNumber) {
      console.warn('No sequence number available');
      return;
    }

    // Extraire le topic ID depuis le messageId (format: "0.0.XXXXXX:sequence")
    const topicId = activity.txId.split(':')[0];
    const network = 'testnet'; // ou 'mainnet' selon votre config
    
    // URL vers le topic spécifique sur HashScan
    const url = `https://hashscan.io/${network}/topic/${topicId}`;
    window.open(url, '_blank');
  }
  formatAddress(address: string): string {
    if (!address) return 'Unknown';
    if (address.startsWith('0x')) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address; // Hedera Account ID
  }
}