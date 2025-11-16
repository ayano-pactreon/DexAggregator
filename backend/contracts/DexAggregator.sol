// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DexAggregator
 * @notice Routes swaps through Uniswap V2 and V3 to get best prices
 * @dev This is a simplified aggregator. For production, add more features:
 *      - Multi-hop routing
 *      - Partial fills across multiple DEXes
 *      - MEV protection
 *      - Emergency pause functionality
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

interface IUniswapV3Router {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

contract DexAggregator {
    // DEX identifiers
    enum DexType { UNISWAP_V2, UNISWAP_V3 }

    // Uniswap V2 Router
    IUniswapV2Router public immutable uniswapV2Router;

    // Uniswap V3 Router
    IUniswapV3Router public immutable uniswapV3Router;

    // Events
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        DexType dexUsed
    );

    constructor(address _v2Router, address _v3Router) {
        uniswapV2Router = IUniswapV2Router(_v2Router);
        uniswapV3Router = IUniswapV3Router(_v3Router);
    }

    /**
     * @notice Swap tokens through Uniswap V2
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Amount of input tokens
     * @param minAmountOut Minimum amount of output tokens (slippage protection)
     * @param deadline Transaction deadline
     */
    function swapV2(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline
    ) external returns (uint256 amountOut) {
        // Transfer tokens from user to this contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Approve V2 router
        IERC20(tokenIn).approve(address(uniswapV2Router), amountIn);

        // Prepare path
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        // Execute swap
        uint[] memory amounts = uniswapV2Router.swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            msg.sender,
            deadline
        );

        amountOut = amounts[amounts.length - 1];

        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut, DexType.UNISWAP_V2);
    }

    /**
     * @notice Swap tokens through Uniswap V3
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param fee V3 pool fee tier (500, 3000, 10000)
     * @param amountIn Amount of input tokens
     * @param minAmountOut Minimum amount of output tokens (slippage protection)
     * @param deadline Transaction deadline
     */
    function swapV3(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline
    ) external returns (uint256 amountOut) {
        // Transfer tokens from user to this contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Approve V3 router
        IERC20(tokenIn).approve(address(uniswapV3Router), amountIn);

        // Prepare params
        IUniswapV3Router.ExactInputSingleParams memory params = IUniswapV3Router.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: msg.sender,
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0
        });

        // Execute swap
        amountOut = uniswapV3Router.exactInputSingle(params);

        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut, DexType.UNISWAP_V3);
    }

    /**
     * @notice Smart routing: automatically choose V2 or V3 based on off-chain quote
     * @dev The dexType is determined by your TypeScript backend after comparing quotes
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Amount of input tokens
     * @param minAmountOut Minimum amount of output tokens
     * @param deadline Transaction deadline
     * @param dexType Which DEX to use (determined by backend)
     * @param v3Fee Fee tier if using V3 (ignored for V2)
     */
    function smartSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline,
        DexType dexType,
        uint24 v3Fee
    ) external returns (uint256 amountOut) {
        if (dexType == DexType.UNISWAP_V2) {
            return this.swapV2(tokenIn, tokenOut, amountIn, minAmountOut, deadline);
        } else {
            return this.swapV3(tokenIn, tokenOut, v3Fee, amountIn, minAmountOut, deadline);
        }
    }

    /**
     * @notice Emergency function to recover stuck tokens
     * @dev Only use if tokens get stuck in contract
     */
    function recoverToken(address token, uint256 amount) external {
        // In production, add access control (onlyOwner)
        IERC20(token).transfer(msg.sender, amount);
    }
}
