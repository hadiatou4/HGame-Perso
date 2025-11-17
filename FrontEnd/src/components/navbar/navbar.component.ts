import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';
import { UiService, View } from '../../services/ui.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  walletService = inject(WalletService);
  uiService = inject(UiService);

  walletState = this.walletService.walletState;
  currentView = this.uiService.currentView;
  isMobileMenuOpen = signal(false);

  // Expose View enum for template access
  View = View;

  navItems = [
    { name: 'Home', view: View.Home },
    { name: 'Dashboard', view: View.Dashboard, connected: true },
    { name: 'Marketplace', view: View.Marketplace },
    { name: 'Leaderboard', view: View.Leaderboard },
    { name: 'Activity', view: View.Activity },
    { name: 'Profile', view: View.Profile, connected: true },
  ];

  setView(view: View) {
    this.uiService.setView(view);
    this.isMobileMenuOpen.set(false);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update((open) => !open);
  }

  connect() {
    this.walletService.openConnectModal();
    this.isMobileMenuOpen.set(false);
  }

  disconnect() {
    this.walletService.disconnect();
  }

  truncateAccountId(id: string | undefined): string {
    if (!id) return '';
    // const length = id.length;
    // return `${id.slice(0, 6)}...${id.slice(length - 4, length)}`;
    return id;
  }
}
