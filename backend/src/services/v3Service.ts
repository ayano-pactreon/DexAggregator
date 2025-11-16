import { Address, PublicClient, getContract } from 'viem';
import { V3_FACTORY_ABI } from '../contracts/abis/v3Factory';
import { V3_POOL_ABI } from '../contracts/abis/v3Pool';
import { V3_QUOTER_ABI } from '../contracts/abis/v3Quoter';
import { ERC20_ABI } from '../contracts/abis/erc20';
import { DexConfig, Token } from '../types/common';
import {
  V3Pool,
  V3PoolData,
  V3Slot0,
  V3QuoteParams,
  V3QuoteResult,
  V3Tick,
  TICK_SPACINGS,
} from '../types/v3';
import { validateAddress } from '../utils/validation';
import {
  sqrtPriceX96ToPrice,
  sqrtPriceX96ToInversePrice,
  getNearestUsableTick,
} from '../utils/calculations';
import { formatTokenAmount } from '../utils/formatting';

export class V3Service {
  private client: PublicClient;
  private config: DexConfig;

  constructor(client: PublicClient, config: DexConfig) {
    if (config.version !== 'v3') {
      throw new Error('Invalid DEX config: expected V3');
    }
    this.client = client;
    this.config = config;
  }

  /**
   * Get the factory contract instance
   */
  private getFactoryContract() {
    return getContract({
      address: this.config.factoryAddress,
      abi: V3_FACTORY_ABI,
      client: this.client,
    });
  }

  /**
   * Get a pool contract instance
   */
  private getPoolContract(poolAddress: Address) {
    return getContract({
      address: poolAddress,
      abi: V3_POOL_ABI,
      client: this.client,
    });
  }

  /**
   * Get a quoter contract instance
   */
  private getQuoterContract() {
    if (!this.config.quoterAddress) {
      throw new Error('Quoter address not configured');
    }
    return getContract({
      address: this.config.quoterAddress,
      abi: V3_QUOTER_ABI,
      client: this.client,
    });
  }

