import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import type { Abi } from 'viem';
import {
  ARC_CHAIN_ID,
  CONTRACT_ADDRESS,
  SUPPORTED_TOKENS,
  isValidContractAddress,
} from '../lib/chain';
import {
  ERC20_ABI,
  buildCreateArgs,
  buildSpendArgs,
} from '../lib/abi';
import {
  addressesEqual,
  deriveVoucherStatus,
  normalizeRawVoucher,
  type PlatformStats,
  type SpendRecord,
  type VoucherRecord,
} from '../lib/voucher';
import { useGiftstoreAbi } from './useGiftstoreAbi';

export type TxPhase = 'idle' | 'pending' | 'confirming' | 'confirmed' | 'error';

export function useTokenMetadata(tokenAddress: `0x${string}`) {
  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
        chainId: ARC_CHAIN_ID,
      },
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'symbol',
        chainId: ARC_CHAIN_ID,
      },
    ],
  });

  const decimalsRaw = data?.[0]?.result;
  const symbolRaw = data?.[1]?.result;

  const fallback =
    addressesEqual(tokenAddress, SUPPORTED_TOKENS.EURC.address)
      ? SUPPORTED_TOKENS.EURC
      : SUPPORTED_TOKENS.USDC;

  return {
    decimals: typeof decimalsRaw === 'number' ? decimalsRaw : fallback.fallbackDecimals,
    symbol: typeof symbolRaw === 'string' ? symbolRaw : fallback.symbol,
    isLoading,
  };
}

export function useTokenBalanceAndAllowance(tokenAddress: `0x${string}`) {
  const { address } = useAccount();
  const contractAddr = isValidContractAddress(CONTRACT_ADDRESS) ? CONTRACT_ADDRESS : undefined;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: ARC_CHAIN_ID,
      },
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: address && contractAddr ? [address, contractAddr] : undefined,
        chainId: ARC_CHAIN_ID,
      },
    ],
    query: {
      enabled: Boolean(address),
    },
  });

  return {
    balance: typeof data?.[0]?.result === 'bigint' ? data[0].result : undefined,
    allowance: typeof data?.[1]?.result === 'bigint' ? data[1].result : undefined,
    isLoading,
    refetch,
  };
}

export function usePlatformStats() {
  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID });
  const { resolved, isConfigured } = useGiftstoreAbi();

  return useQuery<PlatformStats & { isConfigured: boolean }>({
    queryKey: ['giftstore-stats', CONTRACT_ADDRESS, resolved.source],
    enabled: Boolean(publicClient),
    refetchInterval: 30_000,
    queryFn: async () => {
      if (!isConfigured || !isValidContractAddress(CONTRACT_ADDRESS) || !publicClient) {
        return {
          totalVouchers: 0,
          activeVouchers: 0,
          totalSpends: 0,
          isConfigured: false,
        };
      }

      if (resolved.getStatsFn) {
        try {
          const result = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: resolved.abi,
            functionName: resolved.getStatsFn.name,
          });
          if (Array.isArray(result)) {
            return {
              totalVouchers: Number(result[0] ?? 0),
              activeVouchers: Number(result[1] ?? 0),
              totalSpends: Number(result[2] ?? 0),
              isConfigured: true,
            };
          }
          if (result && typeof result === 'object') {
            const obj = result as Record<string, unknown>;
            return {
              totalVouchers: Number(obj.totalVouchers ?? obj.total ?? 0),
              activeVouchers: Number(obj.activeVouchers ?? obj.active ?? 0),
              totalSpends: Number(obj.totalSpends ?? obj.spends ?? 0),
              isConfigured: true,
            };
          }
        } catch {
          // Fall through to totalVouchersFn
        }
      }

      if (resolved.totalVouchersFn) {
        try {
          const countRaw = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: resolved.abi,
            functionName: resolved.totalVouchersFn.name,
          });
          const count = Number(countRaw ?? 0);
          return {
            totalVouchers: count,
            activeVouchers: 0,
            totalSpends: 0,
            isConfigured: true,
          };
        } catch {
          // Fall through
        }
      }

      return {
        totalVouchers: 0,
        activeVouchers: 0,
        totalSpends: 0,
        isConfigured: true,
      };
    },
  });
}

