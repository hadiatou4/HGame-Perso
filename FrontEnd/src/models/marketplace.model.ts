export interface Achievement {
  id: number;
  name: string;
  description: string;
  rarity: string;
  requirement: number;
  achievementType: string;
}

export interface NFT {
  tokenId: string;
  achievementId: string;
  achievement: Achievement;
  metadataURI: string;
  owner?: string; // Owner address, if known
}

export interface Listing {
  listingId: string;
  tokenId: string;
  seller: string;
  price: string; // In HBAR, as a string
  active: boolean;
  listedAt: number; // Timestamp
  nft: NFT; // Nested NFT details
}
