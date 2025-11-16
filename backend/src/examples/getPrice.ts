import 'dotenv/config';
import { createProvider } from '../services/provider';
import { V2Service } from '../services/v2Service';
import { DEFAULT_CHAIN } from '../config/chains';
import { UNISWAP_V2_FORK1 } from '../config/dexes';
import { MAINNET_TOKENS } from '../config/tokens';
import { parseUnits } from 'viem';
import { formatTokenAmount } from '../utils/formatting';
import { calculatePriceImpact } from '../utils/calculations';

/**
 * Example: Get price quote for a token swap
 *
 * Now using the token registry for clean, typed access to tokens
 */
async function main() {
  console.log('=== Get Token Price Quote ===\n');

  // Use token registry for type-safe token access
  const TOKEN_IN = MAINNET_TOKENS.WETH.address;
  const TOKEN_OUT = MAINNET_TOKENS.DOT.address;
  const AMOUNT_IN = '0.001'; // Amount to swap (in human-readable format)

  // Create provider
  const provider = createProvider(DEFAULT_CHAIN);
  console.log(`Connected to: ${DEFAULT_CHAIN.name}\n`);

  // Create V2 service
  const v2Service = new V2Service(provider, UNISWAP_V2_FORK1);

  try {
    console.log('Getting token information...\n');

    // Get token info
    const [tokenInInfo, tokenOutInfo] = await Promise.all([
      v2Service.getTokenInfo(TOKEN_IN),
      v2Service.getTokenInfo(TOKEN_OUT),
    ]);

    console.log(`Token In: ${tokenInInfo.symbol} (${tokenInInfo.address})`);
    console.log(`Token Out: ${tokenOutInfo.symbol} (${tokenOutInfo.address})\n`);

    // Parse amount
    const amountIn = parseUnits(AMOUNT_IN, tokenInInfo.decimals);
    console.log(`Amount In: ${AMOUNT_IN} ${tokenInInfo.symbol}\n`);

    // Get pair address
    console.log('Finding pair...');
    const pairAddress = await v2Service.getPair(TOKEN_IN, TOKEN_OUT);
    console.log(`Pair Address: ${pairAddress}\n`);

    // Get pair data
    console.log('Fetching pair data...');
    const pairData = await v2Service.getPairData(pairAddress);

    console.log(`Current Price: ${pairData.price0} ${tokenOutInfo.symbol}/${tokenInInfo.symbol}\n`);

    // Get quote
    console.log('Getting quote...');
    const amountOut = await v2Service.getQuote(TOKEN_IN, TOKEN_OUT, amountIn);
    const amountOutFormatted = formatTokenAmount(amountOut, tokenOutInfo.decimals);

    console.log('--- Quote Result ---');
    console.log(`Input: ${AMOUNT_IN} ${tokenInInfo.symbol}`);
    console.log(`Output: ${amountOutFormatted} ${tokenOutInfo.symbol}\n`);

    // Calculate price impact
    const isToken0 = TOKEN_IN.toLowerCase() === pairData.pair.token0.address.toLowerCase();
    const [reserveIn, reserveOut] = isToken0
      ? [pairData.pair.reserve0, pairData.pair.reserve1]
      : [pairData.pair.reserve1, pairData.pair.reserve0];

    const priceImpact = calculatePriceImpact(
      amountIn,
      reserveIn,
      reserveOut,
      tokenInInfo.decimals,
      tokenOutInfo.decimals
    );

    console.log(`Price Impact: ${priceImpact.toFixed(4)}%`);

    // Calculate effective price
    const effectivePrice = Number(amountOut) / Number(amountIn);
    console.log(`Effective Price: ${effectivePrice.toFixed(6)} ${tokenOutInfo.symbol}/${tokenInInfo.symbol}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
