import { Injectable, signal } from '@angular/core';
import { NFT } from '../models/marketplace.model';

// Mock NFTs du joueur - sera remplacé quand ton ami finit le système de minting
const MOCK_OWNED_NFTS: NFT[] = [
  { 
    tokenId: '201', 
    achievementId: '5', 
    metadataURI: '', 
    owner: 'CURRENT_USER_MOCK', 
    achievement: { 
      id: 5, 
      name: "Star Champion", 
      description: "Score above 90% of best player", 
      rarity: "Epic", 
      requirement: 50000, 
      achievementType: "score" 
    } 
  },
  { 
    tokenId: '202', 
    achievementId: '4', 
    metadataURI: '', 
    owner: 'CURRENT_USER_MOCK', 
    achievement: { 
      id: 4, 
      name: "Time Master", 
      description: "Longest survival duration", 
      rarity: "Epic", 
      requirement: 900, 
      achievementType: "time" 
    } 
  },
];

@Injectable({
  providedIn: 'root'
})
export class NftService {
  private readonly _playerNfts = signal<NFT[]>([]);
  public readonly playerNfts = this._playerNfts.asReadonly();

  private readonly _isLoading = signal(true);
  public readonly isLoading = this._isLoading.asReadonly();
  
  constructor() {
    this.refreshPlayerNfts();
  }

  async refreshPlayerNfts() {
    this._isLoading.set(true);
    
    // Pour l'instant, on utilise les mocks
    // TODO: Remplacer par un appel API quand le système de minting est prêt
    console.log("📦 Loading player NFTs (mock data for now)...");
    
    await new Promise(res => setTimeout(res, 1000));
    
    this._playerNfts.set(MOCK_OWNED_NFTS);
    this._isLoading.set(false);
    
    console.log(`✅ Player NFTs loaded: ${MOCK_OWNED_NFTS.length} NFTs`);
  }
}