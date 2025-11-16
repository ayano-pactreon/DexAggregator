import { Router, Request, Response } from 'express';
import { provider } from '../server';
import { AggregatorService } from '../../services/aggregatorService';
import { parseUnits, Address, encodeFunctionData } from 'viem';
import { formatTokenAmount } from '../../utils/formatting';
import { MAINNET_TOKEN_REGISTRY, NATIVE_TOKEN_ADDRESS, isNativeToken } from '../../config/tokens';
import { V3_ROUTER_ABI } from '../../contracts/abis/v3Router';
import { V2_ROUTER_ABI } from '../../contracts/abis/v2Router';

const router = Router();

// Initialize aggregator service (now handles multiple DEXes automatically)
const aggregatorService = new AggregatorService(provider);

/**
 * POST /api/aggregator/quote
 * Get best quote by comparing all DEXes
 * Body: { tokenIn: string, tokenOut: string, amountIn: string, slippage?: number, userAddress?: string }
 */
router.post('/quote', async (req: Request, res: Response) => {
  try {
    const { tokenIn, tokenOut, amountIn, slippage = 0.5, userAddress } = req.body;

    if (!tokenIn || !tokenOut || !amountIn) {
      return res.status(400).json({
        success: false,
        error: 'tokenIn, tokenOut, and amountIn are required',
      });
    }

    // Validate slippage (must be between 0 and 100)
    if (slippage < 0 || slippage > 100) {
      return res.status(400).json({
        success: false,
        error: 'slippage must be between 0 and 100',
      });
    }

    // Get token decimals from registry or fetch from chain
    let tokenInDecimals = 18; // default
    const knownTokenIn = MAINNET_TOKEN_REGISTRY.getByAddress(tokenIn);

    if (knownTokenIn) {
      tokenInDecimals = knownTokenIn.decimals;
    } else {
      // Fallback: fetch decimals from chain for unknown tokens
      try {
        const tokenInfo = await aggregatorService.getTokenInfo(tokenIn as Address);
        tokenInDecimals = tokenInfo.decimals;
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: `Unable to fetch token decimals for tokenIn: ${tokenIn}`,
        });
      }
    }

    // Parse amount with correct decimals
    const amountInParsed = parseUnits(amountIn, tokenInDecimals);

    const quote = await aggregatorService.getAggregatedQuote(
      tokenIn as Address,
      tokenOut as Address,
      amountInParsed
    );

    // Calculate minimum amount out with slippage
    const slippageBps = BigInt(Math.floor(slippage * 100));
    const minimumAmountOut = (quote.bestQuote.amountOut * (10000n - slippageBps)) / 10000n;

    // Generate swap transaction data
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 minutes from now
    const isNative = isNativeToken(tokenIn as Address);

    let swapCalldata: `0x${string}`;
    let routerAddress: Address;
    let valueToSend = '0';

    if (quote.bestQuote.dex === 'V3') {
      // V3 Swap
      routerAddress = process.env.V3_SWAP_ROUTER_ADDRESS as Address;

      swapCalldata = encodeFunctionData({
        abi: V3_ROUTER_ABI,
        functionName: 'exactInputSingle',
        args: [{
          tokenIn: tokenIn as Address,
          tokenOut: tokenOut as Address,
          fee: quote.bestQuote.feeTier!,
          recipient: '0x0000000000000000000000000000000000000000' as Address, // Placeholder - frontend will replace with user address
          deadline,
          amountIn: amountInParsed,
          amountOutMinimum: minimumAmountOut,
          sqrtPriceLimitX96: 0n,
        }],
      });

      // If swapping native DOT, send value with transaction
      if (isNative) {
        valueToSend = amountInParsed.toString();
      }
    } else {
      // V2 Swap
      routerAddress = process.env.ROUTER_ADDRESS as Address;

      // V2 router path: [tokenIn, tokenOut]
      const path = [tokenIn as Address, tokenOut as Address];

      if (isNative) {
        // Use swapExactETHForTokens for native token
        swapCalldata = encodeFunctionData({
          abi: V2_ROUTER_ABI,
          functionName: 'swapExactETHForTokens',
          args: [
            minimumAmountOut,
            path,
            '0x0000000000000000000000000000000000000000' as Address, // Placeholder
            deadline,
          ],
        });
        valueToSend = amountInParsed.toString();
      } else if (isNativeToken(tokenOut as Address)) {
        // Use swapExactTokensForETH when output is native
        swapCalldata = encodeFunctionData({
          abi: V2_ROUTER_ABI,
          functionName: 'swapExactTokensForETH',
          args: [
            amountInParsed,
            minimumAmountOut,
            path,
            '0x0000000000000000000000000000000000000000' as Address, // Placeholder
            deadline,
          ],
        });
      } else {
        // Regular ERC20 to ERC20 swap
        swapCalldata = encodeFunctionData({
          abi: V2_ROUTER_ABI,
          functionName: 'swapExactTokensForTokens',
          args: [
            amountInParsed,
            minimumAmountOut,
            path,
            '0x0000000000000000000000000000000000000000' as Address, // Placeholder
            deadline,
          ],
        });
      }
    }

    // Helper function to check if approval is needed for a specific router
    const checkApprovalNeeded = async (spenderAddress: Address): Promise<boolean> => {
      // Native tokens never need approval
      if (isNative) return false;

      // If no user address provided, assume approval is needed
      if (!userAddress) return true;

      try {
        // Get current allowance from blockchain
        const tokenContract = await provider.readContract({
          address: tokenIn as Address,
          abi: [{
            name: 'allowance',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' }
            ],
            outputs: [{ name: '', type: 'uint256' }]
          }],
          functionName: 'allowance',
          args: [userAddress as Address, spenderAddress],
        });

        // Check if current allowance is sufficient
        const currentAllowance = tokenContract as bigint;
        return currentAllowance < amountInParsed;
      } catch (error) {
        // If we can't check allowance, assume approval is needed
        console.error('Failed to check allowance:', error);
        return true;
      }
    };

    // Format all quotes for response - each quote needs transaction and approval data
    const formattedQuotesPromises = quote.allQuotes.map(async (q) => {
      // Generate router address based on DEX type
      const quoteRouterAddress = q.dex === 'V3'
        ? (process.env.V3_SWAP_ROUTER_ADDRESS as Address)
        : (process.env.ROUTER_ADDRESS as Address);

      // Generate transaction calldata for this specific quote
      let quoteCalldata: `0x${string}`;
      let quoteValueToSend = '0';
      const quoteMinAmountOut = (q.amountOut * (10000n - slippageBps)) / 10000n;

      if (q.dex === 'V3') {
        // V3 Swap transaction
        quoteCalldata = encodeFunctionData({
          abi: V3_ROUTER_ABI,
          functionName: 'exactInputSingle',
          args: [{
            tokenIn: tokenIn as Address,
            tokenOut: tokenOut as Address,
            fee: q.feeTier!,
            recipient: '0x0000000000000000000000000000000000000000' as Address,
            deadline,
            amountIn: amountInParsed,
            amountOutMinimum: quoteMinAmountOut,
            sqrtPriceLimitX96: 0n,
          }],
        });

        if (isNative) {
          quoteValueToSend = amountInParsed.toString();
        }
      } else {
        // V2 Swap transaction
        const path = [tokenIn as Address, tokenOut as Address];

        if (isNative) {
          quoteCalldata = encodeFunctionData({
            abi: V2_ROUTER_ABI,
            functionName: 'swapExactETHForTokens',
            args: [quoteMinAmountOut, path, '0x0000000000000000000000000000000000000000' as Address, deadline],
          });
          quoteValueToSend = amountInParsed.toString();
        } else if (isNativeToken(tokenOut as Address)) {
          quoteCalldata = encodeFunctionData({
            abi: V2_ROUTER_ABI,
            functionName: 'swapExactTokensForETH',
            args: [amountInParsed, quoteMinAmountOut, path, '0x0000000000000000000000000000000000000000' as Address, deadline],
          });
        } else {
          quoteCalldata = encodeFunctionData({
            abi: V2_ROUTER_ABI,
            functionName: 'swapExactTokensForTokens',
            args: [amountInParsed, quoteMinAmountOut, path, '0x0000000000000000000000000000000000000000' as Address, deadline],
          });
        }
      }

      // Check if approval is needed for this specific router
      const needsApprovalForRoute = await checkApprovalNeeded(quoteRouterAddress);

      return {
        dex: q.dex,
        dexName: q.dexName,
        feeTier: q.feeTier,
        amountOut: formatTokenAmount(q.amountOut, quote.tokenOut.decimals),
        amountOutWei: q.amountOut.toString(),
        priceImpact: `${q.priceImpact.toFixed(4)}%`,
        gasEstimate: q.gasEstimate?.toString(),
        poolAddress: q.poolAddress,
        // Transaction data for executing this specific route
        transaction: {
          to: quoteRouterAddress,
          data: quoteCalldata,
          value: quoteValueToSend,
          from: '0x0000000000000000000000000000000000000000',
        },
        // Approval information for this route (checked on-chain if userAddress provided)
        approval: needsApprovalForRoute ? {
          needed: true,
          message: `Approval required for ${quote.tokenIn.symbol}`,
          token: tokenIn,
          spender: quoteRouterAddress,
          amount: amountInParsed.toString(),
        } : {
          needed: false,
          message: userAddress
            ? `${quote.tokenIn.symbol} already approved`
            : 'No approval needed for native token',
        },
      };
    });

    // Wait for all quote formatting to complete
    const formattedQuotes = await Promise.all(formattedQuotesPromises);

    // Check approval for best route
    const bestRouteNeedsApproval = await checkApprovalNeeded(routerAddress);

    res.json({
      success: true,
      data: {
        tokenIn: {
          address: quote.tokenIn.address,
          symbol: quote.tokenIn.symbol,
          amount: amountIn,
          amountWei: amountInParsed.toString(),
        },
        tokenOut: {
          address: quote.tokenOut.address,
          symbol: quote.tokenOut.symbol,
          amount: formatTokenAmount(quote.bestQuote.amountOut, quote.tokenOut.decimals),
          amountWei: quote.bestQuote.amountOut.toString(),
        },
        bestRoute: {
          dex: quote.bestQuote.dex,
          dexName: quote.bestQuote.dexName,
          feeTier: quote.bestQuote.feeTier,
          amountOut: formatTokenAmount(quote.bestQuote.amountOut, quote.tokenOut.decimals),
          amountOutWei: quote.bestQuote.amountOut.toString(),
          priceImpact: `${quote.bestQuote.priceImpact.toFixed(4)}%`,
          gasEstimate: quote.bestQuote.gasEstimate?.toString(),
          poolAddress: quote.bestQuote.poolAddress,
          // Transaction data for executing this route
          transaction: {
            to: routerAddress,
            data: swapCalldata,
            value: valueToSend,
            from: '0x0000000000000000000000000000000000000000', // Placeholder - frontend sets this
          },
          // Approval information for best route (checked on-chain if userAddress provided)
          approval: bestRouteNeedsApproval ? {
            needed: true,
            message: `Approval required for ${quote.tokenIn.symbol}`,
            token: tokenIn,
            spender: routerAddress,
            amount: amountInParsed.toString(),
          } : {
            needed: false,
            message: userAddress
              ? `${quote.tokenIn.symbol} already approved`
              : 'No approval needed for native token',
          },
        },
        allQuotes: formattedQuotes,
        savings: {
          percentage: `${quote.savings.percentage.toFixed(2)}%`,
          amount: formatTokenAmount(quote.savings.absoluteAmount, quote.tokenOut.decimals),
          amountWei: quote.savings.absoluteAmount.toString(),
        },
        slippage: `${slippage}%`,
        minimumAmountOut: formatTokenAmount(minimumAmountOut, quote.tokenOut.decimals),
        minimumAmountOutWei: minimumAmountOut.toString(),
        recommendation: quote.recommendation,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/aggregator/build-tx
 * Build transaction data for executing swap through aggregator contract
 * Body: { tokenIn: string, tokenOut: string, amountIn: string, slippage?: number, deadline?: number }
 */
router.post('/build-tx', async (req: Request, res: Response) => {
  try {
    const { tokenIn, tokenOut, amountIn, slippage = 0.5, deadline = 1800 } = req.body;

    if (!tokenIn || !tokenOut || !amountIn) {
      return res.status(400).json({
        success: false,
        error: 'tokenIn, tokenOut, and amountIn are required',
      });
    }

    // Validate slippage (must be between 0 and 100)
    if (slippage < 0 || slippage > 100) {
      return res.status(400).json({
        success: false,
        error: 'slippage must be between 0 and 100',
      });
    }

    // Get token decimals from registry or fetch from chain
    let tokenInDecimals = 18; // default
    const knownTokenIn = MAINNET_TOKEN_REGISTRY.getByAddress(tokenIn);

    if (knownTokenIn) {
      tokenInDecimals = knownTokenIn.decimals;
    } else {
      // Fallback: fetch decimals from chain for unknown tokens
      try {
        const tokenInfo = await aggregatorService.getTokenInfo(tokenIn as Address);
        tokenInDecimals = tokenInfo.decimals;
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: `Unable to fetch token decimals for tokenIn: ${tokenIn}`,
        });
      }
    }

    // Parse amount with correct decimals
    const amountInParsed = parseUnits(amountIn, tokenInDecimals);

    // Get best quote
    const bestQuote = await aggregatorService.getBestQuote(
      tokenIn as Address,
      tokenOut as Address,
      amountInParsed
    );

    // Calculate minimum amount out
    const slippageBps = BigInt(Math.floor(slippage * 100));
    const minimumAmountOut = (bestQuote.amountOut * (10000n - slippageBps)) / 10000n;

    // Calculate deadline (current time + deadline in seconds)
    const deadlineBigInt = BigInt(Math.floor(Date.now() / 1000) + deadline);

    // Generate calldata
    const calldata = aggregatorService.generateSwapCalldata(
      bestQuote,
      tokenIn as Address,
      tokenOut as Address,
      amountInParsed,
      minimumAmountOut,
      deadlineBigInt
    );

    res.json({
      success: true,
      data: {
        to: process.env.AGGREGATOR_CONTRACT_ADDRESS || 'DEPLOY_AGGREGATOR_CONTRACT_FIRST',
        data: calldata,
        value: '0', // No ETH needed for ERC20 swaps
        bestRoute: {
          dex: bestQuote.dex,
          feeTier: bestQuote.feeTier,
          expectedAmountOut: bestQuote.amountOut.toString(),
          minimumAmountOut: minimumAmountOut.toString(),
        },
        // User needs to approve aggregator contract to spend tokenIn first
        approvalNeeded: {
          token: tokenIn,
          spender: process.env.AGGREGATOR_CONTRACT_ADDRESS || 'DEPLOY_AGGREGATOR_CONTRACT_FIRST',
          amount: amountInParsed.toString(),
        },
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/aggregator/health
 * Health check for aggregator service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      status: 'healthy',
      services: {
        v2: 'available',
        v3: 'available',
        aggregator: 'available',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
