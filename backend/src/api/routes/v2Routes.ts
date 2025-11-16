import { Router, Request, Response } from 'express';
import { v2Service } from '../server';
import { MAINNET_TOKEN_REGISTRY } from '../../config/tokens';
import { parseUnits, Address } from 'viem';
import { formatTokenAmount } from '../../utils/formatting';
import { calculatePriceImpact } from '../../utils/calculations';

const router = Router();

/**
 * GET /api/v2/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const totalPairs = await v2Service.getAllPairsLength();
    res.json({
      success: true,
      status: 'healthy',
      totalPairs,
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
 * GET /api/v2/pairs
 * Get all pairs or paginated pairs
 * Query params: start (default: 0), limit (default: 10, max: 100)
 */
router.get('/pairs', async (req: Request, res: Response) => {
  try {
    const start = parseInt(req.query.start as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

    const totalPairs = await v2Service.getAllPairsLength();
    const pairAddresses = await v2Service.getAllPairs(start, start + limit);

    res.json({
      success: true,
      data: {
        pairs: pairAddresses,
        pagination: {
          start,
          limit,
          total: totalPairs,
          hasMore: start + limit < totalPairs,
        },
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
 * GET /api/v2/pair/:pairAddress
 * Get detailed information about a specific pair
 */
router.get('/pair/:pairAddress', async (req: Request, res: Response) => {
  try {
    const { pairAddress } = req.params;
    const pairData = await v2Service.getPairData(pairAddress);

    res.json({
      success: true,
      data: pairData,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/v2/pair/find
 * Find pair address for two tokens
 * Body: { token0: string, token1: string }
 */
router.post('/pair/find', async (req: Request, res: Response) => {
  try {
    const { token0, token1 } = req.body;

    if (!token0 || !token1) {
      return res.status(400).json({
        success: false,
        error: 'token0 and token1 are required',
      });
    }

    const pairAddress = await v2Service.getPair(token0, token1);

    res.json({
      success: true,
      data: {
        pairAddress,
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
 * POST /api/v2/quote
 * Get a swap quote
 * Body: { tokenIn: string, tokenOut: string, amountIn: string, slippage?: number }
 */
router.post('/quote', async (req: Request, res: Response) => {
  try {
    const { tokenIn, tokenOut, amountIn, slippage = 0.5 } = req.body;

    if (!tokenIn || !tokenOut || !amountIn) {
      return res.status(400).json({
        success: false,
        error: 'tokenIn, tokenOut, and amountIn are required',
      });
    }

    // Get token info
    const [tokenInInfo, tokenOutInfo] = await Promise.all([
      v2Service.getTokenInfo(tokenIn),
      v2Service.getTokenInfo(tokenOut),
    ]);

    // Parse amount
    const amountInParsed = parseUnits(amountIn, tokenInInfo.decimals);

    // Get pair and quote
    const pairAddress = await v2Service.getPair(tokenIn, tokenOut);
    const pairData = await v2Service.getPairData(pairAddress);
    const amountOut = await v2Service.getQuote(tokenIn, tokenOut, amountInParsed);

    // Calculate price impact
    const isToken0 = tokenIn.toLowerCase() === pairData.pair.token0.address.toLowerCase();
    const [reserveIn, reserveOut] = isToken0
      ? [pairData.pair.reserve0, pairData.pair.reserve1]
      : [pairData.pair.reserve1, pairData.pair.reserve0];

    const priceImpact = calculatePriceImpact(
      amountInParsed,
      reserveIn,
      reserveOut,
      tokenInInfo.decimals,
      tokenOutInfo.decimals
    );

    // Calculate minimum amount out with slippage
    const slippageBps = BigInt(Math.floor(slippage * 100));
    const minimumAmountOut = (amountOut * (10000n - slippageBps)) / 10000n;

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
          amount: formatTokenAmount(amountOut, tokenOutInfo.decimals),
          amountWei: amountOut.toString(),
        },
        pairAddress,
        priceImpact: `${priceImpact.toFixed(4)}%`,
        priceImpactRaw: priceImpact,
        slippage: `${slippage}%`,
        minimumAmountOut: formatTokenAmount(minimumAmountOut, tokenOutInfo.decimals),
        minimumAmountOutWei: minimumAmountOut.toString(),
        effectivePrice: (Number(amountOut) / Number(amountInParsed)).toString(),
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
 * POST /api/v2/amounts-out
 * Get amounts out for a multi-hop swap
 * Body: { amountIn: string, path: string[] }
 */
router.post('/amounts-out', async (req: Request, res: Response) => {
  try {
    const { amountIn, path } = req.body;

    if (!amountIn || !path || !Array.isArray(path) || path.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'amountIn and path (array of at least 2 addresses) are required',
      });
    }

    // Get first token info for decimals
    const firstTokenInfo = await v2Service.getTokenInfo(path[0]);
    const amountInParsed = parseUnits(amountIn, firstTokenInfo.decimals);

    // Get amounts out
    const amounts = await v2Service.getAmountsOut(amountInParsed, path as Address[]);

    // Format amounts with token info
    const formattedAmounts = await Promise.all(
      amounts.map(async (amount, index) => {
        const tokenInfo = await v2Service.getTokenInfo(path[index]);
        return {
          token: tokenInfo.symbol,
          address: tokenInfo.address,
          amount: formatTokenAmount(amount, tokenInfo.decimals),
          amountWei: amount.toString(),
        };
      })
    );

    res.json({
      success: true,
      data: {
        path,
        amounts: formattedAmounts,
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
 * GET /api/v2/reserves/:pairAddress
 * Get reserves for a specific pair
 */
router.get('/reserves/:pairAddress', async (req: Request, res: Response) => {
  try {
    const { pairAddress } = req.params;
    const reserves = await v2Service.getReserves(pairAddress);

    res.json({
      success: true,
      data: reserves,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/v2/token/:tokenAddress
 * Get token information
 */
router.get('/token/:tokenAddress', async (req: Request, res: Response) => {
  try {
    const { tokenAddress } = req.params;
    const tokenInfo = await v2Service.getTokenInfo(tokenAddress);

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
 * GET /api/v2/tokens
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

/**
 * GET /api/v2/token-by-symbol/:symbol
 * Get token by symbol from registry
 */
router.get('/token-by-symbol/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const token = MAINNET_TOKEN_REGISTRY.getBySymbol(symbol);

    if (!token) {
      return res.status(404).json({
        success: false,
        error: `Token with symbol ${symbol} not found`,
      });
    }

    res.json({
      success: true,
      data: token,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
