export interface LeaderboardEntry {
  rank: number;
  player: string;              // Adresse wallet (EVM ou Hedera)
  score: number;               // Highest score (renommé de 'total_score')
  avatar: string;              // Emoji avatar
  
  // Champs additionnels depuis HCS
  highestScore?: number;       // Alias pour score (compatibilité)
  totalKills?: number;         // Total kills across all sessions
  averageAccuracy?: number;    // Average accuracy percentage
  totalSessions?: number;      // Number of games played
  isCurrentPlayer?: boolean;   // True si c'est le joueur connecté
}