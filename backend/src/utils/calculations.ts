/**
 * Calculate price of token0 in terms of token1
 * Price = reserve1 / reserve0
 */
export function calculatePrice(
  reserve0: bigint,
  reserve1: bigint,
  decimals0: number,
  decimals1: number
): number {
  if (reserve0 === 0n) return 0;

  // Adjust for decimals difference
  const decimalAdjustment = decimals1 - decimals0;
  const adjustment = 10 ** Math.abs(decimalAdjustment);

  const price = Number(reserve1) / Number(reserve0);

  return decimalAdjustment >= 0 ? price * adjustment : price / adjustment;
}

/**
 * Calculate output amount for a swap (Uniswap V2 formula)
 * amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
 */
export function getAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): bigint {
  if (amountIn <= 0n) {
    throw new Error('Insufficient input amount');
  }
  if (reserveIn <= 0n || reserveOut <= 0n) {
    throw new Error('Insufficient liquidity');
  }

  const amountInWithFee = amountIn * 997n;
  const numerator = amountInWithFee * reserveOut;
  const denominator = (reserveIn * 1000n) + amountInWithFee;

  return numerator / denominator;
}

/**
 * Calculate input amount required for desired output (Uniswap V2 formula)
 * amountIn = (reserveIn * amountOut * 1000) / ((reserveOut - amountOut) * 997) + 1
 */
export function getAmountIn(
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): bigint {
  if (amountOut <= 0n) {
    throw new Error('Insufficient output amount');
  }
  if (reserveIn <= 0n || reserveOut <= 0n) {
    throw new Error('Insufficient liquidity');
  }
  if (amountOut >= reserveOut) {
    throw new Error('Insufficient liquidity for desired output');
  }

  const numerator = reserveIn * amountOut * 1000n;
  const denominator = (reserveOut - amountOut) * 997n;

  return (numerator / denominator) + 1n;
}

/**
 * Calculate price impact of a trade
 * Returns percentage as a number (e.g., 0.5 for 0.5%)
 */
export function calculatePriceImpact(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  decimals0: number,
  decimals1: number
): number {
  const priceBefore = calculatePrice(reserveIn, reserveOut, decimals0, decimals1);

  const amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
  const newReserveIn = reserveIn + amountIn;
  const newReserveOut = reserveOut - amountOut;

  const priceAfter = calculatePrice(newReserveIn, newReserveOut, decimals0, decimals1);

  return Math.abs(((priceAfter - priceBefore) / priceBefore) * 100);
}

/**
 * Calculate effective price for a trade
 */
export function calculateEffectivePrice(
  amountIn: bigint,
  amountOut: bigint,
  decimals0: number,
  decimals1: number
): number {
  if (amountIn === 0n) return 0;

  const decimalAdjustment = decimals1 - decimals0;
  const adjustment = 10 ** Math.abs(decimalAdjustment);

  const price = Number(amountOut) / Number(amountIn);

  return decimalAdjustment >= 0 ? price * adjustment : price / adjustment;
}

/**
 * Calculate minimum amount out with slippage tolerance
 * @param amountOut Expected output amount
 * @param slippagePercent Slippage tolerance (e.g., 0.5 for 0.5%)
 */
export function calculateMinimumAmountOut(amountOut: bigint, slippagePercent: number): bigint {
  const slippageBps = BigInt(Math.floor(slippagePercent * 100));
  return (amountOut * (10000n - slippageBps)) / 10000n;
}

/**
 * Calculate maximum amount in with slippage tolerance
 * @param amountIn Expected input amount
 * @param slippagePercent Slippage tolerance (e.g., 0.5 for 0.5%)
 */
export function calculateMaximumAmountIn(amountIn: bigint, slippagePercent: number): bigint {
  const slippageBps = BigInt(Math.floor(slippagePercent * 100));
  return (amountIn * (10000n + slippageBps)) / 10000n;
}

// ============================================================================
// Uniswap V3 Calculations
// ============================================================================

const Q96 = 2n ** 96n;
const Q192 = 2n ** 192n;

/**
 * Calculate token0 price from sqrtPriceX96
 * Price of token0 in terms of token1
 */
export function sqrtPriceX96ToPrice(
  sqrtPriceX96: bigint,
  decimals0: number,
  decimals1: number
): number {
  const price = (Number(sqrtPriceX96) / Number(Q96)) ** 2;
  const decimalAdjustment = 10 ** (decimals1 - decimals0);
  return price * decimalAdjustment;
}

/**
 * Calculate token1 price from sqrtPriceX96
 * Price of token1 in terms of token0
 */
export function sqrtPriceX96ToInversePrice(
  sqrtPriceX96: bigint,
  decimals0: number,
  decimals1: number
): number {
  const price = (Number(Q96) / Number(sqrtPriceX96)) ** 2;
  const decimalAdjustment = 10 ** (decimals0 - decimals1);
  return price * decimalAdjustment;
}

