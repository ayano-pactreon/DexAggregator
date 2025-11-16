import 'dotenv/config';
import { createProvider } from '../services/provider';
import { V3Service } from '../services/v3Service';
import { DEFAULT_CHAIN } from '../config/chains';
import { UNISWAP_V3_FORK1 } from '../config/dexes';
import { MAINNET_TOKEN_REGISTRY } from '../config/tokens';

/**
 * Example: Find V3 pools for token pairs
 */
async function main() {
  console.log('=================================');
  console.log('Uniswap V3 Pool Finder Example');
  console.log('=================================\n');

  // Initialize provider and service
  const provider = createProvider(DEFAULT_CHAIN);
  const v3Service = new V3Service(provider, UNISWAP_V3_FORK1);

  try {
    // Get some tokens from registry
    const tokens = MAINNET_TOKEN_REGISTRY.getAllTokens();
    console.log(`Total tokens in registry: ${tokens.length}\n`);

    // Example pairs to search for
    const pairs = [
      { token0: 'WETH', token1: 'USDC' },
      { token0: 'WETH', token1: 'USDT' },
      { token0: 'WETH', token1: 'DAI' },
      { token0: 'USDC', token1: 'USDT' },
    ];

    for (const pair of pairs) {
      const token0 = MAINNET_TOKEN_REGISTRY.getBySymbol(pair.token0);
      const token1 = MAINNET_TOKEN_REGISTRY.getBySymbol(pair.token1);

      if (!token0 || !token1) {
        console.log(`⚠️  ${pair.token0}/${pair.token1}: Tokens not found in registry\n`);
        continue;
      }

      console.log(`Searching for ${pair.token0}/${pair.token1} pools...`);

      try {
        const pools = await v3Service.findPoolsForPair(token0.address, token1.address);

        if (pools.length === 0) {
          console.log(`  ❌ No pools found\n`);
          continue;
        }

        console.log(`  ✅ Found ${pools.length} pool(s):`);

        for (const poolAddress of pools) {
          const poolInfo = await v3Service.getPoolInfo(poolAddress);
          const feeTierPercent = poolInfo.fee / 10000;

          console.log(`    - Pool: ${poolAddress}`);
          console.log(`      Fee Tier: ${feeTierPercent}% (${poolInfo.fee})`);
          console.log(`      Liquidity: ${poolInfo.liquidity.toString()}`);
          console.log(`      Current Tick: ${poolInfo.tick}`);
        }
        console.log('');
      } catch (error: any) {
        console.log(`  ❌ Error: ${error.message}\n`);
      }
    }

    // Example: Search for a specific fee tier
    console.log('-----------------------------------');
    console.log('Searching for specific fee tier...\n');

    const weth = MAINNET_TOKEN_REGISTRY.getBySymbol('WETH');
    const usdc = MAINNET_TOKEN_REGISTRY.getBySymbol('USDC');

    if (weth && usdc) {
      const feeTier = 3000; // 0.3%

      try {
        const poolAddress = await v3Service.getPool(weth.address, usdc.address, feeTier);
        console.log(`WETH/USDC 0.3% Pool:`);
        console.log(`  Address: ${poolAddress}`);

        const poolData = await v3Service.getPoolData(poolAddress);
        console.log(`  Liquidity: ${poolData.pool.liquidity.toString()}`);
        console.log(`  Price (${weth.symbol}/${usdc.symbol}): ${parseFloat(poolData.price0).toFixed(2)}`);
        console.log(`  Tick: ${poolData.pool.tick}`);
        console.log(`  Tick Spacing: ${poolData.tickSpacing}`);
      } catch (error: any) {
        console.log(`  Pool not found for this fee tier`);
      }
    }

    console.log('\n=================================');
    console.log('Example completed successfully!');
    console.log('=================================\n');
  } catch (error: any) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

main();
