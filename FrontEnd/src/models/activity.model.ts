export type ActivityType = 'MINT' | 'REWARD' | 'SCORE_UPDATE' | 'TRANSFER';
export type ActivityStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface Activity {
  type: ActivityType;
  txId: string;
  status: ActivityStatus;
  timestamp: Date;
  payload: string;
}