/**
 * Convert price to sqrtPriceX96
 */
export function priceToSqrtPriceX96(price: number): bigint {
  const sqrt = Math.sqrt(price);
  return BigInt(Math.floor(sqrt * Number(Q96)));
}

/**
 * Calculate tick from sqrtPriceX96
 */
export function sqrtPriceX96ToTick(sqrtPriceX96: bigint): number {
  const price = (Number(sqrtPriceX96) / Number(Q96)) ** 2;
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

/**
 * Calculate sqrtPriceX96 from tick
 */
export function tickToSqrtPriceX96(tick: number): bigint {
  const price = 1.0001 ** tick;
  const sqrt = Math.sqrt(price);
  return BigInt(Math.floor(sqrt * Number(Q96)));
}

/**
 * Calculate liquidity from amounts (for current tick position)
 */
export function getLiquidityForAmounts(
  sqrtPriceX96: bigint,
  sqrtPriceAX96: bigint,
  sqrtPriceBX96: bigint,
  amount0: bigint,
  amount1: bigint
): bigint {
  if (sqrtPriceAX96 > sqrtPriceBX96) {
    [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }

  if (sqrtPriceX96 <= sqrtPriceAX96) {
    return getLiquidityForAmount0(sqrtPriceAX96, sqrtPriceBX96, amount0);
  } else if (sqrtPriceX96 < sqrtPriceBX96) {
    const liquidity0 = getLiquidityForAmount0(sqrtPriceX96, sqrtPriceBX96, amount0);
    const liquidity1 = getLiquidityForAmount1(sqrtPriceAX96, sqrtPriceX96, amount1);
    return liquidity0 < liquidity1 ? liquidity0 : liquidity1;
  } else {
    return getLiquidityForAmount1(sqrtPriceAX96, sqrtPriceBX96, amount1);
  }
}

/**
 * Calculate liquidity from amount0
 */
export function getLiquidityForAmount0(
  sqrtPriceAX96: bigint,
  sqrtPriceBX96: bigint,
  amount0: bigint
): bigint {
  if (sqrtPriceAX96 > sqrtPriceBX96) {
    [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }
  const intermediate = (sqrtPriceAX96 * sqrtPriceBX96) / Q96;
  return (amount0 * intermediate) / (sqrtPriceBX96 - sqrtPriceAX96);
}

/**
 * Calculate liquidity from amount1
 */
export function getLiquidityForAmount1(
  sqrtPriceAX96: bigint,
  sqrtPriceBX96: bigint,
  amount1: bigint
): bigint {
  if (sqrtPriceAX96 > sqrtPriceBX96) {
    [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }
  return (amount1 * Q96) / (sqrtPriceBX96 - sqrtPriceAX96);
}

/**
 * Calculate amount0 from liquidity
 */
export function getAmount0ForLiquidity(
  sqrtPriceAX96: bigint,
  sqrtPriceBX96: bigint,
  liquidity: bigint
): bigint {
  if (sqrtPriceAX96 > sqrtPriceBX96) {
    [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }
  return (liquidity * (sqrtPriceBX96 - sqrtPriceAX96) * Q96) / (sqrtPriceBX96 * sqrtPriceAX96);
}

/**
 * Calculate amount1 from liquidity
 */
export function getAmount1ForLiquidity(
  sqrtPriceAX96: bigint,
  sqrtPriceBX96: bigint,
  liquidity: bigint
): bigint {
  if (sqrtPriceAX96 > sqrtPriceBX96) {
    [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }
  return (liquidity * (sqrtPriceBX96 - sqrtPriceAX96)) / Q96;
}

/**
 * Get the nearest usable tick for a given tick and tick spacing
 */
export function getNearestUsableTick(tick: number, tickSpacing: number): number {
  const rounded = Math.round(tick / tickSpacing) * tickSpacing;

  // Ensure tick is within bounds
  const MIN_TICK = -887272;
  const MAX_TICK = 887272;

  if (rounded < MIN_TICK) return MIN_TICK;
  if (rounded > MAX_TICK) return MAX_TICK;

  return rounded;
}

/**
 * Calculate price impact for V3 swap
 */
export function calculateV3PriceImpact(
  sqrtPriceX96Before: bigint,
  sqrtPriceX96After: bigint,
  decimals0: number,
  decimals1: number
): number {
  const priceBefore = sqrtPriceX96ToPrice(sqrtPriceX96Before, decimals0, decimals1);
  const priceAfter = sqrtPriceX96ToPrice(sqrtPriceX96After, decimals0, decimals1);

  return Math.abs(((priceAfter - priceBefore) / priceBefore) * 100);
}
