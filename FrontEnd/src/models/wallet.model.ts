export type WalletStatus = 'disconnected' | 'connecting' | 'connected';

export interface WalletState {
  status: WalletStatus;
  accountId?: string; // Hedera Account ID
  address?: string; // EVM-compatible address, for consistency
  balance?: string;
  network?: string;
  profileId?: string;
  username?: string;
}