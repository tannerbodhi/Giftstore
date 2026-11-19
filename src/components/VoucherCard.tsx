import { WaxSeal } from './WaxSeal';
import {
  deriveVoucherStatus,
  formatExpiryRemaining,
  formatTokenAmount,
  formatUnixDate,
  getStatusLabel,
  truncateAddress,
  type VoucherStatus,
} from '../lib/voucher';

interface LiveVoucherCardProps {
  mode: 'live';
  voucherId?: string;
  tokenSymbol: string;
  formattedAmount: string;
  formattedInitialAmount?: string;
  recipient?: string;
  sender?: string;
  expirySeconds?: number;
  nowSeconds: number;
  message?: string;
  status?: VoucherStatus;
  face?: 'front' | 'back';
  className?: string;
}

interface IllustrationVoucherCardProps {
  mode: 'illustration';
  className?: string;
}

type VoucherCardProps = LiveVoucherCardProps | IllustrationVoucherCardProps;

export function VoucherCard(props: VoucherCardProps) {
  if (props.mode === 'illustration') {
    return (
      <div
        aria-label="Gift voucher stationery illustration"
        className={`relative rounded-2xl kraft-surface p-4 sm:p-5 voucher-card-lifted border border-cocoa/15 ${props.className ?? ''}`}
      >
        {/* Inner Stationery Card resting inside Kraft sleeve */}
        <div className="relative rounded-2xl bg-tissue border border-cocoa/12 p-6 sm:p-8 overflow-hidden">
          {/* Debossed inner border frame */}
          <div className="pointer-events-none absolute inset-2.5 rounded-xl border border-cocoa/12" />

          {/* Vertical Grosgrain Ribbon Strap */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 right-6 sm:right-8 w-5 sm:w-6 grosgrain-ribbon opacity-95"
          />

          <div className="relative z-10 pr-14 sm:pr-16 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center rounded-full bg-gold px-3.5 py-1 text-xs font-semibold tracking-wider uppercase text-cocoa">
                USDC · EURC
              </span>
              <span className="text-xs font-medium tracking-widest uppercase text-cocoa-muted">
                Built on Arc
              </span>
            </div>

            <div className="space-y-2.5 py-2">
              <p className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-cocoa">
                On-chain Gift Voucher
              </p>
              <p className="text-sm leading-relaxed text-cocoa-muted max-w-sm">
                Stablecoin value wrapped with an expiry rule and an optional personal note.
              </p>
            </div>

            {/* Pure layout stationery rule lines (zero invented amounts, names, or addresses) */}
            <div className="space-y-3 pt-2 border-t border-cocoa/10">
              <div className="flex items-center justify-between gap-3 text-xs text-cocoa-muted">
                <span className="uppercase tracking-widest font-semibold">Recipient</span>
                <span className="h-2 w-24 sm:w-28 rounded-full bg-parchment border border-cocoa/10" />
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-cocoa-muted">
                <span className="uppercase tracking-widest font-semibold">Redemption</span>
                <span className="text-cocoa font-medium text-right">Single or partial spends</span>
              </div>
            </div>
          </div>

          {/* Wax seal anchored on ribbon */}
          <div className="absolute right-3 sm:right-4 bottom-5 z-20">
            <WaxSeal variant="gold" size="md" ariaLabel="Giftstore wax seal" />
          </div>
        </div>
      </div>
    );
  }

  const {
    voucherId,
    tokenSymbol,
    formattedAmount,
    formattedInitialAmount,
    recipient,
    sender,
    expirySeconds,
    nowSeconds,
    message,
    status = 'active',
    face = 'front',
    className = '',
  } = props;

  if (face === 'back') {
    return (
      <div
        className={`relative rounded-2xl kraft-surface border border-cocoa/20 p-6 sm:p-8 voucher-card-elevation text-cocoa overflow-hidden ${className}`}
      >
        <div className="pointer-events-none absolute inset-2.5 rounded-xl border border-cocoa/15" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between border-b border-cocoa/15 pb-4">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-cocoa/75">
                Voucher Registry
              </p>
              <p className="font-serif text-xl font-semibold text-cocoa mt-0.5">
                {voucherId ? `Voucher #${voucherId}` : 'Draft Voucher'}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-tissue px-3 py-1 text-xs font-semibold text-cocoa border border-cocoa/15">
              {getStatusLabel(status)}
            </span>
          </div>

          {/* Clean Stationery Cutout Metadata Grid */}
          <div className="rounded-xl bg-tissue/95 border border-cocoa/12 p-5 space-y-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-cocoa-muted">Remaining balance</span>
              <span className="font-serif font-semibold text-lg tabular-nums text-cocoa">
                {formattedAmount} {tokenSymbol}
              </span>
            </div>
            {formattedInitialAmount && (
              <div className="flex items-center justify-between text-sm border-t border-cocoa/8 pt-3">
                <span className="text-cocoa-muted">Original amount</span>
                <span className="font-medium tabular-nums text-cocoa">
                  {formattedInitialAmount} {tokenSymbol}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm border-t border-cocoa/8 pt-3">
              <span className="text-cocoa-muted">Recipient</span>
              <span className="font-mono text-xs text-cocoa">
                {recipient ? truncateAddress(recipient) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-cocoa/8 pt-3">
              <span className="text-cocoa-muted">Sender</span>
              <span className="font-mono text-xs text-cocoa">
                {sender ? truncateAddress(sender) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-cocoa/8 pt-3">
              <span className="text-cocoa-muted">Expiry date</span>
              <span className="font-medium tabular-nums text-cocoa">
                {expirySeconds ? formatUnixDate(expirySeconds) : '—'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-cocoa/80 pt-1">
            <span>Available on Arc</span>
            <span className="tabular-nums">
              {expirySeconds ? formatExpiryRemaining(expirySeconds, nowSeconds) : ''}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl bg-tissue border border-cocoa/15 p-6 sm:p-8 voucher-card-elevation text-cocoa overflow-hidden ${className}`}
    >
      {/* Debossed inner stationery frame */}
      <div className="pointer-events-none absolute inset-2.5 rounded-xl border border-cocoa/12" />

      {/* Grosgrain Crimson Ribbon */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 bottom-0 right-6 sm:right-8 w-5 sm:w-6 grosgrain-ribbon"
      />

      <div className="relative z-10 pr-14 sm:pr-16 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-gold px-3.5 py-1 text-xs font-bold tracking-wider uppercase text-cocoa">
            {tokenSymbol}
          </span>
          <span className="text-xs font-semibold tracking-wider uppercase text-cocoa-muted">
            {voucherId ? `#${voucherId} · ` : ''}
            {getStatusLabel(status)}
          </span>
        </div>

        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-cocoa-muted">
            Voucher balance
          </p>
          <p className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-cocoa tabular-nums mt-1">
            {formattedAmount}{' '}
            <span className="text-xl sm:text-2xl font-medium text-cocoa-muted">{tokenSymbol}</span>
          </p>
        </div>

        {message ? (
          <blockquote className="font-serif italic text-base text-cocoa/90 leading-relaxed border-t border-b border-cocoa/10 py-3">
            “{message}”
          </blockquote>
        ) : (
          <div className="border-t border-cocoa/10 pt-3" />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-cocoa-muted">
          <div>
            <span className="uppercase tracking-wider font-semibold block text-[10px]">
              For
            </span>
            <span className="font-mono text-cocoa text-xs">
              {recipient ? truncateAddress(recipient) : 'Recipient address'}
            </span>
          </div>
          <div className="text-right">
            <span className="uppercase tracking-wider font-semibold block text-[10px]">
              Expires
            </span>
            <span className="text-cocoa font-medium tabular-nums">
              {expirySeconds ? formatExpiryRemaining(expirySeconds, nowSeconds) : 'Select expiry'}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute right-3.5 sm:right-5 bottom-5 z-20">
        <WaxSeal variant="gold" size="sm" ariaLabel="Voucher wax seal" />
      </div>
    </div>
  );
}

export function buildVoucherCardStatusProps(
  v: {
    id: bigint;
    sender: `0x${string}`;
    recipient: `0x${string}`;
    tokenSymbol: string;
    decimals: number;
    initialAmount: bigint;
    remainingAmount: bigint;
    expiry: number;
    message: string;
    reclaimed: boolean;
  },
  nowSeconds: number
) {
  return {
    voucherId: v.id.toString(),
    tokenSymbol: v.tokenSymbol,
    formattedAmount: formatTokenAmount(v.remainingAmount, v.decimals),
    formattedInitialAmount: formatTokenAmount(v.initialAmount, v.decimals),
    recipient: v.recipient,
    sender: v.sender,
    expirySeconds: v.expiry,
    nowSeconds,
    message: v.message,
    status: deriveVoucherStatus(v, nowSeconds),
  };
}
