import { createPublicClient, http, PublicClient } from 'viem';
import { defineChain } from 'viem';
import { ChainConfig } from '../types/common';

/**
 * Create a viem chain definition from our ChainConfig
 */
export function createChainFromConfig(config: ChainConfig) {
  return defineChain({
    id: config.chainId,
    name: config.name,
    network: config.name.toLowerCase().replace(/\s+/g, '-'),
    nativeCurrency: config.nativeCurrency,
    rpcUrls: {
      default: {
        http: [config.rpcUrl],
      },
      public: {
        http: [config.rpcUrl],
      },
    },
  });
}

/**
 * Create a public client for reading blockchain data
 */
export function createProvider(config: ChainConfig): PublicClient {
  const chain = createChainFromConfig(config);

  return createPublicClient({
    chain,
    transport: http(config.rpcUrl, {
      timeout: 30_000, // 30 seconds
      retryCount: 3,
      retryDelay: 1000,
    }),
  });
}

/**
 * Create a public client with custom RPC URL
 */
export function createProviderWithRpc(rpcUrl: string, chainId: number): PublicClient {
  return createPublicClient({
    chain: {
      id: chainId,
      name: 'Custom Chain',
      network: 'custom',
      nativeCurrency: {
        name: 'Native Token',
        symbol: 'NATIVE',
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [rpcUrl],
        },
        public: {
          http: [rpcUrl],
        },
      },
    },
    transport: http(rpcUrl, {
      timeout: 30_000,
      retryCount: 3,
      retryDelay: 1000,
    }),
  });
}
