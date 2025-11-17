export interface GameSession {
  timestamp: number;
  score: number;
  kills: number;
  accuracy: number;
  maxStreak: number;
  level: number;
  duration: number;
  nftsEarned: number;
  nftsList?: string[];
}
