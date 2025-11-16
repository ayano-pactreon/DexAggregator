import { apiClient } from '../clients';
import { TokensResponse, TokenData, handleApiError } from '../types';

export class TokensApi {
  private static instance: TokensApi;
  private cache: TokenData[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): TokensApi {
    if (!TokensApi.instance) {
      TokensApi.instance = new TokensApi();
    }
    return TokensApi.instance;
  }

  /**
   * Fetch all available tokens
   * @returns Promise<TokenData[]>
   */
  async getTokens(useCache: boolean = true): Promise<TokenData[]> {
    try {
      // Return cached data if still valid
      const now = Date.now();
      if (useCache && this.cache && now - this.cacheTimestamp < this.CACHE_DURATION) {
        return this.cache;
      }

      const response = await apiClient.get<TokensResponse>('/api/v2/tokens', {
        retries: 2,
      });

      if (response.success && response.data.tokens) {
        this.cache = response.data.tokens;
        this.cacheTimestamp = now;
        return response.data.tokens;
      } else {
        throw new Error(response.error || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);

      // Return cached data if available, even if expired
      if (this.cache) {
        console.warn('Returning stale cache due to fetch error');
        return this.cache;
      }

      throw handleApiError(error);
    }
  }

  /**
   * Get a specific token by address
   * @param address - Token contract address
   * @returns Promise<TokenData | undefined>
   */
  async getTokenByAddress(address: string): Promise<TokenData | undefined> {
    try {
      const tokens = await this.getTokens();
      return tokens.find(
        (token) => token.address.toLowerCase() === address.toLowerCase()
      );
    } catch (error) {
      console.error('Error getting token by address:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get a specific token by symbol
   * @param symbol - Token symbol (e.g., "USDC")
   * @returns Promise<TokenData | undefined>
   */
  async getTokenBySymbol(symbol: string): Promise<TokenData | undefined> {
    try {
      const tokens = await this.getTokens();
      return tokens.find(
        (token) => token.symbol.toLowerCase() === symbol.toLowerCase()
      );
    } catch (error) {
      console.error('Error getting token by symbol:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get multiple tokens by their addresses
   * @param addresses - Array of token contract addresses
   * @returns Promise<TokenData[]>
   */
  async getTokensByAddresses(addresses: string[]): Promise<TokenData[]> {
    try {
      const tokens = await this.getTokens();
      const lowerCaseAddresses = addresses.map((addr) => addr.toLowerCase());
      return tokens.filter((token) =>
        lowerCaseAddresses.includes(token.address.toLowerCase())
      );
    } catch (error) {
      console.error('Error getting tokens by addresses:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Clear the token cache
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Refresh tokens (force fetch from API)
   * @returns Promise<TokenData[]>
   */
  async refreshTokens(): Promise<TokenData[]> {
    this.clearCache();
    return this.getTokens(false);
  }

  /**
   * Check if cache is valid
   * @returns boolean
   */
  isCacheValid(): boolean {
    if (!this.cache) return false;
    const now = Date.now();
    return now - this.cacheTimestamp < this.CACHE_DURATION;
  }

  /**
   * Get cached tokens without making API call
   * @returns TokenData[] | null
   */
  getCachedTokens(): TokenData[] | null {
    if (this.isCacheValid()) {
      return this.cache;
    }
    return null;
  }
}

// Export singleton instance
export const tokensApi = TokensApi.getInstance();
