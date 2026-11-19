import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ArrowLeft, Check, Copy, ExternalLink, RotateCw } from 'lucide-react';
import { getExplorerAddressUrl, getExplorerTxUrl } from '../lib/chain';
import {
  addressesEqual,
  buildGiftLink,
  canReclaimVoucher,
  canSpendVoucher,
  deriveVoucherStatus,
  formatExpiryRemaining,
  formatTokenAmount,
  formatUnixDate,
  getStatusLabel,
  truncateAddress,
  validateSpendInput,
} from '../lib/voucher';
import {
  useNowSeconds,
  useReclaimVoucher,
  useSingleVoucher,
  useSpendVoucher,
} from '../hooks/useGiftstoreContract';
import { VoucherCard, buildVoucherCardStatusProps } from '../components/VoucherCard';
import { WalletGate } from '../components/WalletGate';
import { TxStatusBanner } from '../components/TxStatusBanner';

export function VoucherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected } = useAccount();
  const nowSeconds = useNowSeconds();
  const { data, isLoading, refetch } = useSingleVoucher(id);

  const [cardFace, setCardFace] = useState<'front' | 'back'>('front');
  const [destination, setDestination] = useState('');
  const [spendAmount, setSpendAmount] = useState('');
  const [touched, setTouched] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const voucher = data?.voucher ?? null;
  const spends = data?.spends ?? [];

  const spendTx = useSpendVoucher(voucher?.id, () => {
    setSpendAmount('');
    refetch();
  });

  const reclaimTx = useReclaimVoucher(voucher?.id, () => {
    refetch();
  });

  const spendValidation = useMemo(() => {
    if (!voucher) return null;
    return validateSpendInput({
      destination,
      amount: spendAmount,
      decimals: voucher.decimals,
      remainingAmount: voucher.remainingAmount,
    });
  }, [voucher, destination, spendAmount]);

  const handleSpendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!voucher || !spendValidation?.valid || spendValidation.parsedAmount === null) return;
    try {
      await spendTx.spend(
        spendValidation.parsedAmount,
        destination.trim() as `0x${string}`
      );
    } catch {
      // Handled by TxStatusBanner
    }
  };

  const handleMaxSpend = () => {
    if (!voucher) return;
    const raw = formatTokenAmount(
      voucher.remainingAmount,
      voucher.decimals,
      voucher.decimals
    ).replace(/,/g, '');
    setSpendAmount(raw);
  };

  const handleCopyGiftLink = async () => {
    if (!voucher) return;
    await navigator.clipboard.writeText(buildGiftLink(window.location.origin, voucher.id));
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10 py-14">
        <div className="h-96 rounded-2xl bg-parchment/70 border border-cocoa/10 animate-pulse" />
      </section>
    );
  }

  if (!voucher) {
    return (
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10 py-16">
        <div className="stationery-panel rounded-2xl p-10 sm:p-14 text-center max-w-xl mx-auto space-y-5">
          <h1 className="font-serif text-3xl font-semibold text-cocoa">Voucher not found</h1>
          <p className="text-sm sm:text-base text-cocoa-muted leading-relaxed">
            {!data?.isConfigured
              ? 'The Giftstore contract address is not configured yet. Once deployed and configured, voucher records load directly from Arc.'
              : data?.invalidId
              ? 'That voucher identifier is not valid.'
              : 'No voucher was found at this identifier on Arc.'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/vouchers"
              className="rounded-full bg-crimson hover:bg-crimson-hover text-white text-sm font-semibold px-6 py-3 transition-colors"
            >
              My Vouchers
            </Link>
            <Link
              to="/"
              className="rounded-full border border-cocoa/25 text-cocoa hover:bg-parchment text-sm font-semibold px-6 py-3 transition-colors"
            >
              Back Home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const status = deriveVoucherStatus(voucher, nowSeconds);
  const spendable = canSpendVoucher(voucher, address, nowSeconds);
  const reclaimable = canReclaimVoucher(voucher, address, nowSeconds);
  const isRecipient = addressesEqual(voucher.recipient, address);
  const isSender = addressesEqual(voucher.sender, address);

  return (
    <section className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10 py-12 sm:py-16 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Link
            to="/vouchers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cocoa-muted hover:text-crimson transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to My Vouchers
          </Link>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-cocoa tracking-tight">
            Voucher details
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyGiftLink}
            className="inline-flex items-center gap-1.5 rounded-full border border-cocoa/25 bg-tissue hover:bg-parchment text-cocoa text-xs font-semibold px-4 py-2.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-crimson" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? 'Gift link copied' : 'Copy gift link'}
          </button>
          <Link
            to={`/gift/${voucher.id.toString()}`}
            className="inline-flex items-center rounded-full bg-gold hover:bg-gold-hover text-cocoa text-xs font-semibold px-4 py-2.5 transition-colors whitespace-nowrap shrink-0"
          >
            Unboxing view
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column: Front/Back Voucher Card + Metadata */}
        <div className="lg:col-span-6 space-y-5">
          <VoucherCard
            mode="live"
            face={cardFace}
            {...buildVoucherCardStatusProps(voucher, nowSeconds)}
          />

          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setCardFace((f) => (f === 'front' ? 'back' : 'front'))}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cocoa hover:text-crimson transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              {cardFace === 'front' ? 'Show voucher registry back' : 'Show voucher front'}
            </button>

            <a
              href={getExplorerAddressUrl(voucher.recipient)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-cocoa-muted hover:text-cocoa"
            >
              Recipient on Arcscan
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Voucher Ledger Summary */}
          <div className="stationery-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-cocoa-muted">Status</span>
              <span className="font-semibold text-cocoa">{getStatusLabel(status)}</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-cocoa/8 pt-3">
              <span className="text-cocoa-muted">Remaining balance</span>
              <span className="font-serif font-semibold text-lg tabular-nums text-cocoa">
                {formatTokenAmount(voucher.remainingAmount, voucher.decimals)}{' '}
                {voucher.tokenSymbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-cocoa/8 pt-3">
              <span className="text-cocoa-muted">Original gift</span>
              <span className="tabular-nums text-cocoa">
                {formatTokenAmount(voucher.initialAmount, voucher.decimals)} {voucher.tokenSymbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-cocoa/8 pt-3">
              <span className="text-cocoa-muted">Sender</span>
              <span className="font-mono text-xs text-cocoa">
                {truncateAddress(voucher.sender)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-cocoa/8 pt-3">
              <span className="text-cocoa-muted">Recipient</span>
              <span className="font-mono text-xs text-cocoa">
                {truncateAddress(voucher.recipient)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-cocoa/8 pt-3">
              <span className="text-cocoa-muted">Expiry</span>
              <span className="tabular-nums text-cocoa">
                {formatUnixDate(voucher.expiry)} ({formatExpiryRemaining(voucher.expiry, nowSeconds)})
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Spend / Reclaim Actions + Spend History */}
        <div className="lg:col-span-6 space-y-8">
          {!isConnected ? (
            <WalletGate
              title="Connect your wallet to act on this voucher"
              description="Only the recipient wallet can spend from this voucher, and only the sender can reclaim after expiry."
            />
          ) : spendable ? (
            <form
              onSubmit={handleSpendSubmit}
              noValidate
              className="stationery-panel rounded-2xl p-6 sm:p-8 space-y-5"
            >
              <div className="space-y-1">
                <p className="text-[11px] font-bold tracking-widest uppercase text-crimson">
                  Recipient redemption
                </p>
                <h2 className="font-serif text-2xl font-semibold text-cocoa">
                  Spend from voucher
                </h2>
                <p className="text-sm text-cocoa-muted">
                  Send any amount up to your remaining{' '}
                  <strong className="text-cocoa tabular-nums">
                    {formatTokenAmount(voucher.remainingAmount, voucher.decimals)}{' '}
                    {voucher.tokenSymbol}
                  </strong>{' '}
                  to any destination address.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="spend-destination"
                    className="text-[11px] font-bold tracking-widest uppercase text-cocoa-muted"
                  >
                    Destination wallet address
                  </label>
                  {address && (
                    <button
                      type="button"
                      onClick={() => setDestination(address)}
                      className="text-xs font-semibold text-crimson hover:underline cursor-pointer"
                    >
                      Use my wallet
                    </button>
                  )}
                </div>
                <input
                  id="spend-destination"
                  type="text"
                  placeholder="0x..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-xl bg-[#FAF6EE] border border-cocoa/20 px-4 py-3 text-sm font-mono text-cocoa focus:outline-none focus:border-crimson focus:ring-2 focus:ring-crimson/12"
                />
                {touched && spendValidation?.destinationError && (
                  <p className="text-xs font-medium text-crimson">
                    {spendValidation.destinationError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="spend-amount"
                    className="text-[11px] font-bold tracking-widest uppercase text-cocoa-muted"
                  >
                    Amount ({voucher.tokenSymbol})
                  </label>
                  <button
                    type="button"
                    onClick={handleMaxSpend}
                    className="text-xs font-semibold text-crimson hover:underline cursor-pointer"
                  >
                    Spend all remaining
                  </button>
                </div>
                <input
                  id="spend-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(e.target.value)}
                  className="w-full rounded-xl bg-[#FAF6EE] border border-cocoa/20 px-4 py-3 text-base font-medium tabular-nums text-cocoa focus:outline-none focus:border-crimson focus:ring-2 focus:ring-crimson/12"
                />
                {touched && spendValidation?.amountError && (
                  <p className="text-xs font-medium text-crimson">
                    {spendValidation.amountError}
                  </p>
                )}
              </div>

              <TxStatusBanner
                phase={spendTx.phase}
                hash={spendTx.hash}
                errorMessage={spendTx.errorMessage}
                pendingLabel="Confirm spend in your wallet"
                confirmingLabel="Sending funds on Arc"
                confirmedLabel="Spend confirmed on Arc"
              />

              <button
                type="submit"
                disabled={spendTx.phase === 'pending' || spendTx.phase === 'confirming'}
                className="w-full rounded-full bg-crimson hover:bg-crimson-hover text-white font-semibold text-sm px-8 py-3.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {spendTx.phase === 'pending' || spendTx.phase === 'confirming'
                  ? 'Spending...'
                  : 'Spend from Voucher'}
              </button>
            </form>
          ) : reclaimable ? (
            <div className="stationery-panel rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="space-y-1">
                <p className="text-[11px] font-bold tracking-widest uppercase text-cocoa-muted">
                  Expired voucher
                </p>
                <h2 className="font-serif text-2xl font-semibold text-cocoa">
                  Reclaim remaining balance
                </h2>
                <p className="text-sm text-cocoa-muted">
                  This voucher expired on {formatUnixDate(voucher.expiry)}. As the sender, you can
                  return the remaining{' '}
                  <strong className="text-cocoa tabular-nums">
                    {formatTokenAmount(voucher.remainingAmount, voucher.decimals)}{' '}
                    {voucher.tokenSymbol}
                  </strong>{' '}
                  to your wallet.
                </p>
              </div>

              <TxStatusBanner
                phase={reclaimTx.phase}
                hash={reclaimTx.hash}
                errorMessage={reclaimTx.errorMessage}
                pendingLabel="Confirm reclaim in your wallet"
                confirmingLabel="Reclaiming balance on Arc"
                confirmedLabel="Remaining balance reclaimed"
              />

              <button
                type="button"
                onClick={() => reclaimTx.reclaim()}
                disabled={reclaimTx.phase === 'pending' || reclaimTx.phase === 'confirming'}
                className="w-full rounded-full bg-gold hover:bg-gold-hover text-cocoa font-semibold text-sm px-8 py-3.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {reclaimTx.phase === 'pending' || reclaimTx.phase === 'confirming'
                  ? 'Reclaiming...'
                  : 'Reclaim Remaining Balance'}
              </button>
            </div>
          ) : (
            <div className="stationery-panel rounded-2xl p-6 sm:p-8 space-y-2">
              <h2 className="font-serif text-xl font-semibold text-cocoa">
                {status === 'spent'
                  ? 'Voucher fully spent'
                  : status === 'reclaimed'
                  ? 'Balance reclaimed'
                  : status === 'expired'
                  ? 'Voucher expired'
                  : isSender
                  ? 'Active gift voucher'
                  : 'Recipient-only spending'}
              </h2>
              <p className="text-sm text-cocoa-muted leading-relaxed">
                {status === 'spent'
                  ? 'All funds in this voucher have been redeemed.'
                  : status === 'reclaimed'
                  ? 'The unspent balance was returned to the sender after expiry.'
                  : status === 'expired'
                  ? 'Spending closed after the expiry date. Only the original sender can reclaim any remaining balance.'
                  : isSender
                  ? `Waiting for ${truncateAddress(voucher.recipient)} to spend. Unspent funds become reclaimable after ${formatUnixDate(voucher.expiry)}.`
                  : isRecipient
                  ? 'This voucher cannot currently be spent.'
                  : `Only the recipient wallet (${truncateAddress(voucher.recipient)}) can spend from this voucher.`}
              </p>
            </div>
          )}

          {/* Spend History */}
          <div className="stationery-panel rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="font-serif text-xl font-semibold text-cocoa">Spend history</h2>
            {spends.length === 0 ? (
              <p className="text-sm text-cocoa-muted">
                No spends have been recorded on this voucher yet.
              </p>
            ) : (
              <ul className="divide-y divide-cocoa/10">
                {spends.map((s, idx) => (
                  <li
                    key={`${s.to}-${idx}`}
                    className="py-3.5 flex items-center justify-between gap-4 text-sm"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-mono text-xs text-cocoa">
                        To {truncateAddress(s.to)}
                      </p>
                      <p className="text-xs text-cocoa-muted">
                        {s.timestamp > 0 ? formatUnixDate(s.timestamp) : 'Recorded on chain'}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="font-serif font-semibold text-base tabular-nums text-cocoa">
                        {formatTokenAmount(s.amount, voucher.decimals)} {voucher.tokenSymbol}
                      </p>
                      {s.txHash && (
                        <a
                          href={getExplorerTxUrl(s.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-crimson hover:underline"
                        >
                          Tx
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
