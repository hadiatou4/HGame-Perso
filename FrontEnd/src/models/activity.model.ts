// Types d'activités (adaptés pour les sessions de jeu HCS)
export type ActivityType = 
  | 'MINT'           // Epic game (score >= 1000)
  | 'TRANSFER'       // Great game (score >= 500)
  | 'GAME_SESSION'   // Normal game
  | 'REWARD'         // NFT reward (future)
  | 'SCORE_UPDATE';  // Score update (future)

export type ActivityStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'FAILED';

export interface Activity {
  type: ActivityType;
  txId: string;                    // HCS message ID (ex: "0.0.123456:10")
  status: ActivityStatus;
  timestamp: Date;
  payload: string;                 // Description de l'activité
  
  // Champs additionnels pour HCS
  player?: string;                 // Adresse du joueur
  transactionId?: string;          // Transaction ID Hedera (pour HashScan)
  metadata?: {
    score?: number;
    kills?: number;
    accuracy?: number;
    timeSurvived?: number;
    sequenceNumber?: number;
    consensusTimestamp?: string;
  };
}