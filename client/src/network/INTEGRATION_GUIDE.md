# Network Integration Guide

## Quick Start: Integrating Token API with SwapViewModel

### Step 1: Import the necessary modules

```typescript
import { tokenService, ApiToken } from '@/services/tokenService';
// or directly from network
import { tokensApi, TokenData } from '@/network';
```

### Step 2: Add state for tokens in your component/hook

```typescript
const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
const [tokensLoading, setTokensLoading] = useState(false);
const [tokensError, setTokensError] = useState<string | null>(null);
```

### Step 3: Fetch tokens on component mount

```typescript
useEffect(() => {
  const loadTokens = async () => {
    setTokensLoading(true);
    setTokensError(null);

    try {
      const apiTokens = await tokenService.fetchTokens();

      // Convert API tokens to your Token format
      const tokens = apiTokens.map(convertApiTokenToToken);
      setAvailableTokens(tokens);
    } catch (error) {
      console.error('Failed to load tokens:', error);
      setTokensError(error instanceof Error ? error.message : 'Failed to load tokens');
    } finally {
      setTokensLoading(false);
    }
  };

  loadTokens();
}, []);
```

### Step 4: Create a helper function to convert API tokens

```typescript
function convertApiTokenToToken(apiToken: ApiToken): Token {
  const tokenImages: Record<string, string> = {
    'XRP': 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png',
    'WBTC': 'https://s2.coinmarketcap.com/static/img/coins/64x64/3717.png',
    'USDC': 'https://raw.githubusercontent.com/TalismanSociety/chaindata/main/assets/tokens/usdc.svg',
    'WETH': 'https://raw.githubusercontent.com/TalismanSociety/chaindata/main/assets/tokens/eth.svg',
    'USDT': 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
    'DAI': 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png',
    'FDUSD': 'https://s2.coinmarketcap.com/static/img/coins/64x64/26081.png',
  };

  return {
    address: apiToken.address,
    symbol: apiToken.symbol,
    name: apiToken.name,
    decimals: apiToken.decimals,
    network: 'XRPL EVM Sidechain',
    balance: '-',
    tokenPrice: '0.00',
    image: tokenImages[apiToken.symbol],
  };
}
```

### Step 5: Add refresh functionality

```typescript
const refreshTokens = async () => {
  setTokensLoading(true);
  setTokensError(null);

  try {
    const apiTokens = await tokenService.refreshTokens();
    const tokens = apiTokens.map(convertApiTokenToToken);
    setAvailableTokens(tokens);
  } catch (error) {
    setTokensError(error instanceof Error ? error.message : 'Failed to refresh tokens');
  } finally {
    setTokensLoading(false);
  }
};
```

## Complete Example: SwapViewModel Integration

```typescript
import { useEffect, useState } from "react";
import { tokenService, ApiToken } from "@/services/tokenService";

export function useSwapViewModel(): SwapViewModel {
  // Existing state...
  const [fromToken, setFromToken] = useState<string | null>(null);
  const [toToken, setToToken] = useState<string | null>(null);

  // New token state
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokensError, setTokensError] = useState<string | null>(null);

  // Load tokens on mount
  useEffect(() => {
    const loadTokens = async () => {
      setTokensLoading(true);
      setTokensError(null);

      try {
        const apiTokens = await tokenService.fetchTokens();
        const tokens = apiTokens.map(convertApiTokenToToken);
        setAvailableTokens(tokens);
      } catch (error) {
        console.error('Failed to load tokens:', error);
        setTokensError(error instanceof Error ? error.message : 'Failed to load tokens');
        // Optionally set fallback tokens
        setAvailableTokens([]);
      } finally {
        setTokensLoading(false);
      }
    };

    loadTokens();
  }, []);

  const refreshTokens = async () => {
    setTokensLoading(true);
    setTokensError(null);

    try {
      const apiTokens = await tokenService.refreshTokens();
      const tokens = apiTokens.map(convertApiTokenToToken);
      setAvailableTokens(tokens);
    } catch (error) {
      setTokensError(error instanceof Error ? error.message : 'Failed to refresh tokens');
    } finally {
      setTokensLoading(false);
    }
  };

  return {
    // ... existing returns
    availableTokens,
    tokensLoading,
    tokensError,
    refreshTokens,
  };
}
```

## Displaying Loading States in UI

```typescript
// In your component
const viewModel = useSwapViewModel();

if (viewModel.tokensLoading) {
  return <div>Loading tokens...</div>;
}

if (viewModel.tokensError) {
  return (
    <div>
      Error: {viewModel.tokensError}
      <button onClick={viewModel.refreshTokens}>Retry</button>
    </div>
  );
}

// Render tokens
return (
  <div>
    {viewModel.availableTokens.map(token => (
      <TokenItem key={token.address} token={token} />
    ))}
  </div>
);
```

## Advanced: Using Token Cache

```typescript
// Check if cache is valid before fetching
useEffect(() => {
  const loadTokens = async () => {
    // Try to get cached tokens first
    const cachedTokens = tokenService.getCachedTokens();

    if (cachedTokens) {
      // Use cached tokens immediately
      const tokens = cachedTokens.map(convertApiTokenToToken);
      setAvailableTokens(tokens);
      return;
    }

    // Fetch if no cache
    setTokensLoading(true);
    try {
      const apiTokens = await tokenService.fetchTokens();
      const tokens = apiTokens.map(convertApiTokenToToken);
      setAvailableTokens(tokens);
    } catch (error) {
      setTokensError(error instanceof Error ? error.message : 'Failed to load tokens');
    } finally {
      setTokensLoading(false);
    }
  };

  loadTokens();
}, []);
```

## Error Handling Best Practices

```typescript
import { ApiError, NetworkError, handleApiError } from '@/network';

try {
  const tokens = await tokenService.fetchTokens();
  setAvailableTokens(tokens.map(convertApiTokenToToken));
} catch (error) {
  if (error instanceof ApiError) {
    // API returned an error
    if (error.statusCode === 404) {
      setTokensError('Tokens endpoint not found');
    } else if (error.statusCode && error.statusCode >= 500) {
      setTokensError('Server error. Please try again later.');
    } else {
      setTokensError(error.message);
    }
  } else if (error instanceof NetworkError) {
    // Network/timeout error
    setTokensError('Network error. Please check your connection.');
  } else {
    // Unknown error
    const apiError = handleApiError(error);
    setTokensError(apiError.message);
  }
}
```

## Testing the API

You can test the token API using curl:

```bash
curl http://localhost:3000/api/v2/tokens
```

Expected response:
```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        "symbol": "XRP",
        "name": "XRP",
        "decimals": 18
      }
    ],
    "count": 7
  }
}
```
