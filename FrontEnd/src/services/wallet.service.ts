import { Injectable, signal, inject, effect } from '@angular/core';
import { WalletState } from '../models/wallet.model';
import { SupabaseService } from './supabase.service';
import { ReownService } from './reown.service';
import { watchAccount, getAccount, getBalance } from '@wagmi/core';
@Injectable({ providedIn: 'root' })
export class WalletService {
  private supabase = inject(SupabaseService);
  private reownService = inject(ReownService);

  private readonly _walletState = signal<WalletState>({
    status: 'disconnected',
  });
  public readonly walletState = this._walletState.asReadonly();

  private readonly _isConnectModalOpen = signal(false);
  public readonly isConnectModalOpen = this._isConnectModalOpen.asReadonly();

  private unsubscribe: (() => void) | null = null;

  constructor() {
    // Attendre que Reown soit initialisé avant de configurer les watchers
    effect(() => {
      if (this.reownService.isInitialized()) {
        this.setupAccountWatcher();
        this.checkInitialConnection();
      }
    });
  }

  private setupAccountWatcher() {
    const wagmiConfig = this.reownService.getWagmiAdapter()?.wagmiConfig;
    if (!wagmiConfig) return;

    // Observer les changements de compte
    this.unsubscribe = watchAccount(wagmiConfig, {
      onChange: async (account) => {
        if (account.isConnected && account.address) {
          await this.handleAccountConnected(account);
        } else {
          this.handleAccountDisconnected();
        }
      },
    });
  }

  private async checkInitialConnection() {
    const wagmiConfig = this.reownService.getWagmiAdapter()?.wagmiConfig;
    if (!wagmiConfig) return;

    const account = getAccount(wagmiConfig);
    if (account.isConnected && account.address) {
      await this.handleAccountConnected(account);
    }
  }

  private async handleAccountConnected(account: any) {
    this._walletState.update((state) => ({ ...state, status: 'connecting' }));

    try {
      const address = account.address;
      const wagmiConfig = this.reownService.getWagmiAdapter()?.wagmiConfig;

      // Récupérer le solde HBAR
      let balance = '0';
      if (wagmiConfig) {
        try {
          const balanceResult = await getBalance(wagmiConfig, { address });
          balance = (Number(balanceResult.formatted) || 0).toFixed(2);
        } catch (e) {
          console.warn('Could not fetch balance:', e);
        }
      }

      // Convertir l'adresse EVM en Account ID Hedera (approximatif)
      // Note: Pour une conversion précise, vous auriez besoin d'appeler un service backend
      const mockAccountId = await this.evmAddressToAccountId(address);

      // Récupérer ou créer le profil utilisateur
      const { data: profile, error } = await this.supabase.client
        .from('profiles')
        .select('*')
        .eq('wallet_address', address)
        .single();

      let userProfile = profile;

      if (error || !profile) {
        console.log('No profile found, creating one.');
        const { data: newProfile, error: insertError } =
          await this.supabase.client
            .from('profiles')
            .insert({
              wallet_address: address,
              wallet_type: 'metamask', // ou détectez le wallet utilisé
              hedera_account_id: mockAccountId,
              username: `Pilot-${address.slice(2, 8)}`,
            })
            .select()
            .single();

        if (insertError) throw insertError;
        userProfile = newProfile;
      }

      // Mettre à jour l'état du wallet
      this._walletState.set({
        status: 'connected',
        accountId: mockAccountId,
        address: address,
        balance: `${balance} HBAR`,
        network: 'Hedera Testnet',
        profileId: userProfile.id,
        username: userProfile.username ?? 'Pilot',
      });

      console.log('Wallet connected:', address);
    } catch (e) {
      console.error('Failed to handle account connection:', e);
      this._walletState.set({ status: 'disconnected' });
    }
  }

  private handleAccountDisconnected() {
    this._walletState.set({ status: 'disconnected' });
    console.log('Wallet disconnected');
  }

  // Conversion approximative d'une adresse EVM en Account ID Hedera
  // Note: Ceci est une simplification. Pour une vraie application, utilisez Mirror Node API
  // private evmAddressToAccountId(address: string): string {
  //   // Génère un Account ID fictif basé sur l'adresse
  //   const numericPart = parseInt(address.slice(2, 10), 16) % 1000000;
  //   return `0.0.${numericPart}`;
  // }

  // Resolve the Hedera account ID (0.0.x) of an EVM address through the public
  // Mirror Node REST API. Read-only: no operator account or private key needed.
  private async evmAddressToAccountId(
    evmAddress: string
  ): Promise<string | null> {
    try {
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${evmAddress}`
      );
      if (!response.ok) {
        throw new Error(`Mirror Node returned ${response.status}`);
      }
      const accountInfo = await response.json();
      return accountInfo.account ?? null; // ex: "0.0.12345"
    } catch (error) {
      console.error('❌ Failed to resolve Hedera Account ID from EVM:', error);
      return null;
    }
  }

  openConnectModal() {
    this.reownService.openModal();
  }

  closeConnectModal() {
    this.reownService.closeModal();
  }

  async connect() {
    this.openConnectModal();
  }

  disconnect() {
    this.reownService.disconnect();
    this._walletState.set({ status: 'disconnected' });
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
