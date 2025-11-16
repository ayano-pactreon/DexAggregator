import {useEffect, useState, useMemo} from "react";
import {SwapInfoTab} from "@/lib/core/enums/SwapInfoTab";
import {SwapRouteType} from "@/lib/core/enums/SwapRouteType";
import {tokenService, ApiToken} from "@/services/tokenService";
import {quotesApi, QuoteData} from "@/network";
import {SwapTransaction} from "@/network/types/responses";

export interface Token {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    network: string;
    balance: string;
    tokenPrice: string;
    image?: string;
}

export interface SwapRoute {
    id: string;
    provider: string;
    dexName: string;
    path: string[];
    estimatedOutput: string;
    fee: number;
    totalUsdReceived: string;
    timeEstimate: string;
    type: SwapRouteType;
    priceImpact: string;
    poolAddress: string;
    transaction?: SwapTransaction;
}

export interface Wallet {
    id: string;
    name: string;
    address: string;
}

export const MOCK_ROUTES: SwapRoute[] = [
    {
        id: "route1",
        provider: "HydraDX",
        path: ["DOT", "USDC", "ETH"],
        estimatedOutput: "0.0289",
        fee: 0.45,
        totalUsdReceived: "94.50",
        timeEstimate: "12s",
        type: SwapRouteType.BEST,
    },
    {
        id: "route2",
        provider: "Stealth EX",
        path: ["DOT", "USDC", "ETH"],
        estimatedOutput: "0.0285",
        fee: 0.47,
        totalUsdReceived: "94.44",
        timeEstimate: "13s",
        type: SwapRouteType.BEST,
    },

    {
        id: "route3",
        provider: "Squid",
        path: ["DOT", "ETH"],
        estimatedOutput: "0.0281",
        fee: 0.25,
        totalUsdReceived: "94.75",
        timeEstimate: "18s",
        type: SwapRouteType.CHEAPEST,
    },

    {
        id: "route4",
        provider: "Relay",
        path: ["DOT", "ETH"],
        estimatedOutput: "0.0278",
        fee: 0.55,
        totalUsdReceived: "94.25",
        timeEstimate: "8s",
        type: SwapRouteType.FASTEST,
    },

];


// Utility function to convert API tokens to Token format
function convertApiTokenToToken(apiToken: ApiToken): Token {
    // Map of token symbols to their default images
    const tokenImages: Record<string, string> = {
        'XRP': 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png',
        'WBTC': 'https://s2.coinmarketcap.com/static/img/coins/64x64/3717.png',
        'USDC': 'https://raw.githubusercontent.com/TalismanSociety/chaindata/main/assets/tokens/usdc.svg',
        'WETH': 'https://raw.githubusercontent.com/TalismanSociety/chaindata/main/assets/tokens/eth.svg',
        'USDT': 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
        'DAI': 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png',
        'FDUSD': 'https://s2.coinmarketcap.com/static/img/coins/64x64/26081.png',
    };

    return {
        address: apiToken.address,
        symbol: apiToken.symbol,
        name: apiToken.name,
        decimals: apiToken.decimals,
        network: 'XRPL EVM',
        balance: '-',
        tokenPrice: '0.00', // Will be fetched from price API later
        image: tokenImages[apiToken.symbol] || undefined,
    };
}

// Temporary placeholder - will be populated from API
export const AVAILABLE_TOKENS: Token[] = [];

const MOCK_WALLETS: Wallet[] = [
    {
        id: "1",
        name: "Wallet 1",
        address: "0xA1B2C3D4E5F6A1B2C3D4",
    },
    {
        id: "2",
        name: "Wallet 2",
        address: "0x1234567890ABCDEF1234",
    },
    {
        id: "3",
        name: "Wallet 3",
        address: "0xFEDCBA0987654321DCBA",
    },
];

export interface SwapViewModel {
    fromToken: string | null;
    toToken: string | null;
    setToToken: (symbol: string) => void;

    showSwappingFrom: boolean;
    handleFromSelect: (symbol: string, network: string) => void;

    fromAmount: string;
    setFromAmount: (address: string) => void;

    toAmount: string;
    setToAmount: (address: string) => void;

    getPriceInUSD: (symbol: string | null, amount: string) => string;

    swapInfoTab: SwapInfoTab;
    setSwapInfoTab: (tab: SwapInfoTab) => void;

    fromNetwork: string | null;
    toNetwork: string | null;
    handleToSelect: (symbol: string, network: string) => void;

    swapTokens: () => void;
    walletSheetOpen: boolean;
    setWalletSheetOpen: (open: boolean) => void;

