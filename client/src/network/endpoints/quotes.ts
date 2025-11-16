import { apiClient } from '../clients';
import { QuoteResponse, QuoteRequest, QuoteData, handleApiError } from '../types';

export class QuotesApi {
  private static instance: QuotesApi;

  private constructor() {}

  static getInstance(): QuotesApi {
    if (!QuotesApi.instance) {
      QuotesApi.instance = new QuotesApi();
    }
    return QuotesApi.instance;
  }

  /**
   * Get swap quote from aggregator
   * @param request - Quote request parameters
   * @returns Promise<QuoteData>
   */
  async getQuote(request: QuoteRequest): Promise<QuoteData> {
    try {
      const response = await apiClient.post<QuoteResponse>(
        '/api/aggregator/quote',
        request,
        {
          retries: 1,
          timeout: 10000, // 10 seconds for quote requests
        }
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Invalid quote response');
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Get quote with automatic token address lookup by symbol
   * @param tokenInSymbol - Symbol of token to swap from
   * @param tokenOutSymbol - Symbol of token to swap to
   * @param amountIn - Amount to swap (in token units)
   * @param slippage - Slippage tolerance (0.5 = 0.5%)
   * @returns Promise<QuoteData>
   */
  async getQuoteBySymbol(
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: string,
    slippage: number = 0.5
  ): Promise<QuoteData> {
    return this.getQuote({
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      amountIn,
      slippage,
    });
  }

  /**
   * Validate quote request parameters
   * @param request - Quote request to validate
   * @returns boolean
   */
  validateQuoteRequest(request: QuoteRequest): boolean {
    if (!request.tokenIn || !request.tokenOut) {
      console.error('Token addresses are required');
      return false;
    }

    if (!request.amountIn || parseFloat(request.amountIn) <= 0) {
      console.error('Amount must be greater than 0');
      return false;
    }

    if (request.slippage < 0 || request.slippage > 100) {
      console.error('Slippage must be between 0 and 100');
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const quotesApi = QuotesApi.getInstance();
