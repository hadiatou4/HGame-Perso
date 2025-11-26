import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Listing, NFT } from '../models/marketplace.model';
import { WalletService } from './wallet.service';
import { firstValueFrom } from 'rxjs';
import { getWalletClient, getAccount } from '@wagmi/core';
import { parseEther, parseUnits, encodeFunctionData } from 'viem';

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
  private readonly MARKETPLACE_ADDRESS = '0xAD40512Fe9e0b1198b60d38d85eAf04dBeaa41Ba' as `0x${string}`;

  private readonly _listings = signal<Listing[]>([]);
  public readonly listings = this._listings.asReadonly();
  
  private readonly _isLoading = signal(true);
  public readonly isLoading = this._isLoading.asReadonly();

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
            // Support ancien ET nouveau format
            price: item.priceFormatted || item.price, // Affichage
            priceWei: item.price.length > 18 ? item.price : undefined, // Wei si > 18 chars
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
    try {
      console.log(`💳 Purchasing NFT from listing ${listing.listingId}...`);
      
      const walletState = this.walletService.walletState();
      if (walletState.status !== 'connected') {
        alert('Please connect your wallet first');
        this.walletService.openConnectModal();
        return false;
      }

      // Récupérer le wallet client via Wagmi
      const reownService = (this.walletService as any).reownService;
      const wagmiConfig = reownService.getWagmiAdapter()?.wagmiConfig;
      
      if (!wagmiConfig) {
        alert('Wallet not properly configured');
        return false;
      }

      const walletClient = await getWalletClient(wagmiConfig);
      const account = getAccount(wagmiConfig);

      if (!walletClient || !account.address) {
        alert('Failed to get wallet client');
        return false;
      }

      // Utiliser le prix en Wei directement du backend
      // Fallback : si priceWei n'existe pas, convertir depuis HBAR
      let priceInWei: bigint;
      
      if (listing.priceWei) {
        // Nouveau format : prix en Wei directement
        priceInWei = BigInt(listing.priceWei);
        console.log('✅ Using priceWei from backend');
      } else {
        // Ancien format : convertir depuis HBAR
        const priceStr = listing.price.replace(' HBAR', '').trim();
        priceInWei = parseUnits(priceStr, 18);
        console.log('⚠️ Fallback: Converting HBAR to Wei');
      }
      
      console.log('🔍 PRIX DEBUG:');
      console.log('   listing.price (display):', listing.price);
      console.log('   listing.priceWei:', listing.priceWei || 'not provided');
      console.log('   priceInWei (BigInt):', priceInWei.toString());
      console.log('   Expected 18 digits');

      // Encoder l'appel à buyNFT(uint256)
      const data = encodeFunctionData({
        abi: MARKETPLACE_ABI,
        functionName: 'buyNFT',
        args: [BigInt(listing.listingId)],
      });

      console.log('📤 Sending transaction...');
      console.log('   From:', account.address);
      console.log('   To:', this.MARKETPLACE_ADDRESS);
      console.log('   Value:', listing.price, 'HBAR');
      console.log('   Listing ID:', listing.listingId);

      // Envoyer la transaction via Reown/Wagmi
      const txHash = await walletClient.sendTransaction({
        account: account.address,
        to: this.MARKETPLACE_ADDRESS,
        value: priceInWei,
        data: data,
        // Retirer chain pour éviter l'erreur kzg
      } as any); // Cast en any pour contourner les problèmes de typage viem

      console.log('⏳ Transaction sent:', txHash);
      console.log('   Waiting for confirmation...');

      // Attendre la confirmation (optionnel, dépend de ta config Wagmi)
      // const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash });
      
      // Pour l'instant, on considère que c'est un succès
      alert(`✅ Transaction sent!\n\nTx Hash: ${txHash}\n\nThe NFT will be transferred once confirmed on the blockchain.`);

      // Rafraîchir les listings après quelques secondes
      setTimeout(() => {
        this.fetchListings();
      }, 5000);

      return true;
    } catch (error: any) {
      console.error('❌ Error buying NFT:', error);
      
      if (error.code === 4001 || error.message?.includes('User rejected')) {
        alert('Transaction cancelled by user');
      } else if (error.message?.includes('insufficient funds')) {
        alert('Insufficient HBAR balance');
      } else {
        alert(`Failed to purchase NFT: ${error.message || 'Unknown error'}`);
      }
      
      return false;
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