    routes: SwapRoute[];
    filteredRoutes: SwapRoute[];
    routeFilter: SwapRouteType | SwapRouteType.ALL;
    setRouteFilter: (filter: SwapRouteType | SwapRouteType.ALL) => void;
    selectedOriginAccount: Wallet | null;
    setSelectedOriginAccount: (wallet: Wallet) => void;
    wallets: Wallet[];
    accountDropdownOpen: boolean;
    setAccountDropdownOpen: (open: boolean) => void;
    connectedWallets: string[];
    isWalletConnected: (walletId: string) => boolean;
    toggleWalletConnection: (walletId: string) => void;

    address: string;
    error: string;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fee: number;
    setFee: (fee: number) => void;
    selectedRouteId: string | null;
    setSelectedRouteId: (id: string | null) => void;
    getCalculatedOutputForRoute: (route: SwapRoute) => { receiveAmount: string; receiveInUsd: string };
    routesDropdownOpen: boolean;
    setRoutesDropdownOpen: (open: boolean) => void;
    headerDropdownOpen: boolean;
    setHeaderDropdownOpen: (open: boolean) => void;

    // Token list from API
    availableTokens: Token[];
    tokensLoading: boolean;
    tokensError: string | null;
    refreshTokens: () => Promise<void>;

    // Quote data from aggregator API
    quoteData: QuoteData | null;
    quoteLoading: boolean;
    quoteError: string | null;
    slippage: number;
    setSlippage: (slippage: number) => void;
    isRefreshing: boolean;
}

