import { Address } from 'viem';
import { Token } from '../types/common';

/**
 * Well-known tokens on Polkadot EVM Mainnet
 */
export const MAINNET_TOKENS = {
  DOT: {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address,
    symbol: 'DOT',
    name: 'Polkadot',
    decimals: 18,
    isNative: true,
  },
  WBTC: {
    address: '0xF8Eb4Ed0d4CF2bb707c0272F8C6827dEB6e4c0A9' as Address,
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
  },
  USDC: {
    address: '0xa16148c6Ac9EDe0D82f0c52899e22a575284f131' as Address,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  WETH: {
    address: '0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E' as Address,
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  USDT: {
    address: '0x9F8CF9c00fac501b3965872f4ed3271f6f4d06fF' as Address,
    symbol: 'USDT',
    name: 'Tether',
    decimals: 6,
  },
  DAI: {
    address: '0xDc556F7209C48fC53a8cDf1339c033743A7e3e75' as Address,
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
  },
  FDUSD: {
    address: '0xE5747226D2005d7f0865780E8517397de66f2a76' as Address,
    symbol: 'FDUSD',
    name: 'First Digital USD',
    decimals: 18,
  },
} as const;

/**
 * Well-known tokens on Polkadot EVM Testnet
 * TODO: Update with actual testnet token addresses
 */
export const TESTNET_TOKENS = {
  DOT: {
    address: '0x0000000000000000000000000000000000000000' as Address,
    symbol: 'DOT',
    name: 'Polkadot',
    decimals: 18,
  },
  WETH: {
    address: '0x0000000000000000000000000000000000000000' as Address,
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  USDC: {
    address: '0x0000000000000000000000000000000000000000' as Address,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  // Add more testnet tokens as needed
} as const;

/**
 * Token list type
 */
export type TokenList = typeof MAINNET_TOKENS;
export type TokenSymbol = keyof typeof MAINNET_TOKENS;

/**
 * Helper class for working with tokens
 */
export class TokenRegistry {
  private tokens: Record<string, Token>;

  constructor(tokenList: Record<string, Token>) {
    this.tokens = tokenList;
  }

  /**
   * Get token by symbol
   */
  getBySymbol(symbol: string): Token | undefined {
    return this.tokens[symbol.toUpperCase()];
  }

  /**
   * Get token by address (case-insensitive)
   */
  getByAddress(address: string): Token | undefined {
    const normalizedAddress = address.toLowerCase();
    return Object.values(this.tokens).find(
      (token) => token.address.toLowerCase() === normalizedAddress
    );
  }

  /**
   * Get all tokens
   */
  getAllTokens(): Token[] {
    return Object.values(this.tokens);
  }

  /**
   * Get all token symbols
   */
  getSymbols(): string[] {
    return Object.keys(this.tokens);
  }

  /**
   * Check if token exists by symbol
   */
  hasSymbol(symbol: string): boolean {
    return symbol.toUpperCase() in this.tokens;
  }

  /**
   * Check if token exists by address
   */
  hasAddress(address: string): boolean {
    return this.getByAddress(address) !== undefined;
  }

  /**
   * Get token address by symbol
   */
  getAddress(symbol: string): Address | undefined {
    return this.tokens[symbol.toUpperCase()]?.address;
  }

  /**
   * Get common trading pairs (useful for routing)
   */
  getCommonBases(): Token[] {
    const baseSymbols = ['DOT', 'WETH', 'USDC', 'USDT', 'DAI'];
    return baseSymbols
      .map((symbol) => this.getBySymbol(symbol))
      .filter((token): token is Token => token !== undefined);
  }
}

/**
 * Pre-initialized registries
 */
export const MAINNET_TOKEN_REGISTRY = new TokenRegistry(MAINNET_TOKENS);
export const TESTNET_TOKEN_REGISTRY = new TokenRegistry(TESTNET_TOKENS);

/**
 * Get token registry based on chain ID
 */
export function getTokenRegistry(chainId: number): TokenRegistry {
  if (chainId === 1440002) {
    // Polkadot EVM Mainnet
    return MAINNET_TOKEN_REGISTRY;
  } else if (chainId === 1440001) {
    // Polkadot EVM Testnet
    return TESTNET_TOKEN_REGISTRY;
  }
  // Default to mainnet
  return MAINNET_TOKEN_REGISTRY;
}

/**
 * Helper function to create token pairs for common routes
 */
export function getCommonPairs(): Array<[Token, Token]> {
  const tokens = MAINNET_TOKEN_REGISTRY.getAllTokens();
  const pairs: Array<[Token, Token]> = [];

  // Create pairs with base tokens
  const bases = MAINNET_TOKEN_REGISTRY.getCommonBases();

  for (const token of tokens) {
    for (const base of bases) {
      if (token.address !== base.address) {
        pairs.push([token, base]);
      }
    }
  }

  return pairs;
}

/**
 * Native token placeholder address (used for native DOT/ETH)
 */
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address;

/**
 * Check if a token address is the native token placeholder
 */
export function isNativeToken(tokenAddress: Address): boolean {
  return tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();
}
