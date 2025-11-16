import { Address, PublicClient, encodeFunctionData } from 'viem';
import { Token } from '../types/common';
import { getV2Dexes, getV3Dexes } from '../config/dexes';
import { DexAdapter, DexQuote, V2DexAdapter, V3DexAdapter } from '../adapters';
import { V2Service } from './v2Service';

/**
 * Aggregated quote comparing all DEXes
 */
export interface AggregatedQuote {
  bestQuote: DexQuote;
  allQuotes: DexQuote[];
  tokenIn: Token;
  tokenOut: Token;
  amountIn: bigint;
  savings: {
    percentage: number;
    absoluteAmount: bigint;
  };
  recommendation: string;
}

/**
 * Export DexQuote for external use
 */
export type { DexQuote };

/**
 * Parameters for executing a swap through the aggregator
 */
export interface SwapParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
  deadline: bigint;
  recipient: Address;
}

/**
 * Aggregator Service
 * Compares quotes from multiple V2 DEXes and V3 DEXes to find the best price
 * Uses adapter pattern for clean separation of DEX-specific logic
 */
export class AggregatorService {
  private client: PublicClient;
  private adapters: Map<string, DexAdapter> = new Map();

  constructor(client: PublicClient) {
    this.client = client;

    // Initialize adapters for all configured V2 DEXes
    const v2Dexes = getV2Dexes();
    for (const dexConfig of v2Dexes) {
      const adapter = new V2DexAdapter(client, dexConfig);
      this.adapters.set(dexConfig.name, adapter);
    }

    // Initialize adapters for all configured V3 DEXes
    const v3Dexes = getV3Dexes();
    for (const dexConfig of v3Dexes) {
      const adapter = new V3DexAdapter(client, dexConfig);
      this.adapters.set(dexConfig.name, adapter);
    }
  }

  /**
   * Get token info (public method for API usage)
   */
  async getTokenInfo(tokenAddress: Address): Promise<Token> {
    // Use first available adapter to fetch token info
    const firstAdapter = Array.from(this.adapters.values())[0];

    if (!firstAdapter) {
      throw new Error('No DEX adapters configured to fetch token info');
    }

    return await firstAdapter.getTokenInfo(tokenAddress);
  }

  /**
   * Get a specific adapter by name
   */
  getAdapter(dexName: string): DexAdapter | undefined {
    return this.adapters.get(dexName);
  }

  /**
   * Get all configured adapters
   */
  getAllAdapters(): DexAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get quotes from all DEX adapters
   * Each adapter handles its own logic (V2 returns 1 quote, V3 returns multiple for different fee tiers)
   */
  private async getAllQuotes(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint
  ): Promise<DexQuote[]> {
    // Query all adapters in parallel
    const quotePromises = Array.from(this.adapters.values()).map(async (adapter) => {
      try {
        return await adapter.getAllQuotes({ tokenIn, tokenOut, amountIn });
      } catch (error) {
        console.log(
          `Failed to get quotes from ${adapter.getName()}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        return [];
      }
    });

    const results = await Promise.all(quotePromises);

    // Flatten the array of quote arrays into a single array
    return results.flat();
  }

  /**
   * Get aggregated quote comparing all DEXes and fee tiers
   */
  async getAggregatedQuote(
    tokenInAddress: Address,
    tokenOutAddress: Address,
    amountIn: bigint
  ): Promise<AggregatedQuote> {
    // Get token info (use first available adapter)
    const firstAdapter = Array.from(this.adapters.values())[0];
    if (!firstAdapter) {
      throw new Error('No DEX adapters configured');
    }

    const [tokenIn, tokenOut] = await Promise.all([
      firstAdapter.getTokenInfo(tokenInAddress),
      firstAdapter.getTokenInfo(tokenOutAddress),
    ]);

    // Get quotes from all adapters (V2 and V3)
    const allQuotes = await this.getAllQuotes(tokenInAddress, tokenOutAddress, amountIn);

    if (allQuotes.length === 0) {
      throw new Error('No liquidity found for this token pair on any DEX');
    }

    // Find best quote (highest amountOut)
    const bestQuote = allQuotes.reduce((best, current) =>
      current.amountOut > best.amountOut ? current : best
    );

    // Find worst quote for comparison
    const worstQuote = allQuotes.reduce((worst, current) =>
      current.amountOut < worst.amountOut ? current : worst
    );

    // Calculate savings
    const savingsAbsolute = bestQuote.amountOut - worstQuote.amountOut;
    const savingsPercentage = Number(savingsAbsolute * 10000n / worstQuote.amountOut) / 100;

    // Generate recommendation
    let recommendation = `Use ${bestQuote.dexName}`;
    if (bestQuote.dex === 'V3') {
      const feePercent = (bestQuote.feeTier! / 10000).toFixed(2);
      recommendation += ` V3 (${feePercent}% fee tier)`;
    } else {
      recommendation += ` V2`;
    }
    if (savingsPercentage > 0) {
      recommendation += ` for ${savingsPercentage.toFixed(2)}% better price`;
    }

    return {
      bestQuote,
      allQuotes,
      tokenIn,
      tokenOut,
      amountIn,
      savings: {
        percentage: savingsPercentage,
        absoluteAmount: savingsAbsolute,
      },
      recommendation,
    };
  }

  /**
   * Get best quote (simplified version)
   */
  async getBestQuote(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint
  ): Promise<DexQuote> {
    const aggregated = await this.getAggregatedQuote(tokenIn, tokenOut, amountIn);
    return aggregated.bestQuote;
  }

  /**
   * Generate calldata for executing swap through aggregator contract
   * This would be used by your frontend to call the smart contract
   */
  generateSwapCalldata(
    quote: DexQuote,
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint,
    minAmountOut: bigint,
    deadline: bigint
  ): `0x${string}` {
    if (quote.dex === 'V2') {
      // Encode call to aggregator's swapV2 function
      return encodeFunctionData({
        abi: [{
          name: 'swapV2',
          type: 'function',
          inputs: [
            { name: 'tokenIn', type: 'address' },
            { name: 'tokenOut', type: 'address' },
            { name: 'amountIn', type: 'uint256' },
            { name: 'minAmountOut', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
          outputs: [{ name: 'amountOut', type: 'uint256' }],
          stateMutability: 'nonpayable',
        }],
        functionName: 'swapV2',
        args: [tokenIn, tokenOut, amountIn, minAmountOut, deadline],
      });
    } else {
      // Encode call to aggregator's swapV3 function
      return encodeFunctionData({
        abi: [{
          name: 'swapV3',
          type: 'function',
          inputs: [
            { name: 'tokenIn', type: 'address' },
            { name: 'tokenOut', type: 'address' },
            { name: 'fee', type: 'uint24' },
            { name: 'amountIn', type: 'uint256' },
            { name: 'minAmountOut', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
          outputs: [{ name: 'amountOut', type: 'uint256' }],
          stateMutability: 'nonpayable',
        }],
        functionName: 'swapV3',
        args: [tokenIn, tokenOut, quote.feeTier!, amountIn, minAmountOut, deadline],
      });
    }
  }
}
