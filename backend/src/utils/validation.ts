import { Address, isAddress, getAddress } from 'viem';

/**
 * Validate and normalize an Ethereum address
 */
export function validateAddress(address: string): Address {
  if (!isAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  return getAddress(address);
}

/**
 * Validate multiple addresses
 */
export function validateAddresses(addresses: string[]): Address[] {
  return addresses.map(validateAddress);
}

/**
 * Check if address is zero address
 */
export function isZeroAddress(address: string): boolean {
  return address === '0x0000000000000000000000000000000000000000';
}

/**
 * Validate that a value is positive
 */
export function validatePositive(value: bigint, name: string = 'Value'): void {
  if (value <= 0n) {
    throw new Error(`${name} must be positive, got: ${value}`);
  }
}

/**
 * Validate token path for swaps
 */
export function validatePath(path: string[]): void {
  if (path.length < 2) {
    throw new Error('Path must contain at least 2 addresses');
  }
  validateAddresses(path);
}

/**
 * Validate reserves are not zero
 */
export function validateReserves(reserve0: bigint, reserve1: bigint): void {
  if (reserve0 === 0n || reserve1 === 0n) {
    throw new Error('Insufficient liquidity: one or both reserves are zero');
  }
}
