import { tokensApi, TokenData } from '@/network';

// Re-export TokenData as ApiToken for backward compatibility
export type ApiToken = TokenData;

/**
 * Token Service - Wrapper around the network tokensApi
 * Provides a simpler interface for components to fetch token data
 */
export class TokenService {
  private static instance: TokenService;

  private constructor() {}

  static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * Fetch all available tokens
   * @param useCache - Whether to use cached data (default: true)
   * @returns Promise<ApiToken[]>
   */
  async fetchTokens(useCache: boolean = true): Promise<ApiToken[]> {
    return tokensApi.getTokens(useCache);
  }

  /**
   * Clear the token cache
   */
  clearCache(): void {
    tokensApi.clearCache();
  }

  /**
   * Get token by contract address
   * @param address - Token contract address
   * @returns Promise<ApiToken | undefined>
   */
  async getTokenByAddress(address: string): Promise<ApiToken | undefined> {
    return tokensApi.getTokenByAddress(address);
  }

  /**
   * Get token by symbol
   * @param symbol - Token symbol (e.g., "USDC")
   * @returns Promise<ApiToken | undefined>
   */
  async getTokenBySymbol(symbol: string): Promise<ApiToken | undefined> {
    return tokensApi.getTokenBySymbol(symbol);
  }

  /**
   * Get multiple tokens by their addresses
   * @param addresses - Array of token contract addresses
   * @returns Promise<ApiToken[]>
   */
  async getTokensByAddresses(addresses: string[]): Promise<ApiToken[]> {
    return tokensApi.getTokensByAddresses(addresses);
  }

  /**
   * Refresh tokens (force fetch from API)
   * @returns Promise<ApiToken[]>
   */
  async refreshTokens(): Promise<ApiToken[]> {
    return tokensApi.refreshTokens();
  }

  /**
   * Check if cache is valid
   * @returns boolean
   */
  isCacheValid(): boolean {
    return tokensApi.isCacheValid();
  }

  /**
   * Get cached tokens without making API call
   * @returns ApiToken[] | null
   */
  getCachedTokens(): ApiToken[] | null {
    return tokensApi.getCachedTokens();
  }
}

export const tokenService = TokenService.getInstance();
