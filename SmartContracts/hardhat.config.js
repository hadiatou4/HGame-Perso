require('@nomicfoundation/hardhat-toolbox');
require('@nomicfoundation/hardhat-verify');
require('hardhat-gas-reporter');
require('hardhat-contract-sizer');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

// Validation des variables d'environnement
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  '0x0000000000000000000000000000000000000000000000000000000000000000';
const HEDERA_TESTNET_RPC =
  process.env.HEDERA_TESTNET_RPC || 'https://testnet.hashio.io/api';
const HEDERA_MAINNET_RPC =
  process.env.HEDERA_MAINNET_RPC || 'https://mainnet.hashio.io/api';
const HEDERA_PREVIEWNET_RPC =
  process.env.HEDERA_PREVIEWNET_RPC || 'https://previewnet.hashio.io/api';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || '';

// Configuration des comptes
const accounts =
  PRIVATE_KEY !==
  '0x0000000000000000000000000000000000000000000000000000000000000000'
    ? [PRIVATE_KEY]
    : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.20',
        settings: {
          viaIR: true,
          metadata: { bytecodeHash: 'ipfs' },
          optimizer: {
            enabled: true,
            runs: 200,
            details: {
              cse: true,
              yul: true,
              inliner: false,
              peephole: true,
              yulDetails: {
                optimizerSteps: 'dhfoDgvulfnTUtnIf:fDnTOc',
                stackAllocation: true,
              },
              deduplicate: true,
              orderLiterals: true,
              jumpdestRemover: true,
              constantOptimizer: true,
            },
          },
          evmVersion: 'paris',
        },
      },
    ],
  },

  networks: {
    // Hedera Testnet
    hederaTestnet: {
      url: HEDERA_TESTNET_RPC,
      accounts: accounts,
      chainId: 296,
      gasPrice: 650000000000, // 650 Gwei
      gasMultiplier: 1.2,
      timeout: 900000,
      confirmations: 2,
    },

    // Hedera Mainnet
    hederaMainnet: {
      url: HEDERA_MAINNET_RPC,
      accounts: accounts,
      chainId: 295,
      gasPrice: 100000000000, // 100 Gwei
      gasMultiplier: 1.2,
      timeout: 60000,
      confirmations: 3,
    },

    // Hedera Previewnet
    hederaPreviewnet: {
      url: HEDERA_PREVIEWNET_RPC,
      accounts: accounts,
      chainId: 297,
      gasPrice: 100000000000, // 100 Gwei
      gasMultiplier: 1.2,
      timeout: 60000,
      confirmations: 2,
    },

    // Local Hardhat Network (pour tests)
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
      gas: 'auto',
      gasPrice: 'auto',
      gasMultiplier: 1,
      mining: {
        auto: true,
        interval: 0,
      },
    },

    // Localhost (Ganache ou autre)
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
      gas: 'auto',
      gasPrice: 'auto',
      gasMultiplier: 1,
    },
  },

  // Configuration pour la vérification des contrats
  etherscan: {
    apiKey: {
      hederaTestnet: ETHERSCAN_API_KEY,
      hederaMainnet: ETHERSCAN_API_KEY,
      hederaPreviewnet: ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: 'hederaTestnet',
        chainId: 296,
        urls: {
          apiURL: 'https://hashscan.io/api',
          browserURL: 'https://hashscan.io/testnet',
        },
      },
      {
        network: 'hederaMainnet',
        chainId: 295,
        urls: {
          apiURL: 'https://hashscan.io/api',
          browserURL: 'https://hashscan.io/mainnet',
        },
      },
      {
        network: 'hederaPreviewnet',
        chainId: 297,
        urls: {
          apiURL: 'https://hashscan.io/api',
          browserURL: 'https://hashscan.io/previewnet',
        },
      },
    ],
  },

  // Rapport de gas
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'USD',
    coinmarketcap: COINMARKETCAP_API_KEY,
    excludeContracts: [],
    src: './contracts',
    outputFile: 'gas-report.txt',
    noColors: false,
  },

  // Taille des contrats
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [
      'HederaGaming',
      'AchievementVerifier',
      'Leaderboard',
      'Marketplace',
      'Community',
    ],
  },

  // Chemins personnalisés
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },

  // Configuration des timeout pour les tests
  mocha: {
    timeout: 40000,
  },

  // Configuration TypeScript (si utilisé)
  typechain: {
    outDir: '../FrontEnd/src/contracts',
    target: 'ethers-v6',
    alwaysGenerateOverloads: false,
    externalArtifacts: ['externalArtifacts/*.json'],
    dontOverrideCompile: false,
  },
  sourcify: {
    enabled: true,
    apiUrl: 'https://sourcify.dev/server',
    // Optional: specify a different Sourcify repository
    browserUrl: 'https://repo.sourcify.dev',
  },
};