import { Address } from 'viem';
import { Token } from './common';

export interface V2Pair {
  address: Address;
  token0: Token;
  token1: Token;
  reserve0: bigint;
  reserve1: bigint;
  totalSupply: bigint;
  lastUpdated: number;
}

export interface V2PairData {
  pair: V2Pair;
  price0: string; // token1 per token0
  price1: string; // token0 per token1
  liquidity: {
    token0: string;
    token1: string;
    usd?: string;
  };
}

export interface V2Reserve {
  reserve0: bigint;
  reserve1: bigint;
  blockTimestampLast: number;
}

export interface V2SwapEvent {
  sender: Address;
  amount0In: bigint;
  amount1In: bigint;
  amount0Out: bigint;
  amount1Out: bigint;
  to: Address;
  blockNumber: bigint;
  transactionHash: string;
  timestamp: number;
}

export interface V2MintEvent {
  sender: Address;
  amount0: bigint;
  amount1: bigint;
  blockNumber: bigint;
  transactionHash: string;
  timestamp: number;
}

export interface V2BurnEvent {
  sender: Address;
  amount0: bigint;
  amount1: bigint;
  to: Address;
  blockNumber: bigint;
  transactionHash: string;
  timestamp: number;
}
