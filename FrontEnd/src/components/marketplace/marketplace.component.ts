import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketplaceService } from '../../services/marketplace.service';
import { NftService } from '../../services/nft.service';
import { WalletService } from '../../services/wallet.service';
import { Listing, NFT } from '../../models/marketplace.model';

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
      alert('Please enter a valid price greater than 0');
      return;
    }
    
    const success = await this.marketplaceService.listNFT(nft, price);
    
    if (success) {
      alert(`✅ NFT listed for ${price} HBAR!`);
      this.isListingDialogOpen.set(false);
      
      // Refresh player NFTs
      await this.nftService.refreshPlayerNfts();
    } else {
      alert('❌ Failed to list NFT. Please try again.');
    }
  }
  
  handleBuy(listing: Listing) {
    if (this.walletState().status !== 'connected') {
      this.walletService.openConnectModal();
      return;
    }
    this.marketplaceService.buyNFT(listing);
  }

  // Nouvelle méthode pour cancel un listing
  async handleCancelListing(listing: Listing) {
    if (this.walletState().status !== 'connected') {
      this.walletService.openConnectModal();
      return;
    }

    const success = await this.marketplaceService.cancelListing(listing);
    
    if (success) {
      alert('✅ Listing cancelled successfully!');
      
      // Refresh player NFTs
      await this.nftService.refreshPlayerNfts();
    } else {
      alert('❌ Failed to cancel listing');
    }
  }

  // Vérifier si un listing appartient au joueur connecté
  isOwnListing(listing: Listing): boolean {
    const walletAddress = this.walletState().address?.toLowerCase();
    const sellerAddress = listing.seller.toLowerCase();
    return walletAddress === sellerAddress;
  }
}