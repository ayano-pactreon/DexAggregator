import 'dotenv/config';
import { createProvider } from '../services/provider';
import { V2Service } from '../services/v2Service';
import { DEFAULT_CHAIN } from '../config/chains';
import { UNISWAP_V2_FORK1 } from '../config/dexes';
import { MAINNET_TOKENS, MAINNET_TOKEN_REGISTRY } from '../config/tokens';
import { parseUnits } from 'viem';
import { formatTokenAmount } from '../utils/formatting';

/**
 * Example: Using the Token Registry for easy token access
 */
async function main() {
  console.log('=== Using Token Registry Example ===\n');

  // Create provider and service
  const provider = createProvider(DEFAULT_CHAIN);
  const v2Service = new V2Service(provider, UNISWAP_V2_FORK1);

  console.log('--- Method 1: Direct Token Access ---\n');

  // Direct access to token objects
  const weth = MAINNET_TOKENS.WETH;
  const usdc = MAINNET_TOKENS.USDC;

  console.log(`Token In: ${weth.symbol}`);
  console.log(`Address: ${weth.address}`);
  console.log(`Decimals: ${weth.decimals}\n`);

  console.log('--- Method 2: Registry Lookup by Symbol ---\n');

  // Get token by symbol (case-insensitive)
  const dot = MAINNET_TOKEN_REGISTRY.getBySymbol('dot'); // lowercase works too!
  if (dot) {
    console.log(`Found: ${dot.symbol} (${dot.name})`);
    console.log(`Address: ${dot.address}\n`);
  }

  console.log('--- Method 3: Registry Lookup by Address ---\n');

  // Get token by address
  const tokenByAddr = MAINNET_TOKEN_REGISTRY.getByAddress('0x50498dC52bCd3dAeB54B7225A7d2FA8D536F313E');
  if (tokenByAddr) {
    console.log(`Found: ${tokenByAddr.symbol} at that address\n`);
  }

  console.log('--- Practical Example: Get Quotes for Multiple Pairs ---\n');

  // Get quotes for multiple token pairs
  const pairs = [
    { from: MAINNET_TOKENS.WETH, to: MAINNET_TOKENS.DOT },
    { from: MAINNET_TOKENS.WETH, to: MAINNET_TOKENS.USDC },
  ];

  for (const { from, to } of pairs) {
    try {
      console.log(`${from.symbol} → ${to.symbol}`);

      // Check if pair exists
      const pairAddress = await v2Service.getPair(from.address, to.address);
      console.log(`  Pair: ${pairAddress}`);

      // Get pair data
      const pairData = await v2Service.getPairData(pairAddress);
      console.log(`  Liquidity: ${pairData.liquidity.token0} ${pairData.pair.token0.symbol} / ${pairData.liquidity.token1} ${pairData.pair.token1.symbol}`);

      // Get a small quote
      const amountIn = parseUnits('0.001', from.decimals);
      const quote = await v2Service.getQuote(from.address, to.address, amountIn);
      const formattedQuote = formatTokenAmount(quote, to.decimals);

      console.log(`  Quote: 0.001 ${from.symbol} = ${formattedQuote} ${to.symbol}\n`);
    } catch (error: any) {
      console.log(`  ❌ No pair exists or error: ${error.message}\n`);
    }
  }

  console.log('--- Common Base Tokens (for routing) ---\n');

  // Get common base tokens useful for multi-hop swaps
  const bases = MAINNET_TOKEN_REGISTRY.getCommonBases();
  console.log('These tokens are commonly used as intermediaries for swaps:');
  bases.forEach((token) => {
    console.log(`  • ${token.symbol.padEnd(6)} ${token.name}`);
  });
  console.log();

  console.log('--- All Available Tokens ---\n');

  const allTokens = MAINNET_TOKEN_REGISTRY.getAllTokens();
  console.log(`Total tokens: ${allTokens.length}`);
  console.log('Symbols:', MAINNET_TOKEN_REGISTRY.getSymbols().join(', '));
  console.log();

  console.log('--- Token Validation ---\n');

  // Check if tokens exist
  console.log(`Has WETH: ${MAINNET_TOKEN_REGISTRY.hasSymbol('WETH')}`);
  console.log(`Has MATIC: ${MAINNET_TOKEN_REGISTRY.hasSymbol('MATIC')}`);
  console.log(`Has USDC address: ${MAINNET_TOKEN_REGISTRY.hasAddress(MAINNET_TOKENS.USDC.address)}`);
  console.log();

  console.log('=== Example Complete ✓ ===');
}

main().catch(console.error);
