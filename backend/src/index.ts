import 'dotenv/config';

// Export all services
export { V2Service } from './services/v2Service';
export { V3Service } from './services/v3Service';
export { createProvider, createProviderWithRpc } from './services/provider';

// Export types
export * from './types/common';
export * from './types/v2';
export * from './types/v3';

// Export configurations
export * from './config/chains';
export * from './config/dexes';
export * from './config/tokens';

// Export utilities
export * from './utils/calculations';
export * from './utils/formatting';
export * from './utils/validation';

// Export ABIs
export { V2_FACTORY_ABI } from './contracts/abis/v2Factory';
export { V2_PAIR_ABI } from './contracts/abis/v2Pair';
export { V2_ROUTER_ABI } from './contracts/abis/v2Router';
export { V3_FACTORY_ABI } from './contracts/abis/v3Factory';
export { V3_POOL_ABI } from './contracts/abis/v3Pool';
export { V3_QUOTER_ABI } from './contracts/abis/v3Quoter';
export { ERC20_ABI } from './contracts/abis/erc20';

console.log('Polkadot EVM DEX SDK (V2 & V3) loaded successfully!');
