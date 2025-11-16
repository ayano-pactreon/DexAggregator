import { ChainConfig } from '../types/common';

// Polkadot EVM Mainnet Configuration
export const POLKADOT_EVM_SIDECHAIN: ChainConfig = {
  chainId: 1440000, // Polkadot EVM Mainnet
  rpcUrl: process.env.RPC_URL || 'https://rpc.polkadotevm.org',
  name: 'Polkadot EVM',
  nativeCurrency: {
    name: 'Polkadot',
    symbol: 'DOT',
    decimals: 18,
  },
};

// Polkadot EVM Testnet Configuration
export const POLKADOT_EVM_TESTNET: ChainConfig = {
  chainId: 1449000, // Polkadot EVM Testnet
  rpcUrl: process.env.RPC_URL_TESTNET || 'https://rpc.testnet.polkadotevm.org',
  name: 'Polkadot EVM Testnet',
  nativeCurrency: {
    name: 'Polkadot',
    symbol: 'DOT',
    decimals: 18,
  },
};

// Export the default chain to use
export const DEFAULT_CHAIN = POLKADOT_EVM_SIDECHAIN;
