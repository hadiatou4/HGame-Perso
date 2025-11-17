import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketplaceService } from '../../services/marketplace.service';
import { NftService } from '../../services/nft.service';
import { WalletService } from '../../services/wallet.service';
import { Listing, NFT } from '../../models/marketplace.model';
import { toast } from 'sonner';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marketplace.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketplaceComponent {
  marketplaceService = inject(MarketplaceService);
  nftService = inject(NftService);
  walletService = inject(WalletService);

  walletState = this.walletService.walletState;
  listings = this.marketplaceService.listings;
  isLoading = this.marketplaceService.isLoading;
  playerNfts = this.nftService.playerNfts;

  // Dialog and form state
  isListingDialogOpen = signal(false);
  selectedNftToList = signal<NFT | null>(null);
  listingPrice = signal('');
  
  // Filter and sort state
  searchQuery = signal('');
  rarityFilter = signal('all');
  sortBy = signal('recent');

  filteredAndSortedListings = computed(() => {
    let listings = this.listings();

    // Filter
    listings = listings.filter(l => {
      const matchesSearch = l.nft.achievement.name.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchesRarity = this.rarityFilter() === 'all' || l.nft.achievement.rarity === this.rarityFilter();
      return matchesSearch && matchesRarity;
    });

    // Sort
    switch(this.sortBy()) {
      case 'price-low':
        listings.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-high':
        listings.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'recent':
        listings.sort((a, b) => b.listedAt - a.listedAt);
        break;
    }
    return listings;
  });

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onRarityChange(event: Event) {
    this.rarityFilter.set((event.target as HTMLSelectElement).value);
  }

  onSortChange(event: Event) {
    this.sortBy.set((event.target as HTMLSelectElement).value);
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
      alert('Please select an NFT and enter a valid price.'); // Replace with better toast/notification
      return;
    }
    const success = await this.marketplaceService.listNFT(nft, price);
    if (success) {
      this.isListingDialogOpen.set(false);
      // Ideally, we'd also remove this from the player's list of ownable NFTs to list
    } else {
      alert('Failed to list NFT.');
    }
  }
  
  handleBuy(listing: Listing) {
    if (this.walletState().status !== 'connected') {
        this.walletService.openConnectModal();
        return;
    }
    this.marketplaceService.buyNFT(listing);
  }
}
