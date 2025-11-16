import 'dotenv/config';
import { createProvider } from '../services/provider';
import { V2Service } from '../services/v2Service';
import { DEFAULT_CHAIN } from '../config/chains';
import { UNISWAP_V2_FORK1 } from '../config/dexes';
import { formatTokenAmount } from '../utils/formatting';

/**
 * Example: Query liquidity for a specific pair
 *
 * Update PAIR_ADDRESS with an actual pair address on XRPL EVM Sidechain
 */
async function main() {
  console.log('=== Query Pair Liquidity ===\n');

  // Real pair address from XRPL EVM Sidechain (WETH/XRP pair)
  const PAIR_ADDRESS = '0xdC1c3636cBC24Ca479dD0178e814D0b173750517';

  // Create provider
  const provider = createProvider(DEFAULT_CHAIN);
  console.log(`Connected to: ${DEFAULT_CHAIN.name}\n`);

  // Create V2 service
  const v2Service = new V2Service(provider, UNISWAP_V2_FORK1);

  try {
    console.log(`Querying pair: ${PAIR_ADDRESS}\n`);

    // Get pair information
    const pairInfo = await v2Service.getPairInfo(PAIR_ADDRESS);

    console.log('=== Pair Information ===');
    console.log(`Pair Address: ${pairInfo.address}`);
    console.log(`Token 0: ${pairInfo.token0.symbol} (${pairInfo.token0.address})`);
    console.log(`Token 1: ${pairInfo.token1.symbol} (${pairInfo.token1.address})\n`);

    // Get reserves
    console.log('=== Reserves ===');
    const reserve0Formatted = formatTokenAmount(pairInfo.reserve0, pairInfo.token0.decimals);
    const reserve1Formatted = formatTokenAmount(pairInfo.reserve1, pairInfo.token1.decimals);

    console.log(`${pairInfo.token0.symbol}: ${reserve0Formatted}`);
    console.log(`${pairInfo.token1.symbol}: ${reserve1Formatted}\n`);

    // Get total liquidity (LP token supply)
    console.log('=== Liquidity Pool ===');
    const totalSupply = await v2Service.getTotalLiquidity(PAIR_ADDRESS);
    const totalSupplyFormatted = formatTokenAmount(totalSupply, 18); // LP tokens typically have 18 decimals

    console.log(`Total LP Supply: ${totalSupplyFormatted}`);
    console.log(`LP Token Supply (raw): ${totalSupply}\n`);

    // Get pair data with prices
    const pairData = await v2Service.getPairData(PAIR_ADDRESS);

    console.log('=== Prices ===');
    console.log(`${pairInfo.token0.symbol}/${pairInfo.token1.symbol}: ${pairData.price0}`);
    console.log(`${pairInfo.token1.symbol}/${pairInfo.token0.symbol}: ${pairData.price1}\n`);

    // Calculate pool TVL if you have USD prices for tokens
    // This would require additional price oracle integration
    console.log('=== Additional Info ===');
    console.log(`Last Updated: ${new Date(pairInfo.lastUpdated * 1000).toLocaleString()}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
