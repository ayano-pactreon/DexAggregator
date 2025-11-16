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

// Define XRPL EVM Sidechain (Mainnet)
export const xrplEvmSidechain = defineChain({
  id: 1440000,
  name: 'XRPL EVM Sidechain',
  network: 'xrpl-evm-sidechain',
  nativeCurrency: {
    name: 'XRP',
    symbol: 'XRP',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.xrplevm.org'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.xrplevm.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'XRPL EVM Explorer',
      url: 'https://explorer.xrplevm.org',
    },
  },
});

const chains = [xrplEvmSidechain, mainnet, arbitrum, sepolia] as const;

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
