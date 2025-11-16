/**
 * Price Impact Calculation Utilities
 *
 * How Major Aggregators Calculate Price Impact:
 *
 * 1. 1inch: Compares mid-market price vs execution price
 * 2. CowSwap: Uses oracle prices as reference
 * 3. Matcha: Compares spot price vs average execution price
 * 4. Uniswap Interface: Mid price vs execution price
 *
 * Formula:
 * Price Impact = ((Execution Price - Mid Price) / Mid Price) * 100
 *
 * Where:
 * - Mid Price = Current pool price (what you'd get with infinitesimal trade)
 * - Execution Price = Actual price you get (amountOut / amountIn)
 */

/**
 * Calculate price impact for V2-style AMM pools
 * Uses constant product formula: x * y = k
 *
 * @param reserveIn - Reserve of token being sold
 * @param reserveOut - Reserve of token being bought
 * @param amountIn - Amount of token being sold
 * @param amountOut - Amount of token being bought (from quote)
 * @param tokenInDecimals - Decimals of input token
 * @param tokenOutDecimals - Decimals of output token
 * @returns Price impact as percentage (e.g., 2.5 = 2.5%)
 */
export function calculateV2PriceImpact(
  reserveIn: bigint,
  reserveOut: bigint,
  amountIn: bigint,
  amountOut: bigint,
  tokenInDecimals: number,
  tokenOutDecimals: number
): number {
  // Calculate mid price (current spot price before trade)
  // Mid price = reserveOut / reserveIn (in token terms)
  // Need to normalize by decimals
  const midPrice =
    Number(reserveOut) / Number(reserveIn) *
    (10 ** tokenInDecimals / 10 ** tokenOutDecimals);

  // Calculate execution price (actual price from the trade)
  // Execution price = amountOut / amountIn
  const executionPrice =
    Number(amountOut) / Number(amountIn) *
    (10 ** tokenInDecimals / 10 ** tokenOutDecimals);

  // Price impact = (executionPrice - midPrice) / midPrice * 100
  // For sells, execution price should be worse (lower) than mid price
  // So price impact should be negative (but we show absolute value)
  const priceImpact = ((executionPrice - midPrice) / midPrice) * 100;

  return Math.abs(priceImpact);
}

/**
 * Alternative V2 calculation using the constant product formula directly
 * This matches what Uniswap interface does
 *
 * @param reserveIn - Reserve of token being sold
 * @param reserveOut - Reserve of token being bought
 * @param amountIn - Amount of token being sold (after fees)
 * @returns Price impact as percentage
 */
export function calculateV2PriceImpactDirect(
  reserveIn: bigint,
  reserveOut: bigint,
  amountIn: bigint
): number {
  // This is the formula Uniswap V2 interface uses
  // Price impact = 1 - (reserveIn * reserveOut) / ((reserveIn + amountIn) * (reserveOut - amountOut))
  // Simplified to: amountIn / (reserveIn + amountIn)

  const impact = Number(amountIn * 10000n) / Number(reserveIn + amountIn);
  return impact / 100;
}

/**
 * Calculate price impact for V3 pools
 * Uses tick-based pricing
 *
 * @param sqrtPriceX96Before - sqrt price before swap
 * @param sqrtPriceX96After - sqrt price after swap
 * @param amountIn - Amount of token being sold
 * @param amountOut - Amount of token being bought
 * @param token0Decimals - Decimals of token0
 * @param token1Decimals - Decimals of token1
 * @param isToken0 - Whether input token is token0
 * @returns Price impact as percentage
 */
