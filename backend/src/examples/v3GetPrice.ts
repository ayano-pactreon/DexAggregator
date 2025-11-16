import 'dotenv/config';
import { createProvider } from '../services/provider';
import { V3Service } from '../services/v3Service';
import { DEFAULT_CHAIN } from '../config/chains';
import { UNISWAP_V3_FORK1 } from '../config/dexes';
import { MAINNET_TOKEN_REGISTRY } from '../config/tokens';
import { parseUnits } from 'viem';
import { formatTokenAmount } from '../utils/formatting';
import { V3FeeTier } from '../types/v3';

/**
 * Example: Get V3 swap price quote
 */
async function main() {
  console.log('=================================');
  console.log('Uniswap V3 Price Quote Example');
  console.log('=================================\n');

  // Initialize provider and service
  const provider = createProvider(DEFAULT_CHAIN);
  const v3Service = new V3Service(provider, UNISWAP_V3_FORK1);

  try {
    // Example: Get price for swapping WETH to USDC
    const weth = MAINNET_TOKEN_REGISTRY.getBySymbol('WETH');
    const usdc = MAINNET_TOKEN_REGISTRY.getBySymbol('USDC');

    if (!weth || !usdc) {
      throw new Error('Tokens not found in registry');
    }

    console.log(`Getting quote for swapping ${weth.symbol} to ${usdc.symbol}...\n`);

    // Amount to swap: 1 WETH
    const amountIn = parseUnits('1', weth.decimals);

    // Try different fee tiers
    const feeTiers = [
      { fee: V3FeeTier.LOW, name: '0.05%' },
      { fee: V3FeeTier.MEDIUM, name: '0.3%' },
      { fee: V3FeeTier.HIGH, name: '1%' },
    ];

    for (const { fee, name } of feeTiers) {
      try {
        console.log(`\n--- Fee Tier: ${name} (${fee}) ---`);

        // Find pool
        const poolAddress = await v3Service.getPool(weth.address, usdc.address, fee);
        console.log(`Pool Address: ${poolAddress}`);

        // Get pool data
        const poolData = await v3Service.getPoolData(poolAddress);
        console.log(`Current Price: 1 ${weth.symbol} = ${parseFloat(poolData.price0).toFixed(2)} ${usdc.symbol}`);
        console.log(`Liquidity: ${poolData.pool.liquidity.toString()}`);
        console.log(`Current Tick: ${poolData.pool.tick}`);

        // Get quote
        const quoteResult = await v3Service.quoteExactInputSingle({
          tokenIn: weth.address,
          tokenOut: usdc.address,
          fee,
          amountIn,
        });

        const amountOut = formatTokenAmount(quoteResult.amountOut, usdc.decimals);
        const effectivePrice = parseFloat(amountOut);

        console.log(`\nQuote for swapping 1 ${weth.symbol}:`);
        console.log(`  Amount Out: ${amountOut} ${usdc.symbol}`);
        console.log(`  Effective Price: ${effectivePrice.toFixed(2)} ${usdc.symbol} per ${weth.symbol}`);
        console.log(`  Ticks Crossed: ${quoteResult.initializedTicksCrossed}`);
        console.log(`  Gas Estimate: ${quoteResult.gasEstimate.toString()}`);

        // Calculate slippage protection
        const slippage = 0.5; // 0.5%
        const minAmountOut = (quoteResult.amountOut * BigInt(10000 - slippage * 100)) / 10000n;
        console.log(`  Min Amount Out (0.5% slippage): ${formatTokenAmount(minAmountOut, usdc.decimals)} ${usdc.symbol}`);
      } catch (error: any) {
        console.log(`  Pool not available for this fee tier`);
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
