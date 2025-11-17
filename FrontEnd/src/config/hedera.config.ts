import { defineChain } from 'viem';

// Hedera Testnet Chain Configuration
export const hederaTestnet = defineChain({
  id: 296,
  name: 'Hedera Testnet',
  network: 'hedera-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.hashio.io/api'],
    },
    public: {
      http: ['https://testnet.hashio.io/api'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HashScan',
      url: 'https://hashscan.io/testnet',
    },
  },
  testnet: true,
});

// Metadata for your dApp
export const projectMetadata = {
  name: 'Spaceship War',
  description: 'A Web3 spaceship war game on Hedera',
  url: 'https://spaceshipwar.com', // Remplacez par votre URL
  icons: ['https://spaceshipwar.com/icon.png'], // Remplacez par votre icône
};
