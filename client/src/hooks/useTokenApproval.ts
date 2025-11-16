import { useState } from 'react';
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount
} from 'wagmi';

// ERC20 approve function ABI
const ERC20_APPROVE_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

// Max uint256 for unlimited approval
const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

export interface UseTokenApprovalResult {
  approveToken: (tokenAddress: string, spenderAddress: string, amount?: string) => Promise<void>;
  isApproving: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
  txHash?: `0x${string}`;
  reset: () => void;
}

export function useTokenApproval(): UseTokenApprovalResult {
  const { address } = useAccount();
  const [error, setError] = useState<Error | null>(null);

  const {
    data: txHash,
    writeContract,
    isPending: isApproving,
    error: approveError,
    reset: resetApprove
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const approveToken = async (
    tokenAddress: string,
    spenderAddress: string,
    amount: string = MAX_UINT256
  ) => {
    try {
      setError(null);

      if (!address) {
        throw new Error('Wallet not connected');
      }

      if (!tokenAddress || !spenderAddress) {
        throw new Error('Invalid token or spender address');
      }

      // Call approve function on the ERC20 token contract
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_APPROVE_ABI,
        functionName: 'approve',
        args: [spenderAddress as `0x${string}`, BigInt(amount)],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(errorMessage);
      throw errorMessage;
    }
  };

  const reset = () => {
    resetApprove();
    setError(null);
  };

  // Combine errors from different sources
  const combinedError = error || approveError || confirmError;

  return {
    approveToken,
    isApproving,
    isConfirming,
    isSuccess,
    error: combinedError,
    txHash,
    reset,
  };
}