async function resolveTokenMetaFromChain(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  tokenAddr: string
): Promise<{ symbol: 'USDC' | 'EURC' | 'TOKEN'; decimals: number }> {
  if (addressesEqual(tokenAddr, SUPPORTED_TOKENS.USDC.address)) {
    try {
      const dec = await publicClient.readContract({
        address: SUPPORTED_TOKENS.USDC.address,
        abi: ERC20_ABI,
        functionName: 'decimals',
      });
      return { symbol: 'USDC', decimals: Number(dec) };
    } catch {
      return { symbol: 'USDC', decimals: 6 };
    }
  }
  if (addressesEqual(tokenAddr, SUPPORTED_TOKENS.EURC.address)) {
    try {
      const dec = await publicClient.readContract({
        address: SUPPORTED_TOKENS.EURC.address,
        abi: ERC20_ABI,
        functionName: 'decimals',
      });
      return { symbol: 'EURC', decimals: Number(dec) };
    } catch {
      return { symbol: 'EURC', decimals: 6 };
    }
  }
  return { symbol: 'TOKEN', decimals: 6 };
}

export function useUserVouchers() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID });
  const { resolved, isConfigured } = useGiftstoreAbi();

  return useQuery<{
    received: VoucherRecord[];
    sent: VoucherRecord[];
    isConfigured: boolean;
  }>({
    queryKey: ['user-vouchers', address, CONTRACT_ADDRESS, resolved.source],
    enabled: Boolean(address) && Boolean(publicClient),
    queryFn: async () => {
      if (!address || !isConfigured || !isValidContractAddress(CONTRACT_ADDRESS) || !publicClient) {
        return { received: [], sent: [], isConfigured };
      }
      const contractAddress: `0x${string}` = CONTRACT_ADDRESS;

      const [usdcMeta, eurcMeta] = await Promise.all([
        resolveTokenMetaFromChain(publicClient, SUPPORTED_TOKENS.USDC.address),
        resolveTokenMetaFromChain(publicClient, SUPPORTED_TOKENS.EURC.address),
      ]);

      const metaResolver = (addr: string) => {
        if (addressesEqual(addr, SUPPORTED_TOKENS.EURC.address)) return eurcMeta;
        if (addressesEqual(addr, SUPPORTED_TOKENS.USDC.address)) return usdcMeta;
        return { symbol: 'TOKEN' as const, decimals: 6 };
      };

      const fetchIds = async (fnName: string | undefined): Promise<bigint[]> => {
        if (!fnName) return [];
        try {
          const res = await publicClient.readContract({
            address: contractAddress,
            abi: resolved.abi,
            functionName: fnName,
            args: [address],
          });
          return Array.isArray(res) ? res.map((x) => BigInt(x as bigint | number | string)) : [];
        } catch {
          return [];
        }
      };

      const [recipientIds, senderIds] = await Promise.all([
        fetchIds(resolved.getRecipientVouchersFn?.name),
        fetchIds(resolved.getSenderVouchersFn?.name),
      ]);

      const fetchVouchersByIds = async (ids: bigint[]): Promise<VoucherRecord[]> => {
        if (!resolved.getVoucherFn || ids.length === 0) return [];
        const list = await Promise.all(
          ids.map(async (id) => {
            try {
              const raw = await publicClient.readContract({
                address: contractAddress,
                abi: resolved.abi,
                functionName: resolved.getVoucherFn!.name,
                args: [id],
              });
              return normalizeRawVoucher(raw, id, metaResolver);
            } catch {
              return null;
            }
          })
        );
        return list
          .filter((v): v is VoucherRecord => v !== null)
          .sort((a, b) => Number(b.id - a.id));
      };

      const [received, sent] = await Promise.all([
        fetchVouchersByIds(recipientIds),
        fetchVouchersByIds(senderIds),
      ]);

      return { received, sent, isConfigured: true };
    },
  });
}

