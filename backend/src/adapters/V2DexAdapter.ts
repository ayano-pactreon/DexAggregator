import { Address, PublicClient } from 'viem';
import { DexAdapter, DexQuote, QuoteParams } from './DexAdapter';
import { DexConfig, Token } from '../types/common';
import { V2Service } from '../services/v2Service';
import { calculateV2PriceImpact, getPriceImpactWarning } from '../utils/priceImpact';

/**
 * Adapter for V2-style DEXes (Uniswap V2, Sushiswap, etc.)
 * Wraps the V2Service and provides a unified interface
 */
export class V2DexAdapter extends DexAdapter {
  private v2Service: V2Service;

  constructor(client: PublicClient, config: DexConfig) {
    if (config.version !== 'v2') {
      throw new Error('V2DexAdapter requires a v2 DEX config');
    }
    super(client, config);
    this.v2Service = new V2Service(client, config);
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: Address): Promise<Token> {
    return this.v2Service.getTokenInfo(tokenAddress);
  }

  /**
   * Get a quote for swapping tokens
   */
  async getQuote(params: QuoteParams): Promise<DexQuote> {
    const { tokenIn, tokenOut, amountIn } = params;

    try {
      const pairAddress = await this.v2Service.getPair(tokenIn, tokenOut);
      const amountOut = await this.v2Service.getQuote(tokenIn, tokenOut, amountIn);

      // Get pair data for price impact calculation
      const pairData = await this.v2Service.getPairData(pairAddress);
      const isToken0 = tokenIn.toLowerCase() === pairData.pair.token0.address.toLowerCase();
      const [reserveIn, reserveOut] = isToken0
        ? [pairData.pair.reserve0, pairData.pair.reserve1]
        : [pairData.pair.reserve1, pairData.pair.reserve0];

      // Calculate accurate price impact comparing mid price vs execution price
      const priceImpact = calculateV2PriceImpact(
        reserveIn,
        reserveOut,
        amountIn,
        amountOut,
        pairData.pair.token0.decimals,
        pairData.pair.token1.decimals
      );

      // Get price impact warning level
      const priceImpactWarning = getPriceImpactWarning(priceImpact);

      return {
        dex: 'V2',
        dexName: this.config.name,
        amountOut,
        priceImpact,
        priceImpactWarning,
        poolAddress: pairAddress,
      };
    } catch (error) {
      throw new Error(
        `Failed to get quote from ${this.config.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all possible quotes for a token pair
   * V2 DEXes only have one pool per token pair, so this returns a single quote
   */
  async getAllQuotes(params: Omit<QuoteParams, 'feeTier'>): Promise<DexQuote[]> {
    try {
      const quote = await this.getQuote(params);
      return [quote];
    } catch (error) {
      console.log(
        `Failed to get quote from ${this.config.name}:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
      return [];
    }
  }

  /**
   * Check if a pair exists for the given tokens
   */
  async poolExists(tokenIn: Address, tokenOut: Address): Promise<boolean> {
    try {
      const pairAddress = await this.v2Service.getPair(tokenIn, tokenOut);
      return pairAddress !== '0x0000000000000000000000000000000000000000';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the underlying V2Service for advanced operations
   */
  getService(): V2Service {
    return this.v2Service;
  }
}
