import { Address } from 'viem';
import { Token } from './common';

/**
 * Uniswap V3 Pool
 */
export interface V3Pool {
  address: Address;
  token0: Token;
  token1: Token;
  fee: number; // Fee tier (e.g., 500, 3000, 10000)
  sqrtPriceX96: bigint;
  liquidity: bigint;
  tick: number;
  lastUpdated: number;
}

/**
 * V3 Pool data with additional computed fields
 */
export interface V3PoolData {
  pool: V3Pool;
  price0: string; // token1 per token0
  price1: string; // token0 per token1
  liquidity: {
    token0: string;
    token1: string;
    usd?: string;
  };
  tickSpacing: number;
}

/**
 * V3 Pool Slot0 data
 */
export interface V3Slot0 {
  sqrtPriceX96: bigint;
  tick: number;
  observationIndex: number;
  observationCardinality: number;
  observationCardinalityNext: number;
  feeProtocol: number;
  unlocked: boolean;
}

/**
 * V3 Position (NFT)
 */
export interface V3Position {
  tokenId: bigint;
  owner: Address;
  poolAddress: Address;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
}

/**
 * V3 Tick data
 */
export interface V3Tick {
  liquidityGross: bigint;
  liquidityNet: bigint;
  feeGrowthOutside0X128: bigint;
  feeGrowthOutside1X128: bigint;
  tickCumulativeOutside: bigint;
  secondsPerLiquidityOutsideX128: bigint;
  secondsOutside: number;
  initialized: boolean;
}

/**
 * V3 Quote parameters
 */
export interface V3QuoteParams {
  tokenIn: Address;
  tokenOut: Address;
  fee: number;
  amountIn: bigint;
  sqrtPriceLimitX96?: bigint;
}

/**
 * V3 Quote result
 */
export interface V3QuoteResult {
  amountOut: bigint;
  sqrtPriceX96After: bigint;
  initializedTicksCrossed: number;
  gasEstimate: bigint;
}

/**
 * V3 Fee tier enum
 */
export enum V3FeeTier {
  LOWEST = 100, // 0.01%
  LOW = 500, // 0.05%
  MEDIUM = 3000, // 0.3%
  HIGH = 10000, // 1%
}

/**
 * V3 Tick spacing by fee tier
 */
export const TICK_SPACINGS: Record<number, number> = {
  100: 1,
  500: 10,
  3000: 60,
  10000: 200,
};
