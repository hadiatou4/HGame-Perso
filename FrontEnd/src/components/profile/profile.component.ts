import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../services/wallet.service';
import { NftService } from '../../services/nft.service';
import { MarketplaceService } from '../../services/marketplace.service';
import { GameSession } from '../../models/profile.model';
import { NFT } from '../../models/marketplace.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  walletService = inject(WalletService);
  nftService = inject(NftService);
  marketplaceService = inject(MarketplaceService);

  walletState = this.walletService.walletState;
  playerNfts = this.nftService.playerNfts;
  isLoadingNfts = this.nftService.isLoading;
  
  activeTab = signal<'nfts' | 'history'>('nfts');
  gameHistory = signal<GameSession[]>([]);

  // Listing Dialog State
  isListingDialogOpen = signal(false);
  selectedNftToList = signal<NFT | null>(null);
  listingPrice = signal('');

  constructor() {
    this.loadGameHistory();
  }

  loadGameHistory() {
    if (this.walletState().address) {
      const historyKey = `game_history_${this.walletState().address}`;
      const savedHistory = localStorage.getItem(historyKey);
      if (savedHistory) {
        this.gameHistory.set(JSON.parse(savedHistory));
      }
    }
  }

  get totalKills() {
    return this.gameHistory().reduce((sum, g) => sum + (g.kills || 0), 0);
  }

  get bestScore() {
    return this.gameHistory().length > 0 
      ? Math.max(...this.gameHistory().map(g => g.score || 0))
      : 0;
  }
  
  getRarityColor(rarity: string | undefined): string {
    if (!rarity) return 'text-neutral-400';
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'text-yellow-400';
      case 'epic': return 'text-purple-400';
      case 'rare': return 'text-blue-400';
      default: return 'text-neutral-400';
    }
  }

  openListForNft(nft: NFT) {
    this.selectedNftToList.set(nft);
    this.listingPrice.set('');
    this.isListingDialogOpen.set(true);
  }
  
  async handleListNft() {
    const nft = this.selectedNftToList();
    const price = this.listingPrice();
    if (!nft || !price || parseFloat(price) <= 0) {
      alert('Please enter a valid price.');
      return;
    }
    const success = await this.marketplaceService.listNFT(nft, price);
    if (success) {
      this.isListingDialogOpen.set(false);
      // In a real app, you would remove this NFT from the list of listable items
    } else {
      alert('Failed to list NFT.');
    }
  }
}
