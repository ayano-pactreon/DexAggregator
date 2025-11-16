import { Address, PublicClient } from 'viem';
import { DexAdapter, DexQuote, QuoteParams } from './DexAdapter';
import { DexConfig, Token } from '../types/common';
import { V3Service } from '../services/v3Service';
import { V3FeeTier } from '../types/v3';
import { calculateV3PriceImpactSimple, getPriceImpactWarning } from '../utils/priceImpact';

/**
 * Adapter for V3-style DEXes (Uniswap V3, Surge DEX, etc.)
 * Wraps the V3Service and provides a unified interface
 */
export class V3DexAdapter extends DexAdapter {
  private v3Service: V3Service;

  // Default fee tiers to check for V3 pools
  private readonly DEFAULT_FEE_TIERS = [
    V3FeeTier.LOWEST,  // 100 (0.01%) - for stablecoin pairs
    V3FeeTier.LOW,     // 500 (0.05%)
    V3FeeTier.MEDIUM,  // 3000 (0.3%)
    V3FeeTier.HIGH,    // 10000 (1%)
  ];

  constructor(client: PublicClient, config: DexConfig) {
    if (config.version !== 'v3') {
      throw new Error('V3DexAdapter requires a v3 DEX config');
    }
    super(client, config);
    this.v3Service = new V3Service(client, config);
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: Address): Promise<Token> {
    return this.v3Service.getTokenInfo(tokenAddress);
  }

  /**
   * Get a quote for swapping tokens with a specific fee tier
   */
  async getQuote(params: QuoteParams): Promise<DexQuote> {
    const { tokenIn, tokenOut, amountIn, feeTier } = params;

    if (!feeTier) {
      throw new Error('Fee tier is required for V3 quotes');
    }

    try {
      const poolAddress = await this.v3Service.getPool(tokenIn, tokenOut, feeTier);
      const poolData = await this.v3Service.getPoolData(poolAddress);

      const quoteResult = await this.v3Service.quoteExactInputSingle({
        tokenIn,
        tokenOut,
        fee: feeTier,
        amountIn,
      });

      // Calculate price impact using sqrt price ratio (industry standard method)
      const priceImpact = calculateV3PriceImpactSimple(
        poolData.pool.sqrtPriceX96,
        quoteResult.sqrtPriceX96After
      );

      // Get price impact warning level
      const priceImpactWarning = getPriceImpactWarning(priceImpact);

      return {
        dex: 'V3',
        dexName: this.config.name,
        amountOut: quoteResult.amountOut,
        priceImpact,
        priceImpactWarning,
        gasEstimate: quoteResult.gasEstimate,
        feeTier,
        poolAddress,
      };
    } catch (error) {
      throw new Error(
        `Failed to get quote from ${this.config.name} (fee tier ${feeTier}): ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get all possible quotes for a token pair across all fee tiers
   * V3 DEXes can have multiple pools with different fee tiers
   */
  async getAllQuotes(params: Omit<QuoteParams, 'feeTier'>): Promise<DexQuote[]> {
    const { tokenIn, tokenOut, amountIn } = params;
    const quotes: DexQuote[] = [];

    // Query all fee tiers in parallel
    const quotePromises = this.DEFAULT_FEE_TIERS.map(async (feeTier) => {
      try {
        return await this.getQuote({ tokenIn, tokenOut, amountIn, feeTier });
      } catch (error) {
        console.log(
          `Failed to get quote from ${this.config.name} (fee tier ${feeTier}):`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        return null;
      }
    });

    const results = await Promise.all(quotePromises);
    const validQuotes = results.filter((q): q is DexQuote => q !== null);

    return validQuotes;
  }

  /**
   * Check if a pool exists for the given tokens and fee tier
   */
  async poolExists(tokenIn: Address, tokenOut: Address, feeTier?: number): Promise<boolean> {
    if (!feeTier) {
      // Check if any pool exists with any fee tier
      for (const tier of this.DEFAULT_FEE_TIERS) {
        const exists = await this.poolExists(tokenIn, tokenOut, tier);
        if (exists) return true;
      }
      return false;
    }

    try {
      const poolAddress = await this.v3Service.getPool(tokenIn, tokenOut, feeTier);
      return poolAddress !== '0x0000000000000000000000000000000000000000';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the underlying V3Service for advanced operations
   */
  getService(): V3Service {
    return this.v3Service;
  }

  /**
   * Get the default fee tiers this adapter checks
   */
  getDefaultFeeTiers(): number[] {
    return [...this.DEFAULT_FEE_TIERS];
  }

  /**
   * Set custom fee tiers to check
   */
  setFeeTiers(feeTiers: number[]): void {
    (this.DEFAULT_FEE_TIERS as number[]) = [...feeTiers];
  }
}
