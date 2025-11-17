import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService, View } from '../../services/ui.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  uiService = inject(UiService);
  View = View; // Expose enum to template

  features = [
    {
      title: 'NFT Rewards',
      description: 'Earn unique NFTs for achievements and victories in epic space battles.',
    },
    {
      title: 'Permanent Assets',
      description: 'Your NFTs persist on the Hedera blockchain forever, independent of game servers.',
    },
    {
      title: 'Trade & Showcase',
      description: 'Buy, sell, and showcase your hard-earned NFTs in our integrated marketplace.',
    },
  ];

  stats = [
    { label: 'Active Players', value: '1,200+' },
    { label: 'NFTs Minted', value: '5,000+' },
    { label: 'HBAR Volume', value: '250K+' },
  ];

  navigateTo(view: View) {
    if (view === View.Play) {
      this.uiService.enterFullscreen();
    }
    this.uiService.setView(view);
  }
}