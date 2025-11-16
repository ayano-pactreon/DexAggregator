import 'dotenv/config';
import { createProvider } from '../services/provider';
import { V2Service } from '../services/v2Service';
import { DEFAULT_CHAIN } from '../config/chains';
import { UNISWAP_V2_FORK1 } from '../config/dexes';

/**
 * Example: Fetch all pairs from the DEX
 */
async function main() {
  console.log('=== Fetching V2 Pairs ===\n');

  // Create provider
  const provider = createProvider(DEFAULT_CHAIN);
  console.log(`Connected to: ${DEFAULT_CHAIN.name}`);
  console.log(`Chain ID: ${DEFAULT_CHAIN.chainId}\n`);

  // Create V2 service
  const v2Service = new V2Service(provider, UNISWAP_V2_FORK1);
  console.log(`DEX: ${UNISWAP_V2_FORK1.name}`);
  console.log(`Factory: ${UNISWAP_V2_FORK1.factoryAddress}\n`);

  try {
    // Get total number of pairs
    const totalPairs = await v2Service.getAllPairsLength();
    console.log(`Total pairs: ${totalPairs}\n`);

    if (totalPairs === 0) {
      console.log('No pairs found in the factory.');
      return;
    }

    // Fetch first 5 pairs (or all if less than 5)
    const limit = Math.min(5, totalPairs);
    console.log(`Fetching first ${limit} pairs...\n`);

    const pairAddresses = await v2Service.getAllPairs(0, limit);

    // Get details for each pair
    for (let i = 0; i < pairAddresses.length; i++) {
      const pairAddress = pairAddresses[i];
      console.log(`--- Pair ${i + 1} ---`);
      console.log(`Address: ${pairAddress}`);

      try {
        const pairData = await v2Service.getPairData(pairAddress);

        console.log(`Token 0: ${pairData.pair.token0.symbol} (${pairData.pair.token0.address})`);
        console.log(`Token 1: ${pairData.pair.token1.symbol} (${pairData.pair.token1.address})`);
        console.log(`Reserve 0: ${pairData.liquidity.token0} ${pairData.pair.token0.symbol}`);
        console.log(`Reserve 1: ${pairData.liquidity.token1} ${pairData.pair.token1.symbol}`);
        console.log(`Price (${pairData.pair.token0.symbol}/${pairData.pair.token1.symbol}): ${pairData.price0}`);
        console.log(`Price (${pairData.pair.token1.symbol}/${pairData.pair.token0.symbol}): ${pairData.price1}`);
        console.log(`Total Supply: ${pairData.pair.totalSupply}\n`);
      } catch (error) {
        console.error(`Error fetching pair data: ${error}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
