# Polakdot EVM DEX API Documentation

REST API for interacting with Uniswap V2 style DEXes on Polakdot EVM Sidechain.

## Base URL

```
http://localhost:3000
```

## Quick Start

```bash
# Start the API server
npm run api

# Server will start on http://localhost:3000
```

## Endpoints

### Root

#### GET /

Get API information and available endpoints.

**Response:**
```json
{
  "name": "Polakdot EVM DEX API",
  "version": "1.0.0",
  "description": "API for interacting with Uniswap V2 style DEXes on Polakdot EVM Sidechain",
  "endpoints": { ... }
}
```

---

### Health Check

#### GET /api/v2/health

Check API health and get basic stats.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "totalPairs": 4,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/v2/health
```

---

### Pairs

#### GET /api/v2/pairs

Get list of pair addresses with pagination.

**Query Parameters:**
- `start` (optional): Starting index (default: 0)
- `limit` (optional): Number of pairs to return (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "pairs": [
      "0xdC1c3636cBC24Ca479dD0178e814D0b173750517",
      "0xD5D09e9e4cdfaB144308E351A8F171B175F79357"
    ],
    "pagination": {
      "start": 0,
      "limit": 10,
      "total": 4,
      "hasMore": false
    }
  }
}
```

**cURL Example:**
```bash
curl "http://localhost:3000/api/v2/pairs?start=0&limit=5"
```

---

### Pair Details

#### GET /api/v2/pair/:pairAddress

Get detailed information about a specific pair.

**Path Parameters:**
- `pairAddress`: The address of the pair

**Response:**
```json
{
  "success": true,
  "data": {
    "pair": {
      "address": "0xdC1c3636cBC24Ca479dD0178e814D0b173750517",
      "token0": {
        "address": "0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E",
        "symbol": "WETH",
        "name": "Wrapped Ether",
        "decimals": 18
      },
      "token1": {
        "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        "symbol": "Polakdot",
        "name": "Polakdot",
        "decimals": 18
      },
      "reserve0": "2620000000000000",
      "reserve1": "4168985000000000000",
      "totalSupply": "103759000000000000",
      "lastUpdated": 1234567890
    },
    "price0": "1591.2578303706136",
    "price1": "0.0006284336710959619",
    "liquidity": {
      "token0": "0.002620",
      "token1": "4.168985"
    }
  }
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/v2/pair/0xdC1c3636cBC24Ca479dD0178e814D0b173750517
```

---

### Find Pair

#### POST /api/v2/pair/find

Find the pair address for two tokens.

**Request Body:**
```json
{
  "token0": "0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E",
  "token1": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pairAddress": "0xdC1c3636cBC24Ca479dD0178e814D0b173750517",
    "token0": "0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E",
    "token1": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v2/pair/find \
  -H "Content-Type: application/json" \
  -d '{
    "token0": "0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E",
    "token1": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
  }'
```

---

### Get Quote

#### POST /api/v2/quote

Get a swap quote for trading one token for another.

**Request Body:**
```json
{
  "tokenIn": "0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E",
  "tokenOut": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  "amountIn": "0.001",
  "slippage": 0.5
}
```

**Parameters:**
- `tokenIn`: Address of input token
- `tokenOut`: Address of output token
- `amountIn`: Amount to swap (in human-readable format, e.g., "1.5")
- `slippage` (optional): Slippage tolerance in percentage (default: 0.5)

**Response:**
```json
{
  "success": true,
  "data": {
    "tokenIn": {
      "address": "0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E",
      "symbol": "WETH",
      "amount": "0.001",
      "amountWei": "1000000000000000"
    },
    "tokenOut": {
      "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "symbol": "Polakdot",
      "amount": "1.149173",
      "amountWei": "1149173000000000000"
    },
    "pairAddress": "0xdC1c3636cBC24Ca479dD0178e814D0b173750517",
    "priceImpact": "47.5749%",
    "priceImpactRaw": 47.5749,
    "slippage": "0.5%",
    "minimumAmountOut": "1.143428",
    "minimumAmountOutWei": "1143428000000000000",
    "effectivePrice": "1149.173"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v2/quote \
  -H "Content-Type: application/json" \
  -d '{
    "tokenIn": "0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E",
    "tokenOut": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    "amountIn": "0.001",
    "slippage": 0.5
  }'
```

---

### Multi-Hop Quote

#### POST /api/v2/amounts-out

Get output amounts for a multi-hop swap (e.g., TokenA → TokenB → TokenC).

**Request Body:**
```json
{
  "amountIn": "1",
  "path": [
    "0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E",
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    "0xa16148c6Ac9EDe0D82f0c52899e22a575284f131"
  ]
}
```