export function calculateV3PriceImpact(
  sqrtPriceX96Before: bigint,
  sqrtPriceX96After: bigint,
  amountIn: bigint,
  amountOut: bigint,
  token0Decimals: number,
  token1Decimals: number,
  isToken0: boolean
): number {
  // V3 sqrtPriceX96 represents: sqrt(token1/token0) * 2^96
  // So price = (sqrtPriceX96 / 2^96)^2 gives token1/token0

  const Q96 = 2n ** 96n;

  // Calculate mid price (before swap) - this is token1/token0
  const sqrtPriceBefore = Number(sqrtPriceX96Before) / Number(Q96);
  const midPriceRaw = sqrtPriceBefore ** 2; // token1/token0 in raw form

  // Adjust for decimals: multiply by (10^token0Decimals / 10^token1Decimals)
  const midPrice = midPriceRaw * (10 ** token0Decimals / 10 ** token1Decimals);

  // Calculate execution price from actual amounts
  // If selling token0 for token1: executionPrice = token1Out / token0In
  // If selling token1 for token0: executionPrice = token0Out / token1In
  let executionPrice: number;

  if (isToken0) {
    // Selling token0, buying token1
    // Execution price should be: how many token1 per token0
    executionPrice = Number(amountOut) / Number(amountIn);
  } else {
    // Selling token1, buying token0
    // Need to invert to get token1/token0 price
    executionPrice = Number(amountIn) / Number(amountOut);
  }

  // Calculate price impact
  // For buys: execution price should be worse (higher) than mid price
  // For sells: execution price should be worse (lower) than mid price
  const priceImpact = Math.abs((executionPrice - midPrice) / midPrice) * 100;

  return priceImpact;
}

/**
 * Simplified V3 price impact using sqrt price ratio
 * This is what most aggregators use as it's simpler and sufficient
 *
 * @param sqrtPriceX96Before - sqrt price before swap
 * @param sqrtPriceX96After - sqrt price after swap
 * @returns Price impact as percentage
 */
export function calculateV3PriceImpactSimple(
  sqrtPriceX96Before: bigint,
  sqrtPriceX96After: bigint
): number {
  // Price = (sqrtPrice)^2
  // So price ratio = (sqrtPriceAfter / sqrtPriceBefore)^2
  const sqrtRatio = Number(sqrtPriceX96After) / Number(sqrtPriceX96Before);
  const priceRatio = sqrtRatio * sqrtRatio;

  // Price impact = |priceRatio - 1| * 100
  const priceImpact = Math.abs((priceRatio - 1) * 100);

  return priceImpact;
}

/**
 * Calculate slippage tolerance
 * This is what users set to protect against price movements
 *
 * @param amountOut - Expected amount out
 * @param slippagePercent - Slippage tolerance (e.g., 0.5 for 0.5%)
 * @returns Minimum amount out with slippage applied
 */
export function calculateMinimumAmountOut(
  amountOut: bigint,
  slippagePercent: number
): bigint {
  const slippageBps = Math.floor(slippagePercent * 100);
  const minAmount = (amountOut * BigInt(10000 - slippageBps)) / 10000n;
  return minAmount;
}

/**
 * Determine if price impact is acceptable
 * Based on common thresholds used by aggregators:
 * - < 1%: Low impact (green)
 * - 1-3%: Medium impact (yellow)
 * - 3-5%: High impact (orange)
 * - > 5%: Very high impact (red, warn user)
 * - > 15%: Extreme impact (block or require confirmation)
 *
 * @param priceImpact - Price impact percentage
 * @returns Warning level
 */
export function getPriceImpactWarning(priceImpact: number): {
  level: 'low' | 'medium' | 'high' | 'very-high' | 'extreme';
  message: string;
  shouldWarn: boolean;
  shouldBlock: boolean;
} {
  if (priceImpact < 1) {
    return {
      level: 'low',
      message: 'Low price impact',
      shouldWarn: false,
      shouldBlock: false,
    };
  } else if (priceImpact < 3) {
    return {
      level: 'medium',
      message: 'Medium price impact',
      shouldWarn: true,
      shouldBlock: false,
    };
  } else if (priceImpact < 5) {
    return {
      level: 'high',
      message: 'High price impact',
      shouldWarn: true,
      shouldBlock: false,
    };
  } else if (priceImpact < 15) {
    return {
      level: 'very-high',
      message: 'Very high price impact - you may lose a significant portion of your funds',
      shouldWarn: true,
      shouldBlock: false,
    };
  } else {
    return {
      level: 'extreme',
      message: 'Extreme price impact - this trade will result in major losses',
      shouldWarn: true,
      shouldBlock: true,
    };
  }
}

/**
 * Format price impact for display
 *
 * @param priceImpact - Price impact as percentage
 * @returns Formatted string
 */
export function formatPriceImpact(priceImpact: number): string {
  if (priceImpact < 0.01) {
    return '<0.01%';
  } else if (priceImpact < 0.1) {
    return priceImpact.toFixed(3) + '%';
  } else if (priceImpact < 1) {
    return priceImpact.toFixed(2) + '%';
  } else {
    return priceImpact.toFixed(2) + '%';
  }
}
