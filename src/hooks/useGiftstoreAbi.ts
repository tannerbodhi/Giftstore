import { useQuery } from '@tanstack/react-query';
import { CONTRACT_ADDRESS, isValidContractAddress } from '../lib/chain';
import {
  GIFTSTORE_DEFAULT_ABI,
  fetchDeployedContractAbi,
  resolveContractAbi,
  type ResolvedContractAbi,
} from '../lib/abi';
import type { Abi } from 'viem';

const FALLBACK_RESOLVED = resolveContractAbi(
  GIFTSTORE_DEFAULT_ABI as unknown as Abi,
  'fallback'
);

export function useGiftstoreAbi(): {
  resolved: ResolvedContractAbi;
  isLoading: boolean;
  isConfigured: boolean;
} {
  const isConfigured = isValidContractAddress(CONTRACT_ADDRESS);

  const query = useQuery({
    queryKey: ['giftstore-abi', CONTRACT_ADDRESS],
    queryFn: () => fetchDeployedContractAbi(CONTRACT_ADDRESS),
    enabled: isConfigured,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  return {
    resolved: query.data ?? FALLBACK_RESOLVED,
    isLoading: isConfigured && query.isLoading,
    isConfigured,
  };
}