export function useSingleVoucher(voucherIdRaw: string | undefined) {
  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID });
  const { resolved, isConfigured } = useGiftstoreAbi();

  const parsedId =
    voucherIdRaw && /^\d+$/.test(voucherIdRaw.trim()) ? BigInt(voucherIdRaw.trim()) : null;

  return useQuery<{
    voucher: VoucherRecord | null;
    spends: SpendRecord[];
    isConfigured: boolean;
    invalidId: boolean;
  }>({
    queryKey: ['single-voucher', voucherIdRaw, CONTRACT_ADDRESS, resolved.source],
    enabled: Boolean(publicClient),
    queryFn: async () => {
      if (parsedId === null) {
        return { voucher: null, spends: [], isConfigured, invalidId: true };
      }
      if (!isConfigured || !isValidContractAddress(CONTRACT_ADDRESS) || !publicClient) {
        return { voucher: null, spends: [], isConfigured: false, invalidId: false };
      }

      if (!resolved.getVoucherFn) {
        return { voucher: null, spends: [], isConfigured: true, invalidId: false };
      }

      try {
        const raw = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: resolved.abi,
          functionName: resolved.getVoucherFn.name,
          args: [parsedId],
        });

        const [usdcMeta, eurcMeta] = await Promise.all([
          resolveTokenMetaFromChain(publicClient, SUPPORTED_TOKENS.USDC.address),
          resolveTokenMetaFromChain(publicClient, SUPPORTED_TOKENS.EURC.address),
        ]);

        const voucher = normalizeRawVoucher(raw, parsedId, (addr) => {
          if (addressesEqual(addr, SUPPORTED_TOKENS.EURC.address)) return eurcMeta;
          if (addressesEqual(addr, SUPPORTED_TOKENS.USDC.address)) return usdcMeta;
          return { symbol: 'TOKEN', decimals: 6 };
        });

        let spends: SpendRecord[] = [];
        if (voucher && resolved.getSpendHistoryFn) {
          try {
            const rawSpends = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: resolved.abi,
              functionName: resolved.getSpendHistoryFn.name,
              args: [parsedId],
            });
            if (Array.isArray(rawSpends)) {
              spends = rawSpends.map((item) => {
                const rec = item as Record<string, unknown>;
                const arr = Array.isArray(item) ? item : null;
                return {
                  to: String(rec.to ?? rec.destination ?? (arr ? arr[0] : '')) as `0x${string}`,
                  amount: BigInt((rec.amount ?? (arr ? arr[1] : 0n)) as bigint | number | string),
                  timestamp: Number(rec.timestamp ?? (arr ? arr[2] : 0) ?? 0),
                };
              });
            }
          } catch {
            // Fall back to event logs if available
          }
        }

        if (voucher && spends.length === 0 && resolved.spendEvent) {
          try {
            const logs = await publicClient.getLogs({
              address: CONTRACT_ADDRESS,
              event: resolved.spendEvent,
              args: { voucherId: parsedId } as Record<string, unknown>,
              fromBlock: 0n,
              toBlock: 'latest',
            });
            spends = logs.map((log) => {
              const args = (log as unknown as { args?: Record<string, unknown> }).args ?? {};
              return {
                to: String(args.to ?? args.recipient ?? '0x0') as `0x${string}`,
                amount: BigInt((args.amount ?? 0n) as bigint | number | string),
                timestamp: 0,
                txHash: log.transactionHash,
              };
            });
          } catch {
            // Ignore log read errors on RPCs with range caps
          }
        }

        return { voucher, spends, isConfigured: true, invalidId: false };
      } catch {
        return { voucher: null, spends: [], isConfigured: true, invalidId: false };
      }
    },
  });
}

export function useContractTxState() {
  const {
    data: hash,
    writeContractAsync,
    isPending: isSigning,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    chainId: ARC_CHAIN_ID,
  });

  const phase: TxPhase = writeError || receiptError
    ? 'error'
    : isConfirmed
    ? 'confirmed'
    : isConfirming
    ? 'confirming'
    : isSigning
    ? 'pending'
    : 'idle';

  const errorMessage =
    (writeError as { shortMessage?: string } | null)?.shortMessage ||
    writeError?.message ||
    (receiptError as { shortMessage?: string } | null)?.shortMessage ||
    receiptError?.message ||
    null;

  return {
    hash,
    receipt,
    phase,
    errorMessage,
    writeContractAsync,
    resetWrite,
  };
}

export function useApproveToken(tokenAddress: `0x${string}`, onConfirmed?: () => void) {
  const tx = useContractTxState();

  useEffect(() => {
    if (tx.phase === 'confirmed' && onConfirmed) {
      onConfirmed();
    }
  }, [tx.phase, onConfirmed]);

  const approve = useCallback(
    async (amount: bigint) => {
      if (!isValidContractAddress(CONTRACT_ADDRESS)) {
        throw new Error('Contract address is not configured.');
      }
      tx.resetWrite();
      return tx.writeContractAsync({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, amount],
        chainId: ARC_CHAIN_ID,
      });
    },
    [tokenAddress, tx]
  );

  return { ...tx, approve };
}

