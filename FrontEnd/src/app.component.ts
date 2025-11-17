import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from './services/wallet.service';
import { UiService, View } from './services/ui.service';

import { WalletConnectModalComponent } from './components/wallet-connect-modal/wallet-connect-modal.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import { GameDashboardComponent } from './components/game-dashboard/game-dashboard.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { ContractActivityFeedComponent } from './components/contract-activity-feed/contract-activity-feed.component';
import { GameScreenComponent } from './components/game-screen/game-screen.component';
import { MarketplaceComponent } from './components/marketplace/marketplace.component';
import { ProfileComponent } from './components/profile/profile.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    WalletConnectModalComponent,
    NavbarComponent,
    HomeComponent,
    GameDashboardComponent,
    LeaderboardComponent,
    ContractActivityFeedComponent,
    GameScreenComponent,
    MarketplaceComponent,
    ProfileComponent
  ],
})
export class AppComponent {
  walletService = inject(WalletService);
  uiService = inject(UiService);

  isModalOpen = this.walletService.isConnectModalOpen;
  currentView = this.uiService.currentView;
  animationState = this.uiService.animationState;
  
  View = View; // Expose enum to template
}