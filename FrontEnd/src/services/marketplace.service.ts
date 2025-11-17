import { Injectable, signal } from '@angular/core';
import { Listing, NFT } from '../models/marketplace.model';

// Mock Data Source
const MOCK_NFTS: NFT[] = [
  { tokenId: '101', achievementId: '1', metadataURI: '', achievement: { id: 1, name: "Galactic Commander", description: "Highest global score", rarity: "Legendary", requirement: 100000, achievementType: "score" } },
  { tokenId: '102', achievementId: '2', metadataURI: '', achievement: { id: 2, name: "Stellar Destroyer", description: "Highest total kills", rarity: "Legendary", requirement: 50, achievementType: "kills" } },
  { tokenId: '103', achievementId: '3', metadataURI: '', achievement: { id: 3, name: "Photonic Blade", description: "Best accuracy >= 85%", rarity: "Epic", requirement: 85, achievementType: "accuracy" } },
  { tokenId: '104', achievementId: '7', metadataURI: '', achievement: { id: 7, name: "Orbital Sniper", description: "Precision > 95%", rarity: "Epic", requirement: 95, achievementType: "accuracy" } },
  { tokenId: '105', achievementId: '6', metadataURI: '', achievement: { id: 6, name: "Solar Flame", description: "High kills/min ratio", rarity: "Rare", requirement: 10, achievementType: "kills" } },
  { tokenId: '106', achievementId: '8', metadataURI: '', achievement: { id: 8, name: "Void Survivor", description: "Survival > 10 min", rarity: "Rare", requirement: 600, achievementType: "time" } },
];

@Injectable({
  providedIn: 'root'
})
export class MarketplaceService {
  private readonly _listings = signal<Listing[]>([]);
  public readonly listings = this._listings.asReadonly();
  
  private readonly _isLoading = signal(true);
  public readonly isLoading = this._isLoading.asReadonly();

  constructor() {
    this.fetchListings();
  }

  fetchListings() {
    this._isLoading.set(true);
    // Simulate fetching from a contract or backend
    setTimeout(() => {
      const mockListings: Listing[] = MOCK_NFTS.slice(0, 4).map((nft, i) => ({
        listingId: `L${i+1}`,
        tokenId: nft.tokenId,
        seller: `0.0.1234${i}`,
        price: (Math.random() * 500 + 50).toFixed(2),
        active: true,
        listedAt: Date.now() - Math.random() * 1000000,
        nft: nft
      }));
      this._listings.set(mockListings);
      this._isLoading.set(false);
    }, 1500);
  }

  async listNFT(nft: NFT, price: string): Promise<boolean> {
    console.log(`Simulating listing NFT ${nft.tokenId} for ${price} HBAR`);
    await new Promise(res => setTimeout(res, 1000));
    
    const newListing: Listing = {
      listingId: `L${Math.floor(Math.random()*1000)}`,
      tokenId: nft.tokenId,
      seller: 'CURRENT_USER_MOCK', // In real app, get from wallet service
      price,
      active: true,
      listedAt: Date.now(),
      nft
    };
    
    this._listings.update(listings => [newListing, ...listings]);
    console.log('NFT Listed:', newListing);
    return true;
  }
  
  async buyNFT(listing: Listing): Promise<boolean> {
    console.log(`Simulating purchase of listing ${listing.listingId}`);
    await new Promise(res => setTimeout(res, 1500));
    
    this._listings.update(listings => listings.filter(l => l.listingId !== listing.listingId));
    console.log('NFT Purchased and removed from listings.');
    return true;
  }
  
  async cancelListing(listing: Listing): Promise<boolean> {
     console.log(`Simulating cancellation of listing ${listing.listingId}`);
     await new Promise(res => setTimeout(res, 1000));
     
     this._listings.update(listings => listings.filter(l => l.listingId !== listing.listingId));
     console.log('Listing cancelled.');
     return true;
  }
}
