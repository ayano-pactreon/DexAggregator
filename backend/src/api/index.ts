import 'dotenv/config';
import { app } from './server';
import v2Routes from './routes/v2Routes';
import v3Routes from './routes/v3Routes';
import aggregatorRoutes from './routes/aggregatorRoutes';

const PORT = process.env.PORT || 3000;

// Mount routes
app.use('/api/v2', v2Routes);
app.use('/api/v3', v3Routes);
app.use('/api/aggregator', aggregatorRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Polkadot EVM DEX API',
    version: '2.0.0',
    description: 'API for interacting with Uniswap V2 and V3 style DEXes on Polkadot EVM Sidechain',
    v2Endpoints: {
      health: 'GET /api/v2/health',
      pairs: 'GET /api/v2/pairs?start=0&limit=10',
      pair: 'GET /api/v2/pair/:pairAddress',
      findPair: 'POST /api/v2/pair/find',
      quote: 'POST /api/v2/quote',
      amountsOut: 'POST /api/v2/amounts-out',
      reserves: 'GET /api/v2/reserves/:pairAddress',
      token: 'GET /api/v2/token/:tokenAddress',
      tokens: 'GET /api/v2/tokens',
      tokenBySymbol: 'GET /api/v2/token-by-symbol/:symbol',
    },
    v3Endpoints: {
      health: 'GET /api/v3/health',
      findPool: 'POST /api/v3/pool/find',
      findAllPools: 'POST /api/v3/pool/find-all',
      pool: 'GET /api/v3/pool/:poolAddress',
      slot0: 'GET /api/v3/pool/:poolAddress/slot0',
      liquidity: 'GET /api/v3/pool/:poolAddress/liquidity',
      tick: 'GET /api/v3/pool/:poolAddress/tick/:tickIndex',
      quote: 'POST /api/v3/quote',
      quoteOutput: 'POST /api/v3/quote-output',
      feeTiers: 'GET /api/v3/fee-tiers',
      feeGrowth: 'GET /api/v3/pool/:poolAddress/fee-growth',
      protocolFees: 'GET /api/v3/pool/:poolAddress/protocol-fees',
      token: 'GET /api/v3/token/:tokenAddress',
      tokens: 'GET /api/v3/tokens',
    },
    aggregatorEndpoints: {
      health: 'GET /api/aggregator/health',
      quote: 'POST /api/aggregator/quote - Compare all DEXes and get best price',
      buildTx: 'POST /api/aggregator/build-tx - Build transaction for executing swap',
    },
    documentation: 'See API_DOCS.md for detailed documentation',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Start server
app.listen(PORT, () => {
  console.log('=================================');
  console.log('Polkadot EVM DEX API Server');
  console.log('=================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`V2 Health Check: http://localhost:${PORT}/api/v2/health`);
  console.log(`V3 Health Check: http://localhost:${PORT}/api/v3/health`);
  console.log('=================================\n');
});
