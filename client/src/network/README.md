# Network Module

This folder contains all API client logic, response types, and endpoint implementations for the application.

## Structure

```
network/
├── types/              # TypeScript types and interfaces
│   ├── responses.ts    # API response types
│   ├── errors.ts       # Error classes and handlers
│   └── index.ts        # Type exports
├── clients/            # API client implementations
│   ├── apiClient.ts    # Base HTTP client with retry logic
│   └── index.ts        # Client exports
├── endpoints/          # API endpoint implementations
│   ├── tokens.ts       # Token-related endpoints
│   └── index.ts        # Endpoint exports
└── index.ts           # Main module entry point
```

## Usage

### Fetching Tokens

```typescript
import { tokensApi } from '@/network';

// Get all tokens (uses cache by default)
const tokens = await tokensApi.getTokens();

// Force refresh from API
const freshTokens = await tokensApi.getTokens(false);

// Get specific token by address
const token = await tokensApi.getTokenByAddress('0x...');

// Get specific token by symbol
const usdc = await tokensApi.getTokenBySymbol('USDC');

// Clear cache
tokensApi.clearCache();
```

### Using the API Client Directly

```typescript
import { apiClient } from '@/network';

// GET request
const data = await apiClient.get('/api/v2/tokens');

// POST request
const response = await apiClient.post('/api/v2/swap', {
  fromToken: '0x...',
  toToken: '0x...',
  amount: '100'
});

// With custom configuration
const data = await apiClient.get('/api/v2/tokens', {
  timeout: 5000,
  retries: 3,
  headers: { 'Custom-Header': 'value' }
});
```

### Error Handling

```typescript
import { tokensApi, ApiError, NetworkError, handleApiError } from '@/network';

try {
  const tokens = await tokensApi.getTokens();
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message, error.statusCode);
  } else if (error instanceof NetworkError) {
    console.error('Network Error:', error.message);
  } else {
    const apiError = handleApiError(error);
    console.error('Unknown Error:', apiError.message);
  }
}
```

## Features

### API Client Features

- ✅ Automatic retry logic with exponential backoff
- ✅ Request timeout handling
- ✅ Customizable headers
- ✅ Type-safe responses
- ✅ Error handling with custom error classes
- ✅ Singleton pattern for consistent configuration

### Tokens API Features

- ✅ Built-in caching (5-minute default)
- ✅ Cache invalidation
- ✅ Fallback to stale cache on error
- ✅ Multiple query methods (by address, symbol, addresses)
- ✅ Cache validation checks

## Configuration

Set the API base URL in your `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

If not set, it defaults to `http://localhost:3000`.

## Adding New Endpoints

1. Create a new file in `endpoints/` (e.g., `prices.ts`)
2. Define response types in `types/responses.ts`
3. Implement the endpoint class using `apiClient`
4. Export from `endpoints/index.ts`

Example:

```typescript
// types/responses.ts
export interface PriceData {
  symbol: string;
  price: string;
}
export type PricesResponse = ApiResponse<PriceData[]>;

// endpoints/prices.ts
import { apiClient } from '../clients';
import { PricesResponse } from '../types';

export class PricesApi {
  async getPrices(): Promise<PriceData[]> {
    const response = await apiClient.get<PricesResponse>('/api/v2/prices');
    return response.data;
  }
}

export const pricesApi = new PricesApi();

// endpoints/index.ts
export * from './prices';
```

## API Response Format

All API responses should follow this format:

```typescript
{
  success: boolean;
  data: T;           // Your actual data
  error?: string;    // Error message if success is false
  message?: string;  // Optional additional message
}
```

## Cache Management

The tokens API includes built-in caching:

- **Cache Duration**: 5 minutes by default
- **Stale Cache**: Returns stale cache if API fails
- **Manual Control**: Clear or refresh cache as needed

```typescript
// Check if cache is valid
if (tokensApi.isCacheValid()) {
  const cachedTokens = tokensApi.getCachedTokens();
}

// Force refresh
await tokensApi.refreshTokens();

// Clear cache
tokensApi.clearCache();
```
