import { Address, PublicClient } from 'viem';
import { DexConfig, Token } from '../types/common';

/**
 * Quote result from a DEX
 */
export interface DexQuote {
  dex: 'V2' | 'V3';
  dexName: string;
  amountOut: bigint;
  priceImpact: number;
  priceImpactWarning?: {
    level: 'low' | 'medium' | 'high' | 'very-high' | 'extreme';
    message: string;
    shouldWarn: boolean;
    shouldBlock: boolean;
  };
  gasEstimate?: bigint;
  feeTier?: number; // Only for V3
  poolAddress?: Address;
}

/**
 * Parameters for getting a quote
 */
export interface QuoteParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  feeTier?: number; // Optional, only used for V3
}

/**
 * Abstract base class for DEX adapters
 * Each DEX implementation (V2/V3) will extend this class
 */
export abstract class DexAdapter {
  protected client: PublicClient;
  protected config: DexConfig;

  constructor(client: PublicClient, config: DexConfig) {
    this.client = client;
    this.config = config;
  }

  /**
   * Get the name of the DEX
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Get the version of the DEX (v2 or v3)
   */
  getVersion(): 'v2' | 'v3' {
    return this.config.version;
  }

  /**
   * Get token information
   */
  abstract getTokenInfo(tokenAddress: Address): Promise<Token>;

  /**
   * Get a quote for swapping tokens
   * Each DEX can implement this differently based on their architecture
   */
  abstract getQuote(params: QuoteParams): Promise<DexQuote>;

  /**
   * Get all possible quotes for a token pair
   * V2 DEXes return a single quote
   * V3 DEXes may return multiple quotes for different fee tiers
   */
  abstract getAllQuotes(params: Omit<QuoteParams, 'feeTier'>): Promise<DexQuote[]>;

  /**
   * Check if a pool/pair exists for the given tokens
   */
  abstract poolExists(tokenIn: Address, tokenOut: Address, feeTier?: number): Promise<boolean>;
}