export function useSwapViewModel(): SwapViewModel {
    const [fromToken, setFromToken] = useState<string | null>(null);
    const [toToken, setToToken] = useState<string | null>(null);
    const [showSwappingFrom, setShowSwappingFrom] = useState(false);
    const [fromAmount, setFromAmount] = useState("");
    const [toAmount, setToAmount] = useState("");
    const [swapInfoTab, setSwapInfoTab] = useState<SwapInfoTab>(SwapInfoTab.DETAILS);
    const [fromNetwork, setFromNetwork] = useState<string | null>(null);
    const [toNetwork, setToNetwork] = useState<string | null>(null);
    const [walletSheetOpen, setWalletSheetOpen] = useState(false);
    const [routes, setRoutes] = useState<SwapRoute[]>([]);
    const [routeFilter, setRouteFilter] = useState<SwapRouteType | SwapRouteType.ALL>(SwapRouteType.ALL);
    const [wallets] = useState<Wallet[]>(MOCK_WALLETS);
    const [selectedOriginAccount, setSelectedOriginAccount] = useState<Wallet | null>(null);
    const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
    const [connectedWallets, setConnectedWallets] = useState<string[]>([]);
    const [address, setAddress] = useState("");
    const [error, setError] = useState("");
    const [fee, setFee] = useState(0.25);
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [routesDropdownOpen, setRoutesDropdownOpen] = useState(false);
    const [headerDropdownOpen,setHeaderDropdownOpen] = useState(false);

    // Token API state
    const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
    const [tokensLoading, setTokensLoading] = useState(false);
    const [tokensError, setTokensError] = useState<string | null>(null);

    // Quote API state
    const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteError, setQuoteError] = useState<string | null>(null);
    const [slippage, setSlippage] = useState<number>(0.5);
    const [isRefreshing, setIsRefreshing] = useState(false);

    function handleFromSelect(symbol: string, network: string) {
        if (!symbol || !network) {
            setFromToken("");
            setFromNetwork("");
            setShowSwappingFrom(false);
            return;
        }
        setFromToken(symbol);
        setFromNetwork(network);
        setShowSwappingFrom(true);
    }

    function handleToSelect(symbol: string, network: string) {
        setToToken(symbol);
        setToNetwork(network);
    }

    function getPriceInUSD(symbol: string | null, amount: string): string {
        if (!symbol || !amount) return "0.00";
        const token = availableTokens.find((t) => t.symbol === symbol);
        if (!token) return "0.00";
        const price = parseFloat(token.tokenPrice.replace(/,/g, ""));
        const amt = parseFloat(amount);
        if (isNaN(price) || isNaN(amt)) return "0.00";
        return (price * amt).toFixed(2);
    }


    function calculateToAmount(fromSymbol: string | null, toSymbol: string | null, fromAmount: string, routeFee?: number) {
        if (!fromSymbol || !toSymbol || !fromAmount) return "0.00";

        const fromToken = availableTokens.find((t) => t.symbol === fromSymbol);
        const toToken = availableTokens.find((t) => t.symbol === toSymbol);
        const fromAmnt = parseFloat(fromAmount);

        if (!fromToken || !toToken || isNaN(fromAmnt)) return "0.00";

        const fromPrice = parseFloat(fromToken.tokenPrice.replace(/,/g, ""));
        const toPrice = parseFloat(toToken.tokenPrice.replace(/,/g, ""));

        if(isNaN(fromPrice) || isNaN(toPrice)) return "0.00";
        const feeToApply = routeFee ?? fee;
        const usdValue = fromAmnt * fromPrice - feeToApply;
        const toAmnt = usdValue / toPrice

        return toAmnt > 0 ? toAmnt.toFixed(6) : "0.00";
    }

    function swapTokens() {
        // Store original values before swapping
        const tempToken = fromToken;
        const tempNetwork = fromNetwork;
        const tempAmount = fromAmount;

        // Swap tokens and networks
        setFromToken(toToken);
        setToToken(tempToken);
        setFromNetwork(toNetwork);
        setToNetwork(tempNetwork);

        // Keep the fromAmount the same - user entered amount should stay in the "from" field
        // The toAmount will be recalculated automatically by the useEffect
    }

    function isWalletConnected(walletId: string): boolean {
        return connectedWallets.includes(walletId);
    }

    function toggleWalletConnection(walletId: string) {
        setConnectedWallets(prev =>
            prev.includes(walletId)
                ? prev.filter(id => id !== walletId)
                : [...prev, walletId]
        );
    }

    const filteredRoutes = useMemo(() => {
        return routes.filter(
            (route) => routeFilter === SwapRouteType.ALL || route.type === routeFilter
        );
    }, [routes, routeFilter]);

    // Auto-select best route when routes change
    useEffect(() => {
        if (routes.length > 0 && !selectedRouteId) {
            const bestRoute = routes.find(r => r.type === SwapRouteType.BEST) || routes[0];
            setSelectedRouteId(bestRoute.id);
            setFee(bestRoute.fee);
        }
    }, [routes, selectedRouteId]);


    // Convert API quote data to SwapRoute format
    const convertQuoteToRoutes = (quoteData: QuoteData): SwapRoute[] => {
        if (!quoteData.allQuotes || quoteData.allQuotes.length === 0) return [];

        // Calculate best metrics across all quotes
        const maxOutput = Math.max(...quoteData.allQuotes.map(q => parseFloat(q.amountOut)));
        const minPriceImpact = Math.min(...quoteData.allQuotes.map(q => parseFloat(q.priceImpact)));

        const routes = quoteData.allQuotes.map((quote, index) => {
            // Determine route type based on actual data
            let routeType = SwapRouteType.ALTERNATE; // Default for routes that don't have a special distinction

            const quoteOutput = parseFloat(quote.amountOut);
            const quotePriceImpact = parseFloat(quote.priceImpact);

            // Only assign BEST if it actually has the highest output
            if (quoteOutput === maxOutput) {
                routeType = SwapRouteType.BEST;
            }
            // Only assign CHEAPEST if it has the lowest price impact AND is not already BEST
            else if (quotePriceImpact === minPriceImpact) {
                routeType = SwapRouteType.CHEAPEST;
            }
            // Note: FASTEST is not assigned since we don't have actual speed/gas data from the API

            // Check if this quote matches the bestRoute to get transaction data
            // Match by poolAddress, dex, and amountOut
            const isBestRoute = quoteData.bestRoute &&
                quote.poolAddress === quoteData.bestRoute.poolAddress &&
                quote.dex === quoteData.bestRoute.dex &&
                quote.amountOut === quoteData.bestRoute.amountOut;

            return {
                id: `route-${quote.dex}-${index}`,
                provider: quote.dex,
                dexName: quote.dexName,
                path: [quoteData.tokenIn.symbol, quoteData.tokenOut.symbol],
                estimatedOutput: quote.amountOut,
                fee: parseFloat(quote.priceImpact), // Using price impact as fee indicator
                totalUsdReceived: quote.amountOut,
                timeEstimate: "~15s", // Default estimate
                type: routeType,
                priceImpact: quote.priceImpact,
                poolAddress: quote.poolAddress,
                transaction: isBestRoute ? quoteData.bestRoute.transaction : quote.transaction,
            };
        });

        // Sort routes so BEST appears first, then others by output amount
        return routes.sort((a, b) => {
            if (a.type === SwapRouteType.BEST) return -1;
            if (b.type === SwapRouteType.BEST) return 1;
            return parseFloat(b.estimatedOutput) - parseFloat(a.estimatedOutput);
        });
    };

    // Load tokens from API on mount
    useEffect(() => {
        const loadTokens = async () => {
            setTokensLoading(true);
            setTokensError(null);

            try {
                const apiTokens = await tokenService.fetchTokens();
                const tokens = apiTokens.map(convertApiTokenToToken);
                setAvailableTokens(tokens);
            } catch (error) {
                console.error('Failed to load tokens:', error);
                setTokensError(error instanceof Error ? error.message : 'Failed to load tokens');
                setAvailableTokens([]);
            } finally {
                setTokensLoading(false);
            }
        };

        loadTokens();
    }, []);

    const refreshTokens = async () => {
        setTokensLoading(true);
        setTokensError(null);

        try {
            const apiTokens = await tokenService.refreshTokens();
            const tokens = apiTokens.map(convertApiTokenToToken);
            setAvailableTokens(tokens);
        } catch (error) {
            console.error('Failed to refresh tokens:', error);
            setTokensError(error instanceof Error ? error.message : 'Failed to refresh tokens');
        } finally {
            setTokensLoading(false);
        }
    };

    // Fetch quote when tokens and amount change, with auto-refresh
    useEffect(() => {
        let isActive = true;
        let refreshInterval: NodeJS.Timeout | null = null;

        const fetchQuote = async (isInitialFetch = false) => {
            // Need both tokens selected and valid amount
            if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
                setQuoteData(null);
                setRoutes([]);
                setToAmount("0.00");
                return;
            }

            // Find token addresses
            const fromTokenData = availableTokens.find(t => t.symbol === fromToken);
            const toTokenData = availableTokens.find(t => t.symbol === toToken);

            if (!fromTokenData || !toTokenData) {
                console.log('Token data not found yet');
                return;
            }

            if (isInitialFetch) {
                setQuoteLoading(true);
            } else {
                setIsRefreshing(true);
            }
            setQuoteError(null);

            try {
                const quote = await quotesApi.getQuote({
                    tokenIn: fromTokenData.address,
                    tokenOut: toTokenData.address,
                    amountIn: fromAmount,
                    slippage: slippage,
                });

                if (!isActive) return; // Don't update if component unmounted

                setQuoteData(quote);
                // Update toAmount with quote data
                setToAmount(quote.tokenOut.amount);

                // Convert quote data to routes
                const convertedRoutes = convertQuoteToRoutes(quote);
                setRoutes(convertedRoutes);
            } catch (error) {
                if (!isActive) return;
                console.error('Failed to fetch quote:', error);
                setQuoteError(error instanceof Error ? error.message : 'Failed to fetch quote');
                setQuoteData(null);
                setRoutes([]);
            } finally {
                if (isActive) {
                    if (isInitialFetch) {
                        setQuoteLoading(false);
                    } else {
                        setIsRefreshing(false);
                    }
                }
            }
        };

        // Debounce the initial quote fetch
        const debounceTimeout = setTimeout(() => {
            if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
                fetchQuote(true);

                // Set up auto-refresh every 10 seconds
                refreshInterval = setInterval(() => {
                    fetchQuote(false);
                }, 10000);
            }
        }, 500); // 500ms debounce

        return () => {
            isActive = false;
            clearTimeout(debounceTimeout);
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [fromToken, toToken, fromAmount, slippage, availableTokens]);

    const isValidEthereumAddress = (address: string) => {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    };

    const isValidSubstrateAddress = (address: string) => {
        return /^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(address)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAddress(value);

        if (value === "") {
            setError("");
        } else if (
            !isValidEthereumAddress(value) &&
            !isValidSubstrateAddress(value)
        ) {
            setError("Invalid Address format");
        } else {
            setError("");
        }
    };

    function getCalculatedOutputForRoute(route: SwapRoute): {receiveAmount: string, receiveInUsd: string} {
        const amount = calculateToAmount(fromToken, toToken, fromAmount, route.fee);
        const usd = getPriceInUSD(toToken, amount);
        return {
            receiveAmount: amount,
            receiveInUsd: usd,
        }
    }

    return {
        fromToken,
        toToken,
        setToToken,
        showSwappingFrom,
        handleFromSelect,
        fromAmount,
        setFromAmount,
        toAmount,
        setToAmount,
        getPriceInUSD,
        swapInfoTab,
        setSwapInfoTab,
        fromNetwork,
        toNetwork,
        handleToSelect,
        swapTokens,
        walletSheetOpen,
        setWalletSheetOpen,
        routes,
        filteredRoutes,
        routeFilter,
        setRouteFilter,
        wallets,
        selectedOriginAccount,
        setSelectedOriginAccount,
        accountDropdownOpen,
        setAccountDropdownOpen,
        connectedWallets,
        isWalletConnected,
        toggleWalletConnection,
        address,
        error,
        handleInputChange,
        fee,
        setFee,
        setSelectedRouteId,
        selectedRouteId,
        getCalculatedOutputForRoute,
        routesDropdownOpen,
        setRoutesDropdownOpen,
        headerDropdownOpen,
        setHeaderDropdownOpen,
        availableTokens,
        tokensLoading,
        tokensError,
        refreshTokens,
        quoteData,
        quoteLoading,
        quoteError,
        slippage,
        setSlippage,
        isRefreshing,
    };
}
