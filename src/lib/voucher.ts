export type VoucherStatus =
  | 'active'
  | 'partially-spent'
  | 'spent'
  | 'expired'
  | 'reclaimed';

export interface VoucherRecord {
  id: bigint;
  sender: `0x${string}`;
  recipient: `0x${string}`;
  token: `0x${string}`;
  tokenSymbol: 'USDC' | 'EURC' | 'TOKEN';
  decimals: number;
  initialAmount: bigint;
  remainingAmount: bigint;
  createdAt: number;
  expiry: number;
  message: string;
  reclaimed: boolean;
}

export interface SpendRecord {
  to: `0x${string}`;
  amount: bigint;
  timestamp: number;
  txHash?: string;
}

export interface PlatformStats {
  totalVouchers: number;
  activeVouchers: number;
  totalSpends: number;
}

export function isValidAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function addressesEqual(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

export function truncateAddress(address: string, head = 6, tail = 4): string {
  if (!address || address.length <= head + tail + 2) return address;
  return `${address.slice(0, head)}...${address.slice(-tail)}`;
}

/**
 * Pure BigInt decimal parser using actual token decimals.
 * Returns null when input is empty, invalid, or exceeds allowed decimal precision.
 */
export function parseTokenAmount(raw: string, decimals: number): bigint | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;

  const [wholePart, fracPart = ''] = cleaned.split('.');
  if (fracPart.length > decimals) return null;

  const paddedFrac = fracPart.padEnd(decimals, '0');
  const combined = `${wholePart}${paddedFrac}`.replace(/^0+/, '') || '0';
  return BigInt(combined);
}

