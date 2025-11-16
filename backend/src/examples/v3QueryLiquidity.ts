import 'dotenv/config';
import { createProvider } from '../services/provider';
import { V3Service } from '../services/v3Service';
import { DEFAULT_CHAIN } from '../config/chains';
import { UNISWAP_V3_FORK1 } from '../config/dexes';
import { MAINNET_TOKEN_REGISTRY } from '../config/tokens';
import { V3FeeTier } from '../types/v3';

/**
 * Example: Query V3 pool liquidity
 */
async function main() {
  console.log('=================================');
  console.log('Uniswap V3 Liquidity Query Example');
  console.log('=================================\n');

  // Initialize provider and service
  const provider = createProvider(DEFAULT_CHAIN);
  const v3Service = new V3Service(provider, UNISWAP_V3_FORK1);

  try {
    // Example: Query liquidity for WETH/USDC pools
    const weth = MAINNET_TOKEN_REGISTRY.getBySymbol('WETH');
    const usdc = MAINNET_TOKEN_REGISTRY.getBySymbol('USDC');

    if (!weth || !usdc) {
      throw new Error('Tokens not found in registry');
    }

    console.log(`Querying liquidity for ${weth.symbol}/${usdc.symbol} pools...\n`);

    // Find all pools for this pair
    const pools = await v3Service.findPoolsForPair(weth.address, usdc.address);
    console.log(`Found ${pools.length} pools for ${weth.symbol}/${usdc.symbol}\n`);

    if (pools.length === 0) {
      console.log('No pools found for this pair.');
      return;
    }

    // Get detailed info for each pool
    for (const poolAddress of pools) {
      console.log('-----------------------------------');
      console.log(`Pool: ${poolAddress}\n`);

      const poolData = await v3Service.getPoolData(poolAddress);
      const slot0 = await v3Service.getSlot0(poolAddress);
      const feeGrowth = await v3Service.getFeeGrowthGlobal(poolAddress);

      console.log(`Token0: ${poolData.pool.token0.symbol} (${poolData.pool.token0.address})`);
      console.log(`Token1: ${poolData.pool.token1.symbol} (${poolData.pool.token1.address})`);
      console.log(`Fee Tier: ${poolData.pool.fee / 10000}% (${poolData.pool.fee})`);
      console.log(`\nCurrent State:`);
      console.log(`  Liquidity: ${poolData.pool.liquidity.toString()}`);
      console.log(`  Current Tick: ${slot0.tick}`);
      console.log(`  Tick Spacing: ${poolData.tickSpacing}`);
      console.log(`  SqrtPriceX96: ${slot0.sqrtPriceX96.toString()}`);
      console.log(`\nPrices:`);
      console.log(`  ${poolData.pool.token0.symbol} price: ${parseFloat(poolData.price0).toFixed(6)} ${poolData.pool.token1.symbol}`);
      console.log(`  ${poolData.pool.token1.symbol} price: ${parseFloat(poolData.price1).toFixed(6)} ${poolData.pool.token0.symbol}`);
      console.log(`\nObservations:`);
      console.log(`  Observation Index: ${slot0.observationIndex}`);
      console.log(`  Observation Cardinality: ${slot0.observationCardinality}`);
      console.log(`  Observation Cardinality Next: ${slot0.observationCardinalityNext}`);
      console.log(`\nFee Growth:`);
      console.log(`  Fee Growth Global 0 X128: ${feeGrowth.feeGrowthGlobal0X128.toString()}`);
      console.log(`  Fee Growth Global 1 X128: ${feeGrowth.feeGrowthGlobal1X128.toString()}`);
      console.log(`\nPool State:`);
      console.log(`  Fee Protocol: ${slot0.feeProtocol}`);
      console.log(`  Unlocked: ${slot0.unlocked}`);
      console.log('');
    }

    console.log('=================================');
    console.log('Example completed successfully!');
    console.log('=================================\n');
  } catch (error: any) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

main();
