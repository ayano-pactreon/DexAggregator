// Base API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

// Token related types
export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface TokensData {
  tokens: TokenData[];
  count: number;
}

export type TokensResponse = ApiResponse<TokensData>;

// Price related types (for future use)
export interface TokenPriceData {
  symbol: string;
  price: string;
  priceUsd: string;
  lastUpdated: string;
}

export interface TokenPricesData {
  prices: TokenPriceData[];
}

export type TokenPricesResponse = ApiResponse<TokenPricesData>;

// Quote related types
export interface QuoteTokenInfo {
  address: string;
  symbol: string;
  amount: string;
  amountWei: string;
}

export interface SwapTransaction {
  to: string;
  data: string;
  value: string;
  from: string;
}

export interface ApprovalInfo {
  needed: boolean;
  message: string;
}

export interface BestRoute {
  dex: string;
  dexName: string;
  feeTier?: number;
  poolAddress: string;
  priceImpact: string;
  amountOut: string;
  amountOutWei: string;
  gasEstimate?: string;
  transaction?: SwapTransaction;
  approval?: ApprovalInfo;
}

export interface QuoteDetail {
  dex: string;
  dexName: string;
  amountOut: string;
  amountOutWei: string;
  priceImpact: string;
  poolAddress: string;
  feeTier?: number;
  gasEstimate?: string;
  transaction?: SwapTransaction;
  approval?: ApprovalInfo;
}

export interface QuoteSavings {
  percentage: string;
  amount: string;
  amountWei: string;
}

export interface QuoteData {
  tokenIn: QuoteTokenInfo;
  tokenOut: QuoteTokenInfo;
  bestRoute: BestRoute;
  allQuotes: QuoteDetail[];
  savings: QuoteSavings;
  slippage: string;
  minimumAmountOut: string;
  minimumAmountOutWei: string;
  recommendation: string;
}

export type QuoteResponse = ApiResponse<QuoteData>;

// Quote request body
export interface QuoteRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippage: number;
}

// Transaction related types (for future use)
export interface TransactionData {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  fromAddress: string;
  toAddress: string;
  value: string;
  gasUsed?: string;
  blockNumber?: number;
  timestamp?: number;
}

export type TransactionResponse = ApiResponse<TransactionData>;
