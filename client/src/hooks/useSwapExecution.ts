import { useState, useEffect } from 'react';
import {
  useSendTransaction,
  useWaitForTransactionReceipt,
  useAccount
} from 'wagmi';
import { SwapTransaction, ApprovalInfo } from '@/network/types/responses';
import { useTokenApproval } from './useTokenApproval';

export interface UseSwapExecutionResult {
  executeSwap: (transaction: SwapTransaction, approvalInfo?: ApprovalInfo, tokenInAddress?: string) => Promise<void>;
  isExecuting: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
  txHash?: `0x${string}`;
  reset: () => void;
  // Approval-related states
  needsApproval: boolean;
  isApproving: boolean;
  isApprovingConfirming: boolean;
  approvalSuccess: boolean;
  approvalTxHash?: `0x${string}`;
  approvalError: Error | null;
}

export function useSwapExecution(): UseSwapExecutionResult {
  const { address } = useAccount();
  const [error, setError] = useState<Error | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [pendingSwapTx, setPendingSwapTx] = useState<SwapTransaction | null>(null);

  // Approval hook
  const {
    approveToken,
    isApproving,
    isConfirming: isApprovingConfirming,
    isSuccess: approvalSuccess,
    error: approvalError,
    txHash: approvalTxHash,
    reset: resetApproval
  } = useTokenApproval();

  // Swap transaction hook
  const {
    data: txHash,
    sendTransaction,
    isPending: isExecuting,
    error: sendError,
    reset: resetSend
  } = useSendTransaction();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Auto-execute swap after approval succeeds
  useEffect(() => {
    if (approvalSuccess && pendingSwapTx && !isExecuting && !isSuccess) {
      // Approval complete, now execute the swap
      sendTransaction({
        to: pendingSwapTx.to as `0x${string}`,
        data: pendingSwapTx.data as `0x${string}`,
        value: BigInt(pendingSwapTx.value),
      });
      setPendingSwapTx(null);
      setNeedsApproval(false);
    }
  }, [approvalSuccess, pendingSwapTx, isExecuting, isSuccess, sendTransaction]);

  const executeSwap = async (
    transaction: SwapTransaction,
    approvalInfo?: ApprovalInfo,
    tokenInAddress?: string
  ) => {
    try {
      setError(null);

      if (!address) {
        throw new Error('Wallet not connected');
      }

      // Check if approval is needed
      if (approvalInfo && approvalInfo.needed) {
        if (!tokenInAddress) {
          throw new Error('Token address is required for approval');
        }

        setNeedsApproval(true);
        setPendingSwapTx(transaction);

        // Execute approval transaction
        // The spender is the 'to' address in the swap transaction (the DEX router)
        await approveToken(tokenInAddress, transaction.to);

        // The swap will be executed automatically after approval succeeds (via useEffect)
      } else {
        // No approval needed, execute swap directly
        setNeedsApproval(false);
        sendTransaction({
          to: transaction.to as `0x${string}`,
          data: transaction.data as `0x${string}`,
          value: BigInt(transaction.value),
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(errorMessage);
      setPendingSwapTx(null);
      setNeedsApproval(false);
      throw errorMessage;
    }
  };

  const reset = () => {
    resetSend();
    resetApproval();
    setError(null);
    setNeedsApproval(false);
    setPendingSwapTx(null);
  };

  // Combine errors from different sources
  const combinedError = error || sendError || confirmError;

  return {
    executeSwap,
    isExecuting,
    isConfirming,
    isSuccess,
    error: combinedError,
    txHash,
    reset,
    needsApproval,
    isApproving,
    isApprovingConfirming,
    approvalSuccess,
    approvalTxHash,
    approvalError,
  };
}
