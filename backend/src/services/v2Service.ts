import { Address, PublicClient, getContract } from 'viem';
import { V2_FACTORY_ABI } from '../contracts/abis/v2Factory';
import { V2_PAIR_ABI } from '../contracts/abis/v2Pair';
import { V2_ROUTER_ABI } from '../contracts/abis/v2Router';
import { ERC20_ABI } from '../contracts/abis/erc20';
import { DexConfig, Token } from '../types/common';
import { V2Pair, V2PairData, V2Reserve } from '../types/v2';
import { validateAddress, validateReserves } from '../utils/validation';
import { calculatePrice } from '../utils/calculations';
import { formatTokenAmount } from '../utils/formatting';

export class V2Service {
  private client: PublicClient;
  private config: DexConfig;

  constructor(client: PublicClient, config: DexConfig) {
    if (config.version !== 'v2') {
      throw new Error('Invalid DEX config: expected V2');
    }
    this.client = client;
    this.config = config;
  }

  /**
   * Get the factory contract instance
   */
  private getFactoryContract() {
    return getContract({
      address: this.config.factoryAddress,
      abi: V2_FACTORY_ABI,
      client: this.client,
    });
  }

  /**
   * Get a pair contract instance
   */
  private getPairContract(pairAddress: Address) {
    return getContract({
      address: pairAddress,
      abi: V2_PAIR_ABI,
      client: this.client,
    });
  }

  /**
   * Get a router contract instance
   */
  private getRouterContract() {
    if (!this.config.routerAddress) {
      throw new Error('Router address not configured');
    }
    return getContract({
      address: this.config.routerAddress,
      abi: V2_ROUTER_ABI,
      client: this.client,
    });
  }

