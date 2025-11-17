import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-wallet-connect-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Le modal Reown s'affiche automatiquement, ce composant n'est plus nécessaire -->
    <!-- Vous pouvez le garder pour l'état de connexion ou le supprimer -->
    @if (walletState().status === 'connecting') {
    <div
      class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm"
    >
      <div
        class="glass-effect rounded-2xl p-8 md:p-12 text-center border-2 border-[rgba(var(--primary-rgb),0.3)] w-full max-w-md mx-4"
      >
        <h2 class="text-4xl font-orbitron font-bold mb-4 neon-text-primary">
          Connecting...
        </h2>
        <div
          class="flex items-center justify-center space-x-4 text-[rgb(var(--primary-rgb))] text-xl"
        >
          <svg
            class="animate-spin h-8 w-8"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Syncing Profile...</span>
        </div>
      </div>
    </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletConnectModalComponent {
  walletService = inject(WalletService);
  walletState = this.walletService.walletState;
}
