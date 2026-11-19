import type { Abi, AbiEvent, AbiFunction } from 'viem';
import { ARC_EXPLORER_URL, isValidContractAddress } from './chain';

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export const GIFTSTORE_DEFAULT_ABI = [
  {
    type: 'function',
    name: 'createVoucher',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
      { name: 'message', type: 'string' },
    ],
    outputs: [{ name: 'voucherId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'spendVoucher',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'voucherId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'to', type: 'address' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'reclaimVoucher',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'voucherId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getVoucher',
    stateMutability: 'view',
    inputs: [{ name: 'voucherId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'sender', type: 'address' },
          { name: 'recipient', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'initialAmount', type: 'uint256' },
          { name: 'remainingAmount', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'expiry', type: 'uint256' },
          { name: 'message', type: 'string' },
          { name: 'reclaimed', type: 'bool' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getVouchersBySender',
    stateMutability: 'view',
    inputs: [{ name: 'sender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getVouchersByRecipient',
    stateMutability: 'view',
    inputs: [{ name: 'recipient', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getSpendHistory',
    stateMutability: 'view',
    inputs: [{ name: 'voucherId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getStats',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'totalVouchers', type: 'uint256' },
      { name: 'activeVouchers', type: 'uint256' },
      { name: 'totalSpends', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'VoucherCreated',
    inputs: [
      { name: 'voucherId', type: 'uint256', indexed: true },
      { name: 'sender', type: 'address', indexed: true },
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'expiry', type: 'uint256', indexed: false },
      { name: 'message', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'VoucherSpent',
    inputs: [
      { name: 'voucherId', type: 'uint256', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'remaining', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'VoucherReclaimed',
    inputs: [
      { name: 'voucherId', type: 'uint256', indexed: true },
      { name: 'sender', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;

export interface ResolvedContractAbi {
  abi: Abi;
  source: 'explorer' | 'fallback';
  createFn: AbiFunction | null;
  spendFn: AbiFunction | null;
  reclaimFn: AbiFunction | null;
  getVoucherFn: AbiFunction | null;
  getSenderVouchersFn: AbiFunction | null;
  getRecipientVouchersFn: AbiFunction | null;
  getSpendHistoryFn: AbiFunction | null;
  getStatsFn: AbiFunction | null;
  totalVouchersFn: AbiFunction | null;
  spendEvent: AbiEvent | null;
  createdEvent: AbiEvent | null;
  reclaimedEvent: AbiEvent | null;
}

function getFunctions(abi: Abi): AbiFunction[] {
  return abi.filter((item): item is AbiFunction => item.type === 'function');
}

function getEvents(abi: Abi): AbiEvent[] {
  return abi.filter((item): item is AbiEvent => item.type === 'event');
}

function findFn(
  fns: AbiFunction[],
  mutability: 'view' | 'nonpayable',
  patterns: RegExp[]
): AbiFunction | null {
  const candidates = fns.filter((fn) =>
    mutability === 'view'
      ? fn.stateMutability === 'view' || fn.stateMutability === 'pure'
      : fn.stateMutability === 'nonpayable' || fn.stateMutability === 'payable'
  );
  for (const pat of patterns) {
    const match = candidates.find((fn) => pat.test(fn.name));
    if (match) return match;
  }
  return null;
}

function findEvent(events: AbiEvent[], patterns: RegExp[]): AbiEvent | null {
  for (const pat of patterns) {
    const match = events.find((ev) => pat.test(ev.name));
    if (match) return match;
  }
  return null;
}

export function resolveContractAbi(
  abi: Abi,
  source: 'explorer' | 'fallback' = 'fallback'
): ResolvedContractAbi {
  const fns = getFunctions(abi);
  const events = getEvents(abi);

  return {
    abi,
    source,
    createFn: findFn(fns, 'nonpayable', [
      /^createvoucher$/i,
      /^issuevoucher$/i,
      /^mintvoucher$/i,
      /create.*voucher/i,
      /^create$/i,
    ]),
    spendFn: findFn(fns, 'nonpayable', [
      /^spendvoucher$/i,
      /^spend$/i,
      /^redeemvoucher$/i,
      /^redeem$/i,
      /spend/i,
    ]),
    reclaimFn: findFn(fns, 'nonpayable', [
      /^reclaimvoucher$/i,
      /^reclaim$/i,
      /^refundvoucher$/i,
      /^refund$/i,
      /reclaim|refund/i,
    ]),
    getVoucherFn: findFn(fns, 'view', [
      /^getvoucher$/i,
      /^voucher$/i,
      /^vouchers$/i,
      /^getgift$/i,
    ]),
    getSenderVouchersFn: findFn(fns, 'view', [
      /^getvouchersbysender$/i,
      /^vouchersbysender$/i,
      /^getsendervouchers$/i,
      /^sendervouchers$/i,
      /sender.*voucher/i,
    ]),
    getRecipientVouchersFn: findFn(fns, 'view', [
      /^getvouchersbyrecipient$/i,
      /^vouchersbyrecipient$/i,
      /^getrecipientvouchers$/i,
      /^recipientvouchers$/i,
      /recipient.*voucher/i,
    ]),
    getSpendHistoryFn: findFn(fns, 'view', [
      /^getspendhistory$/i,
      /^spendhistory$/i,
      /^getspends$/i,
      /^spends$/i,
      /spend.*history/i,
    ]),
    getStatsFn: findFn(fns, 'view', [
      /^getstats$/i,
      /^stats$/i,
      /^getplatformstats$/i,
      /^platformstats$/i,
      /stats/i,
    ]),
    totalVouchersFn: findFn(fns, 'view', [
      /^totalvouchers$/i,
      /^vouchercount$/i,
      /^nextvoucherid$/i,
      /^totaltickets$/i,
    ]),
    createdEvent: findEvent(events, [/^vouchercreated$/i, /^created$/i, /created/i]),
    spendEvent: findEvent(events, [
      /^voucherspent$/i,
      /^spent$/i,
      /^spend$/i,
      /^redeemed$/i,
      /spent|spend|redeem/i,
    ]),
    reclaimedEvent: findEvent(events, [/^voucherreclaimed$/i, /^reclaimed$/i, /reclaim/i]),
  };
}

export async function fetchDeployedContractAbi(address: string): Promise<ResolvedContractAbi> {
  if (!isValidContractAddress(address)) {
    return resolveContractAbi(GIFTSTORE_DEFAULT_ABI as unknown as Abi, 'fallback');
  }

  // Try Blockscout v2 smart-contracts endpoint first
  try {
    const res = await fetch(`${ARC_EXPLORER_URL}/api/v2/smart-contracts/${address}`);
    if (res.ok) {
      const json = (await res.json()) as { abi?: Abi };
      if (Array.isArray(json.abi) && json.abi.length > 0) {
        return resolveContractAbi(json.abi, 'explorer');
      }
    }
  } catch {
    // Fall through to legacy endpoint
  }

  // Try Etherscan-compatible getabi endpoint
  try {
    const res = await fetch(
      `${ARC_EXPLORER_URL}/api?module=contract&action=getabi&address=${address}`
    );
    if (res.ok) {
      const json = (await res.json()) as { status?: string; result?: string };
      if (json.status === '1' && json.result) {
        const parsed = JSON.parse(json.result) as Abi;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return resolveContractAbi(parsed, 'explorer');
        }
      }
    }
  } catch {
    // Fall through to typed fallback
  }

  return resolveContractAbi(GIFTSTORE_DEFAULT_ABI as unknown as Abi, 'fallback');
}

export function buildCreateArgs(
  fn: AbiFunction,
  params: {
    recipient: `0x${string}`;
    token: `0x${string}`;
    amount: bigint;
    expiry: bigint;
    message: string;
  }
): unknown[] {
  return fn.inputs.map((input, idx) => {
    const name = (input.name || '').toLowerCase();
    const type = input.type;
    if (type === 'address') {
      if (name.includes('token') || name.includes('asset') || name.includes('currency')) {
        return params.token;
      }
      if (name.includes('recipient') || name.includes('to') || name.includes('receiver')) {
        return params.recipient;
      }
      return idx === 0 ? params.recipient : params.token;
    }
    if (type.startsWith('uint')) {
      if (name.includes('expir') || name.includes('deadline') || name.includes('duration') || name.includes('valid')) {
        return params.expiry;
      }
      if (name.includes('amount') || name.includes('value')) {
        return params.amount;
      }
      return idx <= 2 ? params.amount : params.expiry;
    }
    if (type === 'string') {
      return params.message;
    }
    return undefined;
  });
}

export function buildSpendArgs(
  fn: AbiFunction,
  params: {
    voucherId: bigint;
    amount: bigint;
    to: `0x${string}`;
  }
): unknown[] {
  return fn.inputs.map((input, idx) => {
    const name = (input.name || '').toLowerCase();
    const type = input.type;
    if (type === 'address') {
      return params.to;
    }
    if (type.startsWith('uint')) {
      if (name.includes('amount') || name.includes('value')) {
        return params.amount;
      }
      if (name.includes('id') || name.includes('voucher')) {
        return params.voucherId;
      }
      return idx === 0 ? params.voucherId : params.amount;
    }
    return undefined;
  });
}
