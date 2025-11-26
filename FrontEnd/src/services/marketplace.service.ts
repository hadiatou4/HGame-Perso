import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Listing, NFT } from '../models/marketplace.model';
import { WalletService } from './wallet.service';
import { firstValueFrom } from 'rxjs';
import { getWalletClient, getAccount } from '@wagmi/core';
import { parseUnits, encodeFunctionData } from 'viem';

interface MarketplaceListingResponse {
  success: boolean;
  count: number;
  data: Array<{
    listingId: number;
    nftContract: string;
    tokenId: number;
    seller: string;
    price: string; // Prix en Wei
    priceFormatted: string; // Prix formaté en HBAR
    active: boolean;
    listedAt: number;
    metadata: string;
  }>;
}

interface ListNFTResponse {
  success: boolean;
  data?: {
    listingId: number;
    txHash: string;
  };
  error?: string;
}

interface CancelListingResponse {
  success: boolean;
  data?: {
    txHash: string;
  };
  error?: string;
}

// ABI minimal pour buyNFT
const MARKETPLACE_ABI = [
  {
    inputs: [{ name: 'listingId', type: 'uint256' }],
    name: 'buyNFT',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

@Injectable({
  providedIn: 'root'
})
export class MarketplaceService {
  private http = inject(HttpClient);
  private walletService = inject(WalletService);
  
  private readonly API_URL = 'http://localhost:3001';
  private readonly MARKETPLACE_ADDRESS = '0x7777e9978CDc0A8e52DEf826E219aa4A97484F8a' as `0x${string}`;

  private readonly _listings = signal<Listing[]>([]);
  public readonly listings = this._listings.asReadonly();
  
  private readonly _isLoading = signal(true);
  public readonly isLoading = this._isLoading.asReadonly();
  
  private readonly _error = signal<string | null>(null);
  public readonly error = this._error.asReadonly();

  constructor() {
    this.fetchListings();
  }

  async fetchListings() {
    this._isLoading.set(true);
    
    try {
      console.log('Fetching listings from blockchain...');
      
      const response = await firstValueFrom(
        this.http.get<MarketplaceListingResponse>(`${this.API_URL}/api/marketplace/listings`)
      );

      if (response && response.success) {
        console.log('🔍 Backend response:', JSON.stringify(response.data[0], null, 2));
        
        const listings: Listing[] = response.data.map(item => {
          const achievement = this.parseMetadataToAchievement(item.metadata, item.tokenId);
          
          const nft: NFT = {
            tokenId: item.tokenId.toString(),
            achievementId: achievement.id.toString(),
            achievement: achievement,
            metadataURI: item.metadata,
            owner: item.seller
          };

          return {
            listingId: item.listingId.toString(),
            tokenId: item.tokenId.toString(),
            seller: item.seller,
            price: item.priceFormatted || item.price, // Affichage en HBAR
            priceWei: item.price, // Prix en Wei (string, 18 décimales)
            active: item.active,
            listedAt: item.listedAt * 1000,
            nft: nft
          };
        });

        this._listings.set(listings);
        console.log(`✅ Loaded ${listings.length} listings from blockchain`);
      }
    } catch (error) {
      console.error('❌ Error fetching listings:', error);
      this._listings.set([]);
    } finally {
      this._isLoading.set(false);
    }
  }

  async listNFT(nft: NFT, price: string): Promise<boolean> {
    try {
      console.log(`📝 Listing NFT ${nft.tokenId} for ${price} HBAR on blockchain...`);
      
      const response = await firstValueFrom(
        this.http.post<ListNFTResponse>(`${this.API_URL}/api/marketplace/list`, {
          tokenId: parseInt(nft.tokenId),
          price: price
        })
      );

      if (response && response.success) {
        console.log('✅ NFT listed successfully:', response.data);
        await this.fetchListings();
        return true;
      } else {
        console.error('❌ Failed to list NFT:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error listing NFT:', error);
      return false;
    }
  }
  
  async buyNFT(listing: Listing): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      console.log(`💳 Purchasing NFT from listing ${listing.listingId}...`);

      if (!listing || !listing.active) {
        throw new Error('This NFT is no longer available');
      }

      // 1) Vérifier wallet connecté
      const walletState = this.walletService.walletState();
      if (walletState.status !== 'connected' || !walletState.address) {
        alert('Please connect your wallet first');
        this.walletService.openConnectModal?.();
        return false;
      }

      // 2) Récupérer wallet client via Reown/Wagmi
      const reownService = (this.walletService as any).reownService;
      const wagmiConfig = reownService?.getWagmiAdapter?.()?.wagmiConfig;
      if (!wagmiConfig) {
        throw new Error('Wallet not properly configured');
      }

      const walletClient = await getWalletClient(wagmiConfig);
      const account = getAccount(wagmiConfig);
      if (!walletClient || !account.address) {
        throw new Error('Failed to get wallet client');
      }

      // 3) Convertir le prix en BigInt (Wei)
      let priceInWei: bigint;
      
      if (listing.priceWei) {
        // Le backend nous donne déjà le prix en Wei
        priceInWei = BigInt(listing.priceWei);
        console.log('✅ Using priceWei from backend');
      } else {
        // Fallback : convertir depuis HBAR
        const priceStr = listing.price.replace(' HBAR', '').trim();
        priceInWei = parseUnits(priceStr, 18);
        console.log('⚠️ Fallback: Converting HBAR to Wei');
      }

      console.log('🔍 PRIX DEBUG:');
      console.log('   listing.price (display):', listing.price);
      console.log('   listing.priceWei (backend):', listing.priceWei);
      console.log('   priceInWei (BigInt):', priceInWei.toString());
      console.log('   Expected: Exactly', priceInWei.toString(), 'wei');

      // 4) Encoder l'appel à buyNFT(listingId)
      const data = encodeFunctionData({
        abi: MARKETPLACE_ABI,
        functionName: 'buyNFT',
        args: [BigInt(listing.listingId)],
      });

      console.log('📤 Sending transaction...');
      console.log('   From:', account.address);
      console.log('   To:', this.MARKETPLACE_ADDRESS);
      console.log('   Value:', listing.price, 'HBAR');
      console.log('   Value (Wei):', priceInWei.toString());
      console.log('   Listing ID:', listing.listingId);

      // 5) Envoyer la transaction AVEC LE PRIX EXACT
      const txHash = await walletClient.sendTransaction({
        account: account.address,
        to: this.MARKETPLACE_ADDRESS,
        value: priceInWei, // Prix EXACT, pas de buffer !
        data: data,
      } as any);

      console.log('⏳ Transaction sent:', txHash);
      console.log('   Waiting for confirmation...');

      alert(`✅ Transaction sent!\n\nTx Hash: ${txHash}\n\nThe NFT will be transferred once confirmed on the blockchain.`);

      // Rafraîchir après 5 secondes
      setTimeout(() => this.fetchListings(), 5000);

      return true;

    } catch (error: any) {
      console.error('❌ Error buying NFT:', error);

      let errorMessage = 'Failed to purchase NFT';

      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient HBAR balance';
      } else if (error.message?.includes('user rejected') || error.code === 4001) {
        errorMessage = 'Transaction cancelled by user';
      } else if (error.message?.includes('Insufficient payment')) {
        errorMessage = 'Payment amount incorrect. Please refresh and try again.';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }

      this._error.set(errorMessage);
      alert(errorMessage);
      return false;

    } finally {
      this._isLoading.set(false);
    }
  }
  
  async cancelListing(listing: Listing): Promise<boolean> {
    try {
      console.log(`❌ Cancelling listing ${listing.listingId}...`);
      
      const response = await firstValueFrom(
        this.http.post<CancelListingResponse>(`${this.API_URL}/api/marketplace/cancel`, {
          listingId: parseInt(listing.listingId)
        })
      );

      if (response && response.success) {
        console.log('✅ Listing cancelled successfully');
        await this.fetchListings();
        return true;
      } else {
        console.error('❌ Failed to cancel listing:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error cancelling listing:', error);
      return false;
    }
  }

  private parseMetadataToAchievement(metadataURI: string, tokenId: number): any {
    const achievements = [
      { id: 1, name: 'Galactic Commander', description: 'Highest global score', rarity: 'Legendary', requirement: 100000, achievementType: 'score' },
      { id: 2, name: 'Stellar Destroyer', description: 'Highest total kills', rarity: 'Legendary', requirement: 50, achievementType: 'kills' },
      { id: 3, name: 'Photonic Blade', description: 'Best accuracy >= 85%', rarity: 'Epic', requirement: 85, achievementType: 'accuracy' },
      { id: 7, name: 'Orbital Sniper', description: 'Precision > 95%', rarity: 'Epic', requirement: 95, achievementType: 'accuracy' },
      { id: 6, name: 'Solar Flame', description: 'High kills/min ratio', rarity: 'Rare', requirement: 10, achievementType: 'kills' },
      { id: 8, name: 'Void Survivor', description: 'Survival > 10 min', rarity: 'Rare', requirement: 600, achievementType: 'time' },
    ];

    if (metadataURI.includes('GalacticCommander')) return achievements[0];
    if (metadataURI.includes('StellarDestroyer')) return achievements[1];
    if (metadataURI.includes('PhotonicBlade')) return achievements[2];
    if (metadataURI.includes('OrbitalSniper')) return achievements[3];
    if (metadataURI.includes('SolarFlame')) return achievements[4];
    if (metadataURI.includes('VoidSurvivor')) return achievements[5];

    return achievements[tokenId % 6];
  }
}