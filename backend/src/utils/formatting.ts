import { formatUnits, parseUnits } from 'viem';

/**
 * Format token amount to human-readable string
 */
export function formatTokenAmount(amount: bigint, decimals: number, maxDecimals: number = 6): string {
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);

  if (num === 0) return '0';

  // Use scientific notation for very small numbers
  if (num < 0.000001) {
    return num.toExponential(4);
  }

  // Limit decimal places for readability
  return num.toFixed(Math.min(maxDecimals, decimals));
}

/**
 * Parse human-readable token amount to bigint
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  return parseUnits(amount, decimals);
}

/**
 * Format price with appropriate precision
 */
export function formatPrice(price: number, maxDecimals: number = 6): string {
  if (price === 0) return '0';

  if (price < 0.000001) {
    return price.toExponential(4);
  }

  if (price < 1) {
    return price.toFixed(Math.min(8, maxDecimals));
  }

  if (price < 1000) {
    return price.toFixed(Math.min(4, maxDecimals));
  }

  return price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format USD value
 */
export function formatUSD(value: number): string {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}
