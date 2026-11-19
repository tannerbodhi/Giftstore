import { defineChain } from 'viem';

export const ARC_CHAIN_ID = 5042002;
export const ARC_RPC_URL = 'https://rpc.testnet.arc.network';
export const ARC_EXPLORER_URL = 'https://testnet.arcscan.app';

export const arcChain = defineChain({
  id: ARC_CHAIN_ID,
  name: 'Arc',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [ARC_RPC_URL],
    },
    public: {
      http: [ARC_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arcscan',
      url: ARC_EXPLORER_URL,
    },
  },
});

export interface SupportedToken {
  symbol: 'USDC' | 'EURC';
  name: string;
  address: `0x${string}`;
  fallbackDecimals: number;
}

export const SUPPORTED_TOKENS: Record<'USDC' | 'EURC', SupportedToken> = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x3600000000000000000000000000000000000000',
    fallbackDecimals: 6,
  },
  EURC: {
    symbol: 'EURC',
    name: 'Euro Coin',
    address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    fallbackDecimals: 6,
  },
};

export const TOKEN_LIST: SupportedToken[] = [SUPPORTED_TOKENS.USDC, SUPPORTED_TOKENS.EURC];

function sanitizeEnvValue(val: string | undefined): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return '';
  return trimmed;
}

const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;

export const CONTRACT_ADDRESS = sanitizeEnvValue(viteEnv?.VITE_CONTRACT_ADDRESS) as
  | `0x${string}`
  | '';

export const WALLETCONNECT_PROJECT_ID = sanitizeEnvValue(
  viteEnv?.VITE_WALLETCONNECT_PROJECT_ID
);

export const ADMIN_WALLET = sanitizeEnvValue(viteEnv?.VITE_ADMIN_WALLET) as
  | `0x${string}`
  | '';

export function isValidContractAddress(addr: string): addr is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export function getExplorerTxUrl(hash: string): string {
  return `${ARC_EXPLORER_URL}/tx/${hash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${ARC_EXPLORER_URL}/address/${address}`;
}
