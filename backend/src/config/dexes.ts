import {DexConfig} from '../types/common';

// ============================================================================
// V2 DEX Configurations
// ============================================================================

// Primary V2 DEX on Polkadot EVM Sidechain
export const UNISWAP_V2_FORK1: DexConfig = {
	name: 'Hammy Swap',
	version: 'v2',
	factoryAddress: (process.env.FACTORY_ADDRESS as `0x${string}`) || '',
	routerAddress: (process.env.ROUTER_ADDRESS as `0x${string}`) || '',
	initCodeHash: (process.env.INIT_CODE_HASH as `0x${string}`) || '',
};


// ============================================================================
// V3 DEX Configurations
// ============================================================================

// Surge DEX V3 Configuration (Polkadot EVM Mainnet)
export const UNISWAP_V3_FORK1: DexConfig = {
	name: 'Surge Dex',
	version: 'v3',
	factoryAddress: (process.env.V3_FACTORY_ADDRESS as `0x${string}`) || '',
	quoterAddress: (process.env.V3_QUOTER_ADDRESS as `0x${string}`) || '',
	routerAddress: (process.env.V3_SWAP_ROUTER_ADDRESS as `0x${string}`) || '',
};

// ============================================================================
// All DEXes Registry
// ============================================================================

// Add all DEXes you want to aggregate
export const DEXES: DexConfig[] = [
	UNISWAP_V2_FORK1,
	UNISWAP_V3_FORK1,
];

// Helper to get DEX by name
export function getDexByName(name: string): DexConfig | undefined {
	return DEXES.find((dex) => dex.name === name);
}

// Helper to get all V2 DEXes
export function getV2Dexes(): DexConfig[] {
	return DEXES.filter((dex) => dex.version === 'v2');
}

// Helper to get all V3 DEXes
export function getV3Dexes(): DexConfig[] {
	return DEXES.filter((dex) => dex.version === 'v3');
}