/**
 * Formats a raw token bigint into a clean human-readable string using actual token decimals.
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  maxFractionDigits = 2
): string {
  const negative = amount < 0n;
  const abs = negative ? -amount : amount;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const remainder = abs % divisor;

  const wholeFormatted = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (decimals === 0 || maxFractionDigits === 0) {
    return `${negative ? '-' : ''}${wholeFormatted}`;
  }

  const fracFull = remainder.toString().padStart(decimals, '0');
  const shownDecimals = Math.min(decimals, Math.max(2, maxFractionDigits));
  let frac = fracFull.slice(0, shownDecimals);

  // If amount is non-zero but smaller than 0.01, show up to token decimals
  if (whole === 0n && remainder > 0n && BigInt(frac) === 0n) {
    frac = fracFull.replace(/0+$/, '');
  } else {
    // Keep at least 2 decimal places for stablecoins, trim trailing zeros beyond 2
    const minTwo = frac.slice(0, 2);
    const extra = frac.slice(2).replace(/0+$/, '');
    frac = `${minTwo}${extra}`;
  }

  return `${negative ? '-' : ''}${wholeFormatted}.${frac}`;
}

export function deriveVoucherStatus(
  voucher: Pick<VoucherRecord, 'initialAmount' | 'remainingAmount' | 'expiry' | 'reclaimed'>,
  nowSeconds: number
): VoucherStatus {
  if (voucher.reclaimed) return 'reclaimed';
  if (voucher.remainingAmount === 0n) return 'spent';
  if (voucher.expiry > 0 && nowSeconds >= voucher.expiry) return 'expired';
  if (voucher.remainingAmount < voucher.initialAmount) return 'partially-spent';
  return 'active';
}

export function getStatusLabel(status: VoucherStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'partially-spent':
      return 'Partially spent';
    case 'spent':
      return 'Spent';
    case 'expired':
      return 'Expired';
    case 'reclaimed':
      return 'Reclaimed';
  }
}

export function canSpendVoucher(
  voucher: VoucherRecord,
  connectedAddress: string | undefined,
  nowSeconds: number
): boolean {
  if (!connectedAddress) return false;
  if (!addressesEqual(voucher.recipient, connectedAddress)) return false;
  const status = deriveVoucherStatus(voucher, nowSeconds);
  return status === 'active' || status === 'partially-spent';
}

export function canReclaimVoucher(
  voucher: VoucherRecord,
  connectedAddress: string | undefined,
  nowSeconds: number
): boolean {
  if (!connectedAddress) return false;
  if (!addressesEqual(voucher.sender, connectedAddress)) return false;
  if (voucher.reclaimed) return false;
  if (voucher.remainingAmount === 0n) return false;
  return voucher.expiry > 0 && nowSeconds >= voucher.expiry;
}

export function computeExpiryTimestamp(daysFromNow: number, nowSeconds: number): number {
  const clampedDays = Math.max(1, Math.floor(daysFromNow));
  return nowSeconds + clampedDays * 86400;
}

export function formatExpiryRemaining(expirySeconds: number, nowSeconds: number): string {
  if (expirySeconds <= 0) return 'No expiry';
  const diff = expirySeconds - nowSeconds;
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${Math.max(1, mins)}m left`;
}

export function formatUnixDate(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  const d = new Date(seconds * 1000);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function needsTokenApproval(
  allowance: bigint | undefined,
  requiredAmount: bigint | null
): boolean {
  if (requiredAmount === null || requiredAmount <= 0n) return false;
  if (allowance === undefined) return true;
  return allowance < requiredAmount;
}

export interface CreateVoucherValidation {
  valid: boolean;
  recipientError?: string;
  amountError?: string;
  expiryError?: string;
  parsedAmount: bigint | null;
}

export function validateCreateVoucherInput(input: {
  recipient: string;
  amount: string;
  decimals: number;
  balance?: bigint;
  expiryTimestamp: number;
  nowSeconds: number;
}): CreateVoucherValidation {
  let recipientError: string | undefined;
  let amountError: string | undefined;
  let expiryError: string | undefined;

  if (!input.recipient.trim()) {
    recipientError = 'Enter a recipient wallet address.';
  } else if (!isValidAddress(input.recipient)) {
    recipientError = 'Enter a valid 0x wallet address.';
  }

  const parsedAmount = parseTokenAmount(input.amount, input.decimals);
  if (!input.amount.trim()) {
    amountError = 'Enter an amount to lock in the voucher.';
  } else if (parsedAmount === null || parsedAmount <= 0n) {
    amountError = `Enter a valid amount with up to ${input.decimals} decimal places.`;
  } else if (input.balance !== undefined && parsedAmount > input.balance) {
    amountError = 'Amount exceeds your wallet balance.';
  }

  if (!input.expiryTimestamp || input.expiryTimestamp <= input.nowSeconds) {
    expiryError = 'Expiry must be in the future.';
  }

  return {
    valid: !recipientError && !amountError && !expiryError && parsedAmount !== null,
    recipientError,
    amountError,
    expiryError,
    parsedAmount,
  };
}

export interface SpendValidation {
  valid: boolean;
  destinationError?: string;
  amountError?: string;
  parsedAmount: bigint | null;
}

export function validateSpendInput(input: {
  destination: string;
  amount: string;
  decimals: number;
  remainingAmount: bigint;
}): SpendValidation {
  let destinationError: string | undefined;
  let amountError: string | undefined;

  if (!input.destination.trim()) {
    destinationError = 'Enter a destination address.';
  } else if (!isValidAddress(input.destination)) {
    destinationError = 'Enter a valid 0x destination address.';
  }

  const parsedAmount = parseTokenAmount(input.amount, input.decimals);
  if (!input.amount.trim()) {
    amountError = 'Enter an amount to spend.';
  } else if (parsedAmount === null || parsedAmount <= 0n) {
    amountError = `Enter a valid amount with up to ${input.decimals} decimal places.`;
  } else if (parsedAmount > input.remainingAmount) {
    amountError = 'Amount exceeds remaining voucher balance.';
  }

  return {
    valid: !destinationError && !amountError && parsedAmount !== null,
    destinationError,
    amountError,
    parsedAmount,
  };
}

export function buildGiftLink(origin: string, voucherId: bigint | string | number): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  return `${cleanOrigin}/gift/${voucherId.toString()}`;
}

export function normalizeRawVoucher(
  raw: unknown,
  fallbackId: bigint,
  tokenMetaResolver: (addr: string) => { symbol: 'USDC' | 'EURC' | 'TOKEN'; decimals: number }
): VoucherRecord | null {
  if (!raw) return null;

  const obj = raw as Record<string, unknown>;
  const arr = Array.isArray(raw) ? raw : null;

  const id = BigInt((obj.id ?? (arr ? arr[0] : fallbackId) ?? fallbackId) as bigint | number | string);
  const sender = String(obj.sender ?? (arr ? arr[1] : '')) as `0x${string}`;
  const recipient = String(obj.recipient ?? (arr ? arr[2] : '')) as `0x${string}`;
  const token = String(obj.token ?? (arr ? arr[3] : '')) as `0x${string}`;
  const initialAmount = BigInt((obj.initialAmount ?? obj.amount ?? (arr ? arr[4] : 0n)) as bigint | number | string);
  const remainingAmount = BigInt((obj.remainingAmount ?? obj.balance ?? (arr ? arr[5] : 0n)) as bigint | number | string);
  const createdAt = Number(obj.createdAt ?? (arr ? arr[6] : 0) ?? 0);
  const expiry = Number(obj.expiry ?? obj.expiresAt ?? (arr ? arr[7] : 0) ?? 0);
  const message = String(obj.message ?? obj.note ?? (arr ? arr[8] : '') ?? '');
  const reclaimed = Boolean(obj.reclaimed ?? (arr ? arr[9] : false));

  if (!isValidAddress(sender) || sender === '0x0000000000000000000000000000000000000000') {
    return null;
  }

  const meta = tokenMetaResolver(token);

  return {
    id,
    sender,
    recipient,
    token,
    tokenSymbol: meta.symbol,
    decimals: meta.decimals,
    initialAmount,
    remainingAmount,
    createdAt,
    expiry,
    message,
    reclaimed,
  };
}