export function useCreateVoucher(onConfirmed?: (createdId: bigint | null) => void) {
  const { resolved } = useGiftstoreAbi();
  const tx = useContractTxState();
  const queryClient = useQueryClient();
  const [createdVoucherId, setCreatedVoucherId] = useState<bigint | null>(null);

  useEffect(() => {
    if (tx.phase === 'confirmed' && tx.receipt) {
      let foundId: bigint | null = null;
      for (const log of tx.receipt.logs) {
        if (log.topics.length >= 2 && log.topics[1]) {
          try {
            foundId = BigInt(log.topics[1]);
            break;
          } catch {
            // continue
          }
        }
      }
      setCreatedVoucherId(foundId);
      queryClient.invalidateQueries({ queryKey: ['user-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['giftstore-stats'] });
      onConfirmed?.(foundId);
    }
  }, [tx.phase, tx.receipt, queryClient, onConfirmed]);

  const createVoucher = useCallback(
    async (params: {
      recipient: `0x${string}`;
      token: `0x${string}`;
      amount: bigint;
      expiry: bigint;
      message: string;
    }) => {
      if (!isValidContractAddress(CONTRACT_ADDRESS)) {
        throw new Error('Contract address is not configured.');
      }
      if (!resolved.createFn) {
        throw new Error('Create function not found in contract ABI.');
      }
      tx.resetWrite();
      setCreatedVoucherId(null);
      const args = buildCreateArgs(resolved.createFn, params);
      return tx.writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: resolved.abi as Abi,
        functionName: resolved.createFn.name,
        args,
        chainId: ARC_CHAIN_ID,
      });
    },
    [resolved, tx]
  );

  return { ...tx, createdVoucherId, createVoucher };
}

export function useSpendVoucher(voucherId: bigint | undefined, onConfirmed?: () => void) {
  const { resolved } = useGiftstoreAbi();
  const tx = useContractTxState();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (tx.phase === 'confirmed') {
      queryClient.invalidateQueries({ queryKey: ['single-voucher'] });
      queryClient.invalidateQueries({ queryKey: ['user-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['giftstore-stats'] });
      onConfirmed?.();
    }
  }, [tx.phase, queryClient, onConfirmed]);

  const spend = useCallback(
    async (amount: bigint, to: `0x${string}`) => {
      if (voucherId === undefined) throw new Error('Missing voucher ID.');
      if (!isValidContractAddress(CONTRACT_ADDRESS)) {
        throw new Error('Contract address is not configured.');
      }
      if (!resolved.spendFn) {
        throw new Error('Spend function not found in contract ABI.');
      }
      tx.resetWrite();
      const args = buildSpendArgs(resolved.spendFn, { voucherId, amount, to });
      return tx.writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: resolved.abi as Abi,
        functionName: resolved.spendFn.name,
        args,
        chainId: ARC_CHAIN_ID,
      });
    },
    [voucherId, resolved, tx]
  );

  return { ...tx, spend };
}

export function useReclaimVoucher(voucherId: bigint | undefined, onConfirmed?: () => void) {
  const { resolved } = useGiftstoreAbi();
  const tx = useContractTxState();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (tx.phase === 'confirmed') {
      queryClient.invalidateQueries({ queryKey: ['single-voucher'] });
      queryClient.invalidateQueries({ queryKey: ['user-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['giftstore-stats'] });
      onConfirmed?.();
    }
  }, [tx.phase, queryClient, onConfirmed]);

  const reclaim = useCallback(async () => {
    if (voucherId === undefined) throw new Error('Missing voucher ID.');
    if (!isValidContractAddress(CONTRACT_ADDRESS)) {
      throw new Error('Contract address is not configured.');
    }
    if (!resolved.reclaimFn) {
      throw new Error('Reclaim function not found in contract ABI.');
    }
    tx.resetWrite();
    return tx.writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: resolved.abi as Abi,
      functionName: resolved.reclaimFn.name,
      args: [voucherId],
      chainId: ARC_CHAIN_ID,
    });
  }, [voucherId, resolved, tx]);

  return { ...tx, reclaim };
}

export function useNowSeconds(): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function useActiveVoucherCount(vouchers: VoucherRecord[]): number {
  const now = useNowSeconds();
  return vouchers.filter((v) => {
    const st = deriveVoucherStatus(v, now);
    return st === 'active' || st === 'partially-spent';
  }).length;
}