  /**
   * Get an ERC20 token contract instance
   */
  private getTokenContract(tokenAddress: Address) {
    return getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      client: this.client,
    });
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: string): Promise<Token> {
    const address = validateAddress(tokenAddress);
    const contract = this.getTokenContract(address);

    const [name, symbol, decimals] = await Promise.all([
      contract.read.name(),
      contract.read.symbol(),
      contract.read.decimals(),
    ]);

    return {
      address,
      name: name as string,
      symbol: symbol as string,
      decimals: Number(decimals),
    };
  }

  /**
   * Get pool address for two tokens and fee tier
   */
  async getPool(token0: string, token1: string, fee: number): Promise<Address> {
    const addr0 = validateAddress(token0);
    const addr1 = validateAddress(token1);
    const factory = this.getFactoryContract();

    const poolAddress = await factory.read.getPool([addr0, addr1, fee]);

    if (poolAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Pool not found for tokens: ${token0}, ${token1} with fee tier ${fee}`);
    }

    return poolAddress as Address;
  }

  /**
   * Get slot0 data from a pool (contains current price and tick)
   */
  async getSlot0(poolAddress: string): Promise<V3Slot0> {
    const address = validateAddress(poolAddress);
    const pool = this.getPoolContract(address);

    const slot0 = await pool.read.slot0();

    return {
      sqrtPriceX96: slot0[0] as bigint,
      tick: Number(slot0[1]),
      observationIndex: Number(slot0[2]),
      observationCardinality: Number(slot0[3]),
      observationCardinalityNext: Number(slot0[4]),
      feeProtocol: Number(slot0[5]),
      unlocked: slot0[6] as boolean,
    };
  }

  /**
   * Get complete pool information
   */
  async getPoolInfo(poolAddress: string): Promise<V3Pool> {
    const address = validateAddress(poolAddress);
    const pool = this.getPoolContract(address);

    const [token0Address, token1Address, fee, liquidity, slot0] = await Promise.all([
      pool.read.token0(),
      pool.read.token1(),
      pool.read.fee(),
      pool.read.liquidity(),
      pool.read.slot0(),
    ]);

    const [token0Info, token1Info] = await Promise.all([
      this.getTokenInfo(token0Address as string),
      this.getTokenInfo(token1Address as string),
    ]);

    return {
      address,
      token0: token0Info,
      token1: token1Info,
      fee: Number(fee),
      sqrtPriceX96: slot0[0] as bigint,
      liquidity: liquidity as bigint,
      tick: Number(slot0[1]),
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get pool data with calculated prices and liquidity
   */
  async getPoolData(poolAddress: string): Promise<V3PoolData> {
    const pool = await this.getPoolInfo(poolAddress);

    const price0 = sqrtPriceX96ToPrice(
      pool.sqrtPriceX96,
      pool.token0.decimals,
      pool.token1.decimals
    );

    const price1 = sqrtPriceX96ToInversePrice(
      pool.sqrtPriceX96,
      pool.token0.decimals,
      pool.token1.decimals
    );

    // Get tick spacing for this fee tier
    const tickSpacing = TICK_SPACINGS[pool.fee] || 60;

    return {
      pool,
      price0: price0.toString(),
      price1: price1.toString(),
      liquidity: {
        token0: pool.liquidity.toString(),
        token1: pool.liquidity.toString(),
      },
      tickSpacing,
    };
  }

  /**
   * Get current liquidity in a pool
   */
  async getLiquidity(poolAddress: string): Promise<bigint> {
    const address = validateAddress(poolAddress);
    const pool = this.getPoolContract(address);
    const liquidity = await pool.read.liquidity();
    return liquidity as bigint;
  }

  /**
   * Get tick data
   */
  async getTick(poolAddress: string, tick: number): Promise<V3Tick> {
    const address = validateAddress(poolAddress);
    const pool = this.getPoolContract(address);

    const tickData = await pool.read.ticks([tick]);

    return {
      liquidityGross: tickData[0] as bigint,
      liquidityNet: tickData[1] as bigint,
      feeGrowthOutside0X128: tickData[2] as bigint,
      feeGrowthOutside1X128: tickData[3] as bigint,
      tickCumulativeOutside: tickData[4] as bigint,
      secondsPerLiquidityOutsideX128: tickData[5] as bigint,
      secondsOutside: Number(tickData[6]),
      initialized: tickData[7] as boolean,
    };
  }

  /**
   * Get quote for exact input swap
   */
  async quoteExactInputSingle(params: V3QuoteParams): Promise<V3QuoteResult> {
    const quoter = this.getQuoterContract();

    const tokenIn = validateAddress(params.tokenIn);
    const tokenOut = validateAddress(params.tokenOut);
    const sqrtPriceLimitX96 = params.sqrtPriceLimitX96 || 0n;

    // Get pool data BEFORE the quote for price impact calculation
    const poolAddress = await this.getPool(tokenIn, tokenOut, params.fee);
    const poolInfo = await this.getPoolInfo(poolAddress);
    const sqrtPriceX96Before = poolInfo.sqrtPriceX96;
    const liquidityBefore = poolInfo.liquidity;

    // Surge DEX Quoter uses separate parameters, not a tuple
    const result = await quoter.simulate.quoteExactInputSingle([
      tokenIn,
      tokenOut,
      params.fee,
      params.amountIn,
      sqrtPriceLimitX96,
    ]);

    const amountOut = result.result as bigint;

    // Calculate price impact using the difference between mid price and execution price
    // Mid price from pool sqrtPriceX96
    // Execution price = amountOut / amountIn

    const isToken0 = tokenIn.toLowerCase() === poolInfo.token0.address.toLowerCase();

    // Convert sqrtPriceX96 to actual price (token1 per token0)
    const Q96 = 2n ** 96n;
    const sqrtPriceX96Float = Number(sqrtPriceX96Before) / Number(Q96);
    const midPrice = sqrtPriceX96Float ** 2;

    // Adjust for decimals
    const decimalAdjustment = 10 ** (poolInfo.token1.decimals - poolInfo.token0.decimals);
    const adjustedMidPrice = midPrice * decimalAdjustment;

    // Calculate execution price
    let executionPrice: number;
    if (isToken0) {
      // Selling token0 for token1
      // Execution price = how many token1 we get per token0
      executionPrice = Number(amountOut) / Number(params.amountIn);

      // Normalize by decimals
      executionPrice = executionPrice * (10 ** (poolInfo.token0.decimals - poolInfo.token1.decimals));
    } else {
      // Selling token1 for token0
      // Need to invert
      executionPrice = Number(params.amountIn) / Number(amountOut);
      executionPrice = executionPrice * (10 ** (poolInfo.token1.decimals - poolInfo.token0.decimals));
    }

    // Price impact = (executionPrice - midPrice) / midPrice * 100
    // For selling, execution price should be worse (lower) than mid price
    const priceImpactPercent = ((executionPrice - adjustedMidPrice) / adjustedMidPrice) * 100;

    // Calculate approximate sqrtPriceX96After based on the price impact
    // If price moved by X%, sqrtPrice moved by sqrt(1 + X/100)
    const priceRatio = 1 + priceImpactPercent / 100;
    const sqrtPriceRatio = Math.sqrt(Math.abs(priceRatio));
    const sqrtPriceX96After = BigInt(Math.floor(Number(sqrtPriceX96Before) * sqrtPriceRatio));

    // Estimate gas (typical V3 swap uses ~150k gas)
    const gasEstimate = 150000n;

    return {
      amountOut,
      sqrtPriceX96After,
      initializedTicksCrossed: 0, // Not available in Surge quoter
      gasEstimate,
    };
  }

  /**
   * Get quote for exact output swap
   */
  async quoteExactOutputSingle(
    tokenIn: Address,
    tokenOut: Address,
    fee: number,
    amountOut: bigint,
    sqrtPriceLimitX96?: bigint
  ): Promise<V3QuoteResult> {
    const quoter = this.getQuoterContract();

    const tokenInAddr = validateAddress(tokenIn);
    const tokenOutAddr = validateAddress(tokenOut);
    const sqrtLimit = sqrtPriceLimitX96 || 0n;

    // Surge DEX Quoter uses separate parameters, not a tuple
    const result = await quoter.simulate.quoteExactOutputSingle([
      tokenInAddr,
      tokenOutAddr,
      fee,
      amountOut,
      sqrtLimit,
    ]);

    // Surge DEX Quoter only returns amountIn
    // Get pool data for additional info
    const poolAddress = await this.getPool(tokenInAddr, tokenOutAddr, fee);
    const slot0After = await this.getSlot0(poolAddress);

    return {
      amountOut: result.result as bigint,
      sqrtPriceX96After: slot0After.sqrtPriceX96,
      initializedTicksCrossed: 0, // Not available in Surge quoter
      gasEstimate: 0n, // Not available in Surge quoter
    };
  }

  /**
   * Get simple quote (wrapper around quoteExactInputSingle for easier use)
   */
  async getQuote(
    tokenIn: string,
    tokenOut: string,
    fee: number,
    amountIn: bigint
  ): Promise<bigint> {
    const result = await this.quoteExactInputSingle({
      tokenIn: validateAddress(tokenIn),
      tokenOut: validateAddress(tokenOut),
      fee,
      amountIn,
    });

    return result.amountOut;
  }

  /**
   * Get fee tier information
   */
  async getFeeAmountTickSpacing(fee: number): Promise<number> {
    const factory = this.getFactoryContract();
    const tickSpacing = await factory.read.feeAmountTickSpacing([fee]);
    return Number(tickSpacing);
  }

  /**
   * Find all pools for a specific token pair across different fee tiers
   */
  async findPoolsForPair(token0: string, token1: string): Promise<Address[]> {
    const addr0 = validateAddress(token0);
    const addr1 = validateAddress(token1);
    const factory = this.getFactoryContract();

    const feeTiers = [100, 500, 3000, 10000]; // Common fee tiers
    const pools: Address[] = [];

    for (const fee of feeTiers) {
      try {
        const poolAddress = await factory.read.getPool([addr0, addr1, fee]);
        if (poolAddress !== '0x0000000000000000000000000000000000000000') {
          pools.push(poolAddress as Address);
        }
      } catch (error) {
        // Pool doesn't exist for this fee tier, continue
        continue;
      }
    }

    return pools;
  }

  /**
   * Get tick spacing for a pool
   */
  async getTickSpacing(poolAddress: string): Promise<number> {
    const address = validateAddress(poolAddress);
    const pool = this.getPoolContract(address);
    const tickSpacing = await pool.read.tickSpacing();
    return Number(tickSpacing);
  }

  /**
   * Get pool observations
   */
  async getObservation(poolAddress: string, index: number): Promise<{
    blockTimestamp: number;
    tickCumulative: bigint;
    secondsPerLiquidityCumulativeX128: bigint;
    initialized: boolean;
  }> {
    const address = validateAddress(poolAddress);
    const pool = this.getPoolContract(address);
    const observation = await pool.read.observations([BigInt(index)]);

    return {
      blockTimestamp: Number(observation[0]),
      tickCumulative: observation[1] as bigint,
      secondsPerLiquidityCumulativeX128: observation[2] as bigint,
      initialized: observation[3] as boolean,
    };
  }

  /**
   * Get fee growth global values
   */
  async getFeeGrowthGlobal(poolAddress: string): Promise<{
    feeGrowthGlobal0X128: bigint;
    feeGrowthGlobal1X128: bigint;
  }> {
    const address = validateAddress(poolAddress);
    const pool = this.getPoolContract(address);

    const [feeGrowthGlobal0X128, feeGrowthGlobal1X128] = await Promise.all([
      pool.read.feeGrowthGlobal0X128(),
      pool.read.feeGrowthGlobal1X128(),
    ]);

    return {
      feeGrowthGlobal0X128: feeGrowthGlobal0X128 as bigint,
      feeGrowthGlobal1X128: feeGrowthGlobal1X128 as bigint,
    };
  }

  /**
   * Get protocol fees
   */
  async getProtocolFees(poolAddress: string): Promise<{
    token0: bigint;
    token1: bigint;
  }> {
    const address = validateAddress(poolAddress);
    const pool = this.getPoolContract(address);
    const fees = await pool.read.protocolFees();

    return {
      token0: fees[0] as bigint,
      token1: fees[1] as bigint,
    };
  }
}