**Parameters:**
- `amountIn`: Amount to swap (in human-readable format)
- `path`: Array of token addresses (minimum 2)

**Response:**
```json
{
  "success": true,
  "data": {
    "path": [...],
    "amounts": [
      {
        "token": "WETH",
        "address": "0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E",
        "amount": "1.000000",
        "amountWei": "1000000000000000000"
      },
      {
        "token": "Polakdot",
        "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        "amount": "1591.257830",
        "amountWei": "1591257830000000000000"
      },
      {
        "token": "USDC",
        "address": "0xa16148c6Ac9EDe0D82f0c52899e22a575284f131",
        "amount": "1234.567890",
        "amountWei": "1234567890"
      }
    ]
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v2/amounts-out \
  -H "Content-Type: application/json" \
  -d '{
    "amountIn": "1",
    "path": [
      "0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E",
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    ]
  }'
```

---

### Reserves

#### GET /api/v2/reserves/:pairAddress

Get current reserves for a pair.

**Path Parameters:**
- `pairAddress`: The address of the pair

**Response:**
```json
{
  "success": true,
  "data": {
    "reserve0": "2620000000000000",
    "reserve1": "4168985000000000000",
    "blockTimestampLast": 1234567890
  }
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/v2/reserves/0xdC1c3636cBC24Ca479dD0178e814D0b173750517
```

---

### Token Information

#### GET /api/v2/token/:tokenAddress

Get information about a specific token.

**Path Parameters:**
- `tokenAddress`: The address of the token

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E",
    "symbol": "WETH",
    "name": "Wrapped Ether",
    "decimals": 18
  }
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/v2/token/0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E
```

---

### All Tokens

#### GET /api/v2/tokens

Get all known tokens from the registry.

**Response:**
```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        "symbol": "Polakdot",
        "name": "Polakdot",
        "decimals": 18
      },
      ...
    ],
    "count": 7
  }
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/v2/tokens
```

---

### Token by Symbol

#### GET /api/v2/token-by-symbol/:symbol

Get token information by symbol.

**Path Parameters:**
- `symbol`: Token symbol (case-insensitive)

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E",
    "symbol": "WETH",
    "name": "Wrapped Ether",
    "decimals": 18
  }
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/v2/token-by-symbol/WETH
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad request (invalid parameters)
- `404`: Resource not found
- `500`: Internal server error

---

## JavaScript/TypeScript Client Examples

### Using fetch

```javascript
// Get quote
const response = await fetch('http://localhost:3000/api/v2/quote', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tokenIn: '0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E',
    tokenOut: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    amountIn: '0.001',
    slippage: 0.5,
  }),
});

const data = await response.json();
console.log(data.data.tokenOut.amount);
```

### Using axios

```javascript
import axios from 'axios';

const { data } = await axios.post('http://localhost:3000/api/v2/quote', {
  tokenIn: '0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E',
  tokenOut: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  amountIn: '0.001',
  slippage: 0.5,
});

console.log(data.data.tokenOut.amount);
```

---

## Python Client Example

```python
import requests

# Get quote
response = requests.post('http://localhost:3000/api/v2/quote', json={
    'tokenIn': '0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E',
    'tokenOut': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'amountIn': '0.001',
    'slippage': 0.5
})

data = response.json()
print(data['data']['tokenOut']['amount'])
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production use, consider adding rate limiting middleware.

---

## CORS

CORS is enabled for all origins. For production, configure specific allowed origins in `src/api/server.ts`.

---

## Environment Variables

Configure in `.env`:

```env
PORT=3000                  # API server port (optional)
RPC_URL=https://...        # Polakdot EVM RPC URL
FACTORY_ADDRESS=0x...      # DEX factory address
ROUTER_ADDRESS=0x...       # DEX router address
```

---

## Running the API

```bash
# Development mode
npm run api

# Production (after build)
npm run build
node dist/api/index.js
```

---

## Testing the API

Use **Postman** or any HTTP client to test the API endpoints.

### Using Postman

1. Create a new collection
2. Add requests for each endpoint from this documentation
3. Set the base URL to `http://localhost:3000`
4. Test each endpoint with the provided examples

### Example Postman Requests

**GET Health Check:**
- Method: GET
- URL: `http://localhost:3000/api/v2/health`

**POST Get Quote:**
- Method: POST
- URL: `http://localhost:3000/api/v2/quote`
- Headers: `Content-Type: application/json`
- Body (JSON):
```json
{
  "tokenIn": "0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E",
  "tokenOut": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  "amountIn": "0.001",
  "slippage": 0.5
}
```
