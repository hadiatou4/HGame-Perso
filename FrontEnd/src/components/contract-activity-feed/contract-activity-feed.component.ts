import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivityFeedService } from '../../services/activity-feed.service';
import { Activity, ActivityStatus } from '../../models/activity.model';

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

  getStatusColor(status: ActivityStatus): string {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500/20 text-green-400';
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400';
      case 'FAILED': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }
}