  /**
   * Get an ERC20 token contract instance
   */
  private getTokenContract(tokenAddress: Address) {
    return getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      client: this.client,
    });
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: string): Promise<Token> {
    const address = validateAddress(tokenAddress);
    const contract = this.getTokenContract(address);

    const [name, symbol, decimals] = await Promise.all([
      contract.read.name(),
      contract.read.symbol(),
      contract.read.decimals(),
    ]);

    return {
      address,
      name: name as string,
      symbol: symbol as string,
      decimals: Number(decimals),
    };
  }

  /**
   * Get pair address for two tokens
   */
  async getPair(token0: string, token1: string): Promise<Address> {
    const addr0 = validateAddress(token0);
    const addr1 = validateAddress(token1);
    const factory = this.getFactoryContract();

    const pairAddress = await factory.read.getPair([addr0, addr1]);

    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Pair not found for tokens: ${token0} and ${token1}`);
    }

    return pairAddress as Address;
  }

  /**
   * Get total number of pairs in the factory
   */
  async getAllPairsLength(): Promise<number> {
    const factory = this.getFactoryContract();
    const length = await factory.read.allPairsLength();
    return Number(length);
  }

  /**
   * Get pair addresses by index range
   */
  async getAllPairs(startIndex: number, endIndex: number): Promise<Address[]> {
    const factory = this.getFactoryContract();
    const length = await this.getAllPairsLength();

    const actualEndIndex = Math.min(endIndex, length);
    if (startIndex >= actualEndIndex) {
      return [];
    }

    const promises: Promise<Address>[] = [];
    for (let i = startIndex; i < actualEndIndex; i++) {
      promises.push(
        factory.read.allPairs([BigInt(i)]).then((addr) => addr as Address)
      );
    }

    return Promise.all(promises);
  }

  /**
   * Get all pair addresses
   */
  async getAllPairsAddresses(): Promise<Address[]> {
    const length = await this.getAllPairsLength();
    return this.getAllPairs(0, length);
  }

  /**
   * Get reserves for a pair
   */
  async getReserves(pairAddress: string): Promise<V2Reserve> {
    const address = validateAddress(pairAddress);
    const pair = this.getPairContract(address);

    const result = await pair.read.getReserves();

    return {
      reserve0: result[0] as bigint,
      reserve1: result[1] as bigint,
      blockTimestampLast: Number(result[2]),
    };
  }

  /**
   * Get complete pair information
   */
  async getPairInfo(pairAddress: string): Promise<V2Pair> {
    const address = validateAddress(pairAddress);
    const pair = this.getPairContract(address);

    const [token0Address, token1Address, reserves, totalSupply] = await Promise.all([
      pair.read.token0(),
      pair.read.token1(),
      pair.read.getReserves(),
      pair.read.totalSupply(),
    ]);

    const [token0Info, token1Info] = await Promise.all([
      this.getTokenInfo(token0Address as string),
      this.getTokenInfo(token1Address as string),
    ]);

    return {
      address,
      token0: token0Info,
      token1: token1Info,
      reserve0: reserves[0] as bigint,
      reserve1: reserves[1] as bigint,
      totalSupply: totalSupply as bigint,
      lastUpdated: Number(reserves[2]),
    };
  }

  /**
   * Get pair data with calculated prices and liquidity
   */
  async getPairData(pairAddress: string): Promise<V2PairData> {
    const pair = await this.getPairInfo(pairAddress);

    validateReserves(pair.reserve0, pair.reserve1);

    const price0 = calculatePrice(
      pair.reserve0,
      pair.reserve1,
      pair.token0.decimals,
      pair.token1.decimals
    );

    const price1 = calculatePrice(
      pair.reserve1,
      pair.reserve0,
      pair.token1.decimals,
      pair.token0.decimals
    );

    return {
      pair,
      price0: price0.toString(),
      price1: price1.toString(),
      liquidity: {
        token0: formatTokenAmount(pair.reserve0, pair.token0.decimals),
        token1: formatTokenAmount(pair.reserve1, pair.token1.decimals),
      },
    };
  }

  /**
   * Get output amounts for a given input through a path
   */
  async getAmountsOut(amountIn: bigint, path: Address[]): Promise<bigint[]> {
    if (path.length < 2) {
      throw new Error('Path must contain at least 2 addresses');
    }

    const router = this.getRouterContract();
    const amounts = await router.read.getAmountsOut([amountIn, path]);

    return amounts as bigint[];
  }

  /**
   * Get input amounts required for a given output through a path
   */
  async getAmountsIn(amountOut: bigint, path: Address[]): Promise<bigint[]> {
    if (path.length < 2) {
      throw new Error('Path must contain at least 2 addresses');
    }

    const router = this.getRouterContract();
    const amounts = await router.read.getAmountsIn([amountOut, path]);

    return amounts as bigint[];
  }

  /**
   * Get quote for swapping tokenIn to tokenOut
   */
  async getQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
  ): Promise<bigint> {
    const pairAddress = await this.getPair(tokenIn, tokenOut);
    const pair = await this.getPairInfo(pairAddress);

    const tokenInAddress = validateAddress(tokenIn);
    const isToken0 = tokenInAddress.toLowerCase() === pair.token0.address.toLowerCase();

    const [reserveIn, reserveOut] = isToken0
      ? [pair.reserve0, pair.reserve1]
      : [pair.reserve1, pair.reserve0];

    validateReserves(reserveIn, reserveOut);

    const router = this.getRouterContract();
    const amountOut = await router.read.getAmountOut([amountIn, reserveIn, reserveOut]);

    return amountOut as bigint;
  }

  /**
   * Get total liquidity (total supply of LP tokens)
   */
  async getTotalLiquidity(pairAddress: string): Promise<bigint> {
    const address = validateAddress(pairAddress);
    const pair = this.getPairContract(address);
    const totalSupply = await pair.read.totalSupply();
    return totalSupply as bigint;
  }

  /**
   * Find all pairs that include a specific token
   */
  async findPairsForToken(tokenAddress: string): Promise<Address[]> {
    const allPairs = await this.getAllPairsAddresses();
    const validatedToken = validateAddress(tokenAddress);

    const pairs: Address[] = [];

    for (const pairAddress of allPairs) {
      const pair = this.getPairContract(pairAddress);
      const [token0, token1] = await Promise.all([
        pair.read.token0(),
        pair.read.token1(),
      ]);

      if (
        (token0 as string).toLowerCase() === validatedToken.toLowerCase() ||
        (token1 as string).toLowerCase() === validatedToken.toLowerCase()
      ) {
        pairs.push(pairAddress);
      }
    }

    return pairs;
  }
}
