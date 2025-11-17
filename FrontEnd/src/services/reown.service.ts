import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { hederaTestnet, projectMetadata } from '../config/hedera.config';

@Injectable({
  providedIn: 'root',
})
export class ReownService {
  private platformId = inject(PLATFORM_ID);
  private appKit: any = null;
  private wagmiAdapter: any = null;

  private readonly _isInitialized = signal(false);
  public readonly isInitialized = this._isInitialized.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeAppKit();
    }
  }

  private async initializeAppKit() {
    try {
      // Créez votre Project ID sur https://cloud.reown.com
      const projectId = 'c9331a82e4e29bff4088788b03c19934'; // À REMPLACER

      // Configuration du Wagmi Adapter
      this.wagmiAdapter = new WagmiAdapter({
        networks: [hederaTestnet],
        projectId,
      });

      // Initialisation de AppKit
      this.appKit = createAppKit({
        adapters: [this.wagmiAdapter],
        networks: [hederaTestnet],
        projectId,
        metadata: projectMetadata,
        features: {
          analytics: true,
          email: false,
          socials: false,
        },
        themeMode: 'dark',
        themeVariables: {
          '--w3m-accent': '#FF781E', // Votre couleur primaire
          '--w3m-border-radius-master': '8px',
        },
      });

      this._isInitialized.set(true);
      console.log('Reown AppKit initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Reown AppKit:', error);
    }
  }

  openModal() {
    if (this.appKit) {
      this.appKit.open();
    }
  }

  closeModal() {
    if (this.appKit) {
      this.appKit.close();
    }
  }

  disconnect() {
    if (this.appKit) {
      this.appKit.disconnect();
    }
  }

  getAppKit() {
    return this.appKit;
  }

  getWagmiAdapter() {
    return this.wagmiAdapter;
  }
}
