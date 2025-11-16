import { Router, Request, Response } from 'express';
import { v3Service } from '../server';
import { MAINNET_TOKEN_REGISTRY } from '../../config/tokens';
import { parseUnits, Address } from 'viem';
import { formatTokenAmount } from '../../utils/formatting';
import { calculateV3PriceImpact } from '../../utils/calculations';
import { V3FeeTier } from '../../types/v3';

const router = Router();

/**
 * GET /api/v3/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      status: 'healthy',
      version: 'v3',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/v3/pool/find
 * Find pool address for two tokens and fee tier
 * Body: { token0: string, token1: string, fee: number }
 */
router.post('/pool/find', async (req: Request, res: Response) => {
  try {
    const { token0, token1, fee } = req.body;

    if (!token0 || !token1 || !fee) {
      return res.status(400).json({
        success: false,
        error: 'token0, token1, and fee are required',
      });
    }

    const poolAddress = await v3Service.getPool(token0, token1, fee);

    res.json({
      success: true,
      data: {
        poolAddress,
        token0,
        token1,
        fee,
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
 * POST /api/v3/pool/find-all
 * Find all pools for a token pair across different fee tiers
 * Body: { token0: string, token1: string }
 */
router.post('/pool/find-all', async (req: Request, res: Response) => {
  try {
    const { token0, token1 } = req.body;

    if (!token0 || !token1) {
      return res.status(400).json({
        success: false,
        error: 'token0 and token1 are required',
      });
    }

    const poolAddresses = await v3Service.findPoolsForPair(token0, token1);

    res.json({
      success: true,
      data: {
        pools: poolAddresses,
        count: poolAddresses.length,
        token0,
        token1,
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
 * GET /api/v3/pool/:poolAddress
 * Get detailed information about a specific pool
 */
router.get('/pool/:poolAddress', async (req: Request, res: Response) => {
  try {
    const { poolAddress } = req.params;
    const poolData = await v3Service.getPoolData(poolAddress);

    res.json({
      success: true,
      data: poolData,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/v3/pool/:poolAddress/slot0
 * Get slot0 data for a pool (current price and tick)
 */
router.get('/pool/:poolAddress/slot0', async (req: Request, res: Response) => {
  try {
    const { poolAddress } = req.params;
    const slot0 = await v3Service.getSlot0(poolAddress);

    res.json({
      success: true,
      data: slot0,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/v3/pool/:poolAddress/liquidity
 * Get current liquidity for a pool
 */
router.get('/pool/:poolAddress/liquidity', async (req: Request, res: Response) => {
  try {
    const { poolAddress } = req.params;
    const liquidity = await v3Service.getLiquidity(poolAddress);

    res.json({
      success: true,
      data: {
        liquidity: liquidity.toString(),
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
 * GET /api/v3/pool/:poolAddress/tick/:tickIndex
 * Get tick data for a specific tick
 */
router.get('/pool/:poolAddress/tick/:tickIndex', async (req: Request, res: Response) => {
  try {
    const { poolAddress, tickIndex } = req.params;
    const tick = await v3Service.getTick(poolAddress, parseInt(tickIndex));

    res.json({
      success: true,
      data: tick,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/v3/quote
 * Get a swap quote
 * Body: { tokenIn: string, tokenOut: string, fee: number, amountIn: string, slippage?: number }
 */
router.post('/quote', async (req: Request, res: Response) => {
  try {
    const { tokenIn, tokenOut, fee, amountIn, slippage = 0.5 } = req.body;

    if (!tokenIn || !tokenOut || !fee || !amountIn) {
      return res.status(400).json({
        success: false,
        error: 'tokenIn, tokenOut, fee, and amountIn are required',
      });
    }

    // Get token info
    const [tokenInInfo, tokenOutInfo] = await Promise.all([
      v3Service.getTokenInfo(tokenIn),
      v3Service.getTokenInfo(tokenOut),
    ]);

    // Parse amount
    const amountInParsed = parseUnits(amountIn, tokenInInfo.decimals);

    // Get pool and quote
    const poolAddress = await v3Service.getPool(tokenIn, tokenOut, fee);
    const poolData = await v3Service.getPoolData(poolAddress);

    const quoteResult = await v3Service.quoteExactInputSingle({
      tokenIn: tokenInInfo.address,
      tokenOut: tokenOutInfo.address,
      fee,
      amountIn: amountInParsed,
    });

    // Calculate price impact
    const priceImpact = calculateV3PriceImpact(
      poolData.pool.sqrtPriceX96,
      quoteResult.sqrtPriceX96After,
      poolData.pool.token0.decimals,
      poolData.pool.token1.decimals
    );

    // Calculate minimum amount out with slippage
    const slippageBps = BigInt(Math.floor(slippage * 100));
    const minimumAmountOut = (quoteResult.amountOut * (10000n - slippageBps)) / 10000n;

    res.json({
      success: true,
      data: {
        tokenIn: {
          address: tokenInInfo.address,
          symbol: tokenInInfo.symbol,
          amount: amountIn,
          amountWei: amountInParsed.toString(),
        },
        tokenOut: {
          address: tokenOutInfo.address,
          symbol: tokenOutInfo.symbol,
          amount: formatTokenAmount(quoteResult.amountOut, tokenOutInfo.decimals),
          amountWei: quoteResult.amountOut.toString(),
        },
        poolAddress,
        fee,
        priceImpact: `${priceImpact.toFixed(4)}%`,
        priceImpactRaw: priceImpact,
        slippage: `${slippage}%`,
        minimumAmountOut: formatTokenAmount(minimumAmountOut, tokenOutInfo.decimals),
        minimumAmountOutWei: minimumAmountOut.toString(),
        sqrtPriceX96After: quoteResult.sqrtPriceX96After.toString(),
        initializedTicksCrossed: quoteResult.initializedTicksCrossed,
        gasEstimate: quoteResult.gasEstimate.toString(),
        effectivePrice: (Number(quoteResult.amountOut) / Number(amountInParsed)).toString(),
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
 * POST /api/v3/quote-output
 * Get a quote for exact output
 * Body: { tokenIn: string, tokenOut: string, fee: number, amountOut: string }
 */
router.post('/quote-output', async (req: Request, res: Response) => {
  try {
    const { tokenIn, tokenOut, fee, amountOut } = req.body;

    if (!tokenIn || !tokenOut || !fee || !amountOut) {
      return res.status(400).json({
        success: false,
        error: 'tokenIn, tokenOut, fee, and amountOut are required',
      });
    }

    // Get token info
    const [tokenInInfo, tokenOutInfo] = await Promise.all([
      v3Service.getTokenInfo(tokenIn),
      v3Service.getTokenInfo(tokenOut),
    ]);

    // Parse amount
    const amountOutParsed = parseUnits(amountOut, tokenOutInfo.decimals);

    // Get pool and quote
    const poolAddress = await v3Service.getPool(tokenIn, tokenOut, fee);

    const quoteResult = await v3Service.quoteExactOutputSingle(
      tokenInInfo.address,
      tokenOutInfo.address,
      fee,
      amountOutParsed
    );

    res.json({
      success: true,
      data: {
        tokenIn: {
          address: tokenInInfo.address,
          symbol: tokenInInfo.symbol,
          amount: formatTokenAmount(quoteResult.amountOut, tokenInInfo.decimals),
          amountWei: quoteResult.amountOut.toString(),
        },
        tokenOut: {
          address: tokenOutInfo.address,
          symbol: tokenOutInfo.symbol,
          amount: amountOut,
          amountWei: amountOutParsed.toString(),
        },
        poolAddress,
        fee,
        sqrtPriceX96After: quoteResult.sqrtPriceX96After.toString(),
        initializedTicksCrossed: quoteResult.initializedTicksCrossed,
        gasEstimate: quoteResult.gasEstimate.toString(),
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
 * GET /api/v3/fee-tiers
 * Get available fee tiers
 */
router.get('/fee-tiers', async (req: Request, res: Response) => {
  try {
    const feeTiers = [
      {
        fee: V3FeeTier.LOWEST,
        percentage: '0.01%',
        description: 'Best for very stable pairs',
      },
      {
        fee: V3FeeTier.LOW,
        percentage: '0.05%',
        description: 'Best for stable pairs',
      },
      {
        fee: V3FeeTier.MEDIUM,
        percentage: '0.3%',
        description: 'Best for most pairs',
      },
      {
        fee: V3FeeTier.HIGH,
        percentage: '1%',
        description: 'Best for exotic pairs',
      },
    ];

    res.json({
      success: true,
      data: {
        feeTiers,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/v3/pool/:poolAddress/fee-growth
 * Get fee growth global values for a pool
 */
router.get('/pool/:poolAddress/fee-growth', async (req: Request, res: Response) => {
  try {
    const { poolAddress } = req.params;
    const feeGrowth = await v3Service.getFeeGrowthGlobal(poolAddress);

    res.json({
      success: true,
      data: feeGrowth,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/v3/pool/:poolAddress/protocol-fees
 * Get protocol fees for a pool
 */
router.get('/pool/:poolAddress/protocol-fees', async (req: Request, res: Response) => {
  try {
    const { poolAddress } = req.params;
    const fees = await v3Service.getProtocolFees(poolAddress);

    res.json({
      success: true,
      data: fees,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/v3/token/:tokenAddress
 * Get token information
 */
router.get('/token/:tokenAddress', async (req: Request, res: Response) => {
  try {
    const { tokenAddress } = req.params;
    const tokenInfo = await v3Service.getTokenInfo(tokenAddress);

    res.json({
      success: true,
      data: tokenInfo,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/v3/tokens
 * Get all known tokens from registry
 */
router.get('/tokens', async (req: Request, res: Response) => {
  try {
    const tokens = MAINNET_TOKEN_REGISTRY.getAllTokens();

    res.json({
      success: true,
      data: {
        tokens,
        count: tokens.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
