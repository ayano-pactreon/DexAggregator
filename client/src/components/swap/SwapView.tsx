import {useSwapViewModel} from "@/viewmodels/SwapViewModel";
import {Activity, FileSearch, Repeat, Zap, ChevronDown, RefreshCw, Loader2, CheckCircle, XCircle} from "lucide-react";
import SelectTokenDialog from "@/components/swap/SelectTokenDialog";
import {Input} from "@/components/ui/input";
import * as React from "react";
import {SwapInfoTab} from "@/lib/core/enums/SwapInfoTab";
import {SwapRouteType} from "@/lib/core/enums/SwapRouteType";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useSwapExecution} from "@/hooks/useSwapExecution";
import {useAccount} from "wagmi";

export default function SwapView() {
    const viewModel = useSwapViewModel();
    const { isConnected } = useAccount();
    const {
        executeSwap,
        isExecuting,
        isConfirming,
        isSuccess,
        error: swapError,
        txHash,
        reset,
        isApproving,
        isApprovingConfirming,
        approvalSuccess,
        approvalTxHash,
        approvalError
    } = useSwapExecution();

    // Format error message for user-friendly display
    const getErrorMessage = React.useCallback((error: Error | null): string => {
        if (!error) return 'Transaction failed';

        const message = error.message.toLowerCase();

        // User rejected the transaction
        if (message.includes('user rejected') || message.includes('user denied') || message.includes('user cancelled')) {
            return 'Transaction cancelled. You rejected the transaction in your wallet.';
        }

        // Insufficient funds
        if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
            return 'Insufficient funds to complete this transaction.';
        }

        // Network issues
        if (message.includes('network') || message.includes('connection')) {
            return 'Network error. Please check your connection and try again.';
        }

        // Gas issues
        if (message.includes('gas')) {
            return 'Gas estimation failed. The transaction may fail or you may need to adjust gas settings.';
        }

        // Slippage issues
        if (message.includes('slippage')) {
            return 'Price changed too much. Try increasing slippage tolerance.';
        }

        // Generic fallback - just show first line of error
        const firstLine = error.message.split('\n')[0];
        return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
    }, []);

    // Handle swap execution
    const handleExecuteSwap = async () => {
        if (!viewModel.fromToken || !viewModel.toToken || !viewModel.fromAmount || !viewModel.selectedRouteId) {
            alert('Please select tokens, enter amount, and choose a route');
            return;
        }

        if (!isConnected) {
            alert('Please connect your wallet first');
            return;
        }

        // Find the selected route
        const selectedRoute = viewModel.routes.find(route => route.id === viewModel.selectedRouteId);

        if (!selectedRoute) {
            alert('Selected route not found');
            return;
        }

        if (!selectedRoute.transaction) {
            alert('Transaction data not available for this route. Please select the best route (marked as BEST) which has transaction data available.');
            return;
        }

        // Get the token being swapped from (needed for approval)
        const fromTokenData = viewModel.availableTokens.find(t => t.symbol === viewModel.fromToken);

        try {
            await executeSwap(
                selectedRoute.transaction,
                selectedRoute.transaction.approval,
                fromTokenData?.address
            );
        } catch (error) {
            console.error('Swap execution failed:', error);
        }
    };

    // Reset swap state when successful
    React.useEffect(() => {
        if (isSuccess) {
            // Show success message
            const timer = setTimeout(() => {
                reset();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, reset]);

    // Auto-dismiss user rejection errors after 4 seconds
    React.useEffect(() => {
        if (swapError) {
            const errorMsg = getErrorMessage(swapError);
            const isUserRejection = errorMsg.includes('cancelled') || errorMsg.includes('rejected');

            if (isUserRejection) {
                const timer = setTimeout(() => {
                    reset();
                }, 4000);
                return () => clearTimeout(timer);
            }
        }
    }, [swapError, reset, getErrorMessage]);

    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 pt-4 sm:pt-8 pb-2 sm:pb-4 flex flex-col items-center">
            {/* Token Loading/Error Banner */}
            {viewModel.tokensLoading && (
                <div className="w-full mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-300 dark:border-blue-700 rounded-2xl shadow-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold">Loading tokens...</p>
                </div>
            )}
            {viewModel.tokensError && (
                <div className="w-full mb-4 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-300 dark:border-red-700 rounded-2xl shadow-lg flex items-center justify-between">
                    <p className="text-sm text-red-800 dark:text-red-200 font-semibold">{viewModel.tokensError}</p>
                    <button
                        onClick={viewModel.refreshTokens}
                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left side */}
                    <div className="space-y-6">
                        {/* Section 1: Asset Selection */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4 shadow-lg hover:shadow-xl transition-all duration-300">
                            <h2 className="text-2xl font-extrabold mb-2">
                              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-400 bg-clip-text text-transparent">
                                Select Asset
                              </span>
                            </h2>
                            {/* Paying */}
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    You Sell
                                </p>
                                <div
                                    className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-2xl p-4 flex flex-col sm:flex-row justify-between gap-3 hover:border-blue-500 dark:hover:border-blue-400 focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-all duration-300 shadow-md hover:shadow-lg">
                                    <div className="flex-1 min-w-0">
                                         <Input
                                            placeholder="0.00"
                                            autoFocus
                                            min="0"
                                            value={viewModel.fromAmount ?? ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === "") {
                                                    viewModel.setFromAmount("");
                                                    return;
                                                }
                                                const num = parseFloat(value);
                                                if (!isNaN(num) && num >= 0) {
                                                    viewModel.setFromAmount(value);
                                                }
                                            }}
                                            className="text-base sm:text-xl font-bold px-2 py-2 w-full bg-transparent outline-none border-none ring-0 shadow-none focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                            type="number"
                                            inputMode="decimal"
                                        />
                                        <div
                                            className="text-sm text-gray-500 dark:text-gray-400 mt-1 px-2 font-semibold truncate">{`≈ $${viewModel.getPriceInUSD(viewModel.fromToken, viewModel.fromAmount)}`}</div>
                                    </div>
                                    <div className="flex-shrink-0 sm:w-36">
                                        <SelectTokenDialog
                                            tokens={viewModel.availableTokens}
                                            selected={viewModel.fromToken && viewModel.fromNetwork ? {
                                                symbol: viewModel.fromToken,
                                                network: viewModel.fromNetwork
                                            } : undefined}
                                            onSelect={viewModel.handleFromSelect}
                                            triggerLabel="Select Token"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Swap icon */}
                            <div className="flex justify-center my-3">
                                <button
                                    onClick={viewModel.swapTokens}
                                    className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 active:scale-90 hover:scale-110 border-4 border-gray-100 dark:border-gray-800 hover:rotate-180 ring-2 ring-blue-500/20">
                                    <Repeat className="w-6 h-6 text-white font-bold"/>
                                </button>
                            </div>

                            {/* Receiving */}
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    You Buy
                                </p>
                                <div
                                    className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-2xl p-4 flex flex-col sm:flex-row justify-between gap-3 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 shadow-md hover:shadow-lg">
                                    <div className="flex-1 min-w-0">
                                        <div
                                            tabIndex={0}
                                            className="text-base font-semibold px-2 py-2 bg-transparent dark:border-gray-700 rounded text-gray-400 dark:text-gray-500 truncate transition-all duration-200">
                                            {viewModel.toAmount
                                                ? parseFloat(viewModel.toAmount).toFixed(3)
                                                : "0.000"}
                                        </div>
                                        <div
                                            className="text-sm text-gray-500 dark:text-gray-400 mt-1 px-2 font-semibold truncate"> {`≈ $${Number(viewModel.getPriceInUSD(viewModel.toToken, viewModel.toAmount)).toFixed(3)}`}</div>
                                    </div>
                                    <div className="flex-shrink-0 sm:w-36">
                                        <SelectTokenDialog
                                            tokens={viewModel.availableTokens}
                                            selected={viewModel.toToken && viewModel.toNetwork ? {
                                                symbol: viewModel.toToken,
                                                network: viewModel.toNetwork
                                            } : undefined}
                                            onSelect={viewModel.handleToSelect}
                                            triggerLabel="Select Token"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Execute Swap Button */}
                            <button
                                onClick={handleExecuteSwap}
                                disabled={!viewModel.fromToken || !viewModel.toToken || !viewModel.fromAmount || !viewModel.selectedRouteId || isExecuting || isConfirming || isApproving || isApprovingConfirming || !isConnected}
                                className="w-full mt-4 px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white disabled:from-gray-400 disabled:to-gray-500"
                            >
                                {isApproving || isApprovingConfirming ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {isApproving ? 'Approve Token in Wallet...' : 'Confirming Approval...'}
                                    </span>
                                ) : approvalSuccess && !isSuccess ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        Approval Complete! Executing Swap...
                                    </span>
                                ) : isExecuting || isConfirming ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {isExecuting ? 'Confirming Swap in Wallet...' : 'Processing Swap...'}
                                    </span>
                                ) : isSuccess ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        Swap Successful!
                                    </span>
                                ) : !isConnected ? (
                                    'Connect Wallet'
                                ) : !viewModel.fromToken || !viewModel.toToken ? (
                                    'Select Tokens'
                                ) : !viewModel.fromAmount ? (
                                    'Enter Amount'
                                ) : !viewModel.selectedRouteId ? (
                                    'Select a Route'
                                ) : (
                                    'Execute Swap'
                                )}
                            </button>

                            {/* Transaction Status Messages */}
                            {/* Approval Error */}
                            {approvalError && !swapError && (() => {
                                const errorMsg = getErrorMessage(approvalError);
                                const isUserRejection = errorMsg.includes('cancelled') || errorMsg.includes('rejected');

                                return (
                                    <div className={`mt-3 p-3 border-2 rounded-xl flex items-start gap-2 ${
                                        isUserRejection
                                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                                            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                                    }`}>
                                        <XCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                            isUserRejection
                                                ? 'text-yellow-600 dark:text-yellow-400'
                                                : 'text-red-600 dark:text-red-400'
                                        }`} />
                                        <p className={`text-sm font-semibold ${
                                            isUserRejection
                                                ? 'text-yellow-800 dark:text-yellow-200'
                                                : 'text-red-800 dark:text-red-200'
                                        }`}>
                                            Approval failed: {errorMsg}
                                        </p>
                                    </div>
                                );
                            })()}

                            {/* Swap Error */}
                            {swapError && (() => {
                                const errorMsg = getErrorMessage(swapError);
                                const isUserRejection = errorMsg.includes('cancelled') || errorMsg.includes('rejected');

                                return (
                                    <div className={`mt-3 p-3 border-2 rounded-xl flex items-start gap-2 ${
                                        isUserRejection
                                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                                            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                                    }`}>
                                        <XCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                            isUserRejection
                                                ? 'text-yellow-600 dark:text-yellow-400'
                                                : 'text-red-600 dark:text-red-400'
                                        }`} />
                                        <p className={`text-sm font-semibold ${
                                            isUserRejection
                                                ? 'text-yellow-800 dark:text-yellow-200'
                                                : 'text-red-800 dark:text-red-200'
                                        }`}>
                                            {errorMsg}
                                        </p>
                                    </div>
                                );
                            })()}

                            {/* Approval Success */}
                            {approvalSuccess && approvalTxHash && !isSuccess && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl">
                                    <div className="flex items-start gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold">
                                            Token approved! Now executing swap...
                                        </p>
                                    </div>
                                    <a
                                        href={`https://evm-sidechain.xrpl.org/tx/${approvalTxHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-700 dark:text-blue-300 hover:underline block truncate"
                                    >
                                        View Approval on Explorer: {approvalTxHash}
                                    </a>
                                </div>
                            )}

                            {/* Swap Success */}
                            {isSuccess && txHash && (
                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl">
                                    <div className="flex items-start gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-green-800 dark:text-green-200 font-semibold">
                                            Swap successful!
                                        </p>
                                    </div>
                                    <a
                                        href={`https://evm-sidechain.xrpl.org/tx/${txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-green-700 dark:text-green-300 hover:underline block truncate"
                                    >
                                        View Swap on Explorer: {txHash}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="w-full">
                        <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-2xl transition-all duration-300 flex flex-col shadow-lg hover:shadow-xl">
                            <div className="flex items-center justify-between w-full mb-3 p-6 pb-0">
                            <h2 className="text-2xl font-extrabold">
                              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-400 bg-clip-text text-transparent">
                                Swap Details
                              </span>
                            </h2>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => viewModel.setSwapInfoTab(SwapInfoTab.DETAILS)}
                                        className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105
                                            ${viewModel.swapInfoTab === SwapInfoTab.DETAILS
                                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-500/30"
                                            : "text-gray-500 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 shadow-md"
                                        }`}>
                                        <FileSearch size={18}/>
                                    </button>
                                    <button
                                        onClick={() => viewModel.setSwapInfoTab(SwapInfoTab.ACTIVITY)}
                                        className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105
                                            ${viewModel.swapInfoTab === SwapInfoTab.ACTIVITY
                                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-500/30"
                                            : "text-gray-500 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 shadow-md"
                                        }`}>
                                        <Activity size={18}/>
                                    </button>
                                </div>
                            </div>
                            <div
                                className={`mx-6 mb-4${viewModel.swapInfoTab === SwapInfoTab.DETAILS && (!viewModel.routes.length || !viewModel.fromToken || !viewModel.toToken || !viewModel.fromAmount) ? " min-h-[320px] transition-all duration-200 flex flex-col items-center text-center" : ""
                                }`}>
                                {viewModel.swapInfoTab === SwapInfoTab.DETAILS ? (
                                    <>
                                        {/* Route Type Dropdown + Routes Available text in one line, justify-between */}
                                        {viewModel.routes.length > 0 && viewModel.fromToken && viewModel.toToken && viewModel.fromAmount && (
                                            <div className="w-full flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                        {viewModel.filteredRoutes.length} route{viewModel.filteredRoutes.length !== 1 && "s"} available
                                                    </p>
                                                    {viewModel.isRefreshing && (
                                                        <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                                                    )}
                                                </div>
                                                <div className="relative w-[140px]">
                                                    <Select
                                                        value={viewModel.routeFilter}
                                                        onValueChange={(val) => viewModel.setRouteFilter(val as SwapRouteType)}
                                                        onOpenChange={(open) => viewModel.setRoutesDropdownOpen(open)}>
                                                        <SelectTrigger
                                                            className="w-full border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 focus:ring focus:ring-blue-200 text-xs sm:text-sm relative pr-10 [&>svg]:hidden rounded-md">
                                                            <SelectValue placeholder="Select Route"/>
                                                        </SelectTrigger>
                                                        <ChevronDown
                                                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none ${
                                                                viewModel.routesDropdownOpen ? "rotate-180" : ""
                                                            }`}
                                                        />
                                                        <SelectContent position="popper"
                                                                       className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow rounded-lg">
                                                            {[
                                                                {value: SwapRouteType.ALL, label: "All Routes"},
                                                                {value: SwapRouteType.BEST, label: "Best"},
                                                                {value: SwapRouteType.CHEAPEST, label: "Cheapest"},
                                                                {value: SwapRouteType.FASTEST, label: "Fastest"},
                                                                {value: SwapRouteType.ALTERNATE, label: "Alternate"},
                                                            ].map(({value, label}) => (
                                                                <SelectItem
                                                                    key={value}
                                                                    value={value}
                                                                    className="px-3 py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-800 rounded transition-all"
                                                                >
                                                                    {label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}

                                        {/* Routes View */}
                                        {viewModel.fromToken && viewModel.toToken && viewModel.fromAmount ? (
                                            viewModel.quoteLoading ? (
                                                <div className="w-full p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-300 dark:border-blue-700 shadow-lg">
                                                    <p className="text-blue-800 dark:text-blue-200 font-bold flex items-center gap-3 text-base">
                                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                                        Finding best routes...
                                                    </p>
                                                </div>
                                            ) : viewModel.routes.length > 0 ? (
                                                <>
                                                    <div className="w-full space-y-3">
                                                        {viewModel.filteredRoutes.map((route) => {
                                                            const selected = viewModel.selectedRouteId === route.id;
                                                            return (
                                                                <div key={route.id}
                                                                    className={`w-full flex items-center px-5 py-4 rounded-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                                                                        selected ? "bg-gradient-to-r from-blue-600/20 to-blue-500/20 shadow-2xl ring-4 ring-blue-500 border-2 border-blue-500" : "bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-800 shadow-lg hover:shadow-xl border-2 border-gray-200 dark:border-gray-700"}`}
                                                                    onClick={() => {
                                                                        viewModel.setFee(route.fee);
                                                                        viewModel.setSelectedRouteId(route.id);
                                                                    }}>
                                                                    {/* Circle Icon */}
                                                                    <div
                                                                        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${selected ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-blue-500/50" : "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40"}`}>
                                                                        <Zap
                                                                            className={`w-6 h-6 ${selected ? "text-white" : "text-blue-600 dark:text-blue-400"}`}/>
                                                                    </div>
                                                                    {/* Main Info */}
                                                                    <div className="flex flex-col flex-1 min-w-0 pl-4">
                                                                        <div
                                                                            className="flex items-center justify-between w-full mb-1">
                                                                            <span
                                                                                className={`font-extrabold truncate text-base text-gray-900 dark:text-gray-100`}>{route.dexName || route.provider}</span>
                                                                            <span
                                                                                className={`text-xs font-extrabold ml-2 px-3 py-1 rounded-xl uppercase tracking-wider shadow-md ${selected ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white" : "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-200"}`}>{route.type}
                                                                        </span>
                                                                        </div>
                                                                        <div
                                                                            className="flex items-center justify-between w-full text-sm">
                                                                            <div
                                                                                className={`truncate text-gray-700 dark:text-gray-300 font-semibold`}>
                                                                                Impact&nbsp;<span
                                                                                className={`font-bold ${parseFloat(route.priceImpact) > 5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{route.priceImpact}</span>
                                                                            </div>
                                                                            <div
                                                                                className={`truncate text-right text-blue-800 dark:text-blue-200 font-bold`}>
                                                                                {route.estimatedOutput} {viewModel.toToken}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                    </div>
                                                    {viewModel.filteredRoutes.length === 0 && (
                                                        <div
                                                            className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                                            <p className="text-gray-500 dark:text-gray-400 italic font-medium text-sm text-center">
                                                                No routes matching current filter.
                                                            </p>
                                                        </div>
                                                    )}
                                                </>
                                            ) : viewModel.quoteError ? (
                                                <div
                                                    className="w-full p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                                    <p className="text-red-600 dark:text-red-400 font-semibold text-sm">
                                                        {viewModel.quoteError}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700">
                                                    <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm">Could
                                                        not find a route for the selected tokens.</p>
                                                </div>
                                            )
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 space-y-3">
                                                <div className="relative">
                                                    <div
                                                        className="w-16 h-16 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                                                        <Repeat className="h-8 w-8 text-white"/>
                                                    </div>
                                                </div>
                                                <div className="text-center space-y-1.5 max-w-xs mx-auto">
                                                    <h3 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                                                        Seamless Cross-Chain Swaps
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                                        Swap assets effortlessly across different chains and compare the best routes from multiple providers.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                                        <div className="relative">
                                            <div
                                                className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-800 rounded-full flex items-center justify-center shadow-xl">
                                                <Activity className="h-8 w-8 text-white animate-pulse"/>
                                            </div>
                                        </div>
                                        <div className="text-center space-y-1.5 max-w-xs mx-auto">
                                            <h3 className="text-lg font-bold bg-gradient-to-r from-gray-500 to-gray-700 dark:from-gray-500 dark:to-gray-700 bg-clip-text text-transparent">
                                                No Recent Activity
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                                We could not find any transactions for the selected account.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-center mt-4 mb-0 pb-0">
                <p
                    className="mx-auto max-w-full text-2xl sm:text-3xl md:text-4xl font-black text-center leading-tight tracking-tight mb-0">
                    All{" "}
                    <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-400 bg-clip-text text-transparent drop-shadow-lg">
                        XRPL EVM DEXs.
                    </span>{" "}
                    One{" "}
                    <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-400 bg-clip-text text-transparent drop-shadow-lg">
                        swap.show.
                    </span>
                </p>
            </div>
        </div>
    );
}
