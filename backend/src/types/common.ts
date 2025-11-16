import { Address, Hash } from 'viem';

export interface Token {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  isNative?: boolean; // True for native gas tokens like DOT/ETH
}

export interface ChainConfig {
  chainId: number;
  rpcUrl: string;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface DexConfig {
  name: string;
  version: 'v2' | 'v3';
  factoryAddress: Address;
  routerAddress?: Address;
  quoterAddress?: Address;
  initCodeHash?: Hash; // Used for pair address calculation in V2
}

export interface TransactionInfo {
  hash: Hash;
  blockNumber: bigint;
  timestamp: number;
  from: Address;
  to: Address;
}
