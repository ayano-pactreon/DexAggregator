// src/config/index.tsx
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { cookieStorage, createStorage } from 'wagmi';
import { mainnet, arbitrum, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
if (!projectId) throw new Error('Project ID is not defined');

const metadata = {
  name: 'AppKit example',
  description: 'AppKit Example',
  url: 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Define Paseo Testnet
export const paseoTestnet = defineChain({
  id: 420420422,
  name: 'Paseo Testnet',
  network: 'paseo-testnet',
  nativeCurrency: {
    name: 'PAS',
    symbol: 'PAS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-passet-hub-eth-rpc.polkadot.io'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-passet-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Paseo Explorer',
      url: 'https://paseo.subscan.io',
    },
  },
});

const chains = [paseoTestnet, mainnet, arbitrum, sepolia] as const;

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,

  // ← Here’s the key: explicitly disable socials
  auth: {
    email: false,        // leave email login on if you want
    socials: [],        // ← no Google, X, GitHub, Discord, or Apple
    showWallets: true,  // keep on-chain wallets visible
    walletFeatures: true
  },

  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
});
