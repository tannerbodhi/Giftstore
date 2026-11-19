import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Check, Copy, ExternalLink } from 'lucide-react';
import {
  CONTRACT_ADDRESS,
  SUPPORTED_TOKENS,
  TOKEN_LIST,
  isValidContractAddress,
} from '../lib/chain';
import {
  buildGiftLink,
  computeExpiryTimestamp,
  formatTokenAmount,
  formatUnixDate,
  needsTokenApproval,
  validateCreateVoucherInput,
} from '../lib/voucher';
import {
  useApproveToken,
  useCreateVoucher,
  useNowSeconds,
  useTokenBalanceAndAllowance,
  useTokenMetadata,
} from '../hooks/useGiftstoreContract';
import { VoucherCard } from '../components/VoucherCard';
import { WalletGate } from '../components/WalletGate';
import { TxStatusBanner } from '../components/TxStatusBanner';

const EXPIRY_PRESETS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '180 days', days: 180 },
];

export function CreateVoucherPage() {
  const { isConnected } = useAccount();
  const nowSeconds = useNowSeconds();
  const hasContract = isValidContractAddress(CONTRACT_ADDRESS);

  const [selectedSymbol, setSelectedSymbol] = useState<'USDC' | 'EURC'>('USDC');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [expiryMode, setExpiryMode] = useState<'preset' | 'custom'>('preset');
  const [presetDays, setPresetDays] = useState(30);
  const [customDate, setCustomDate] = useState('');
  const [message, setMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [touched, setTouched] = useState(false);

  const token = SUPPORTED_TOKENS[selectedSymbol];
  const tokenMeta = useTokenMetadata(token.address);
  const { balance, allowance, isLoading: balanceLoading, refetch: refetchAllowance } =
    useTokenBalanceAndAllowance(token.address);

  const approveTx = useApproveToken(token.address, () => {
    refetchAllowance();
  });
  const createTx = useCreateVoucher();

  const expiryTimestamp = useMemo(() => {
    if (expiryMode === 'custom' && customDate) {
      const ms = Date.parse(`${customDate}T23:59:59`);
      if (!Number.isNaN(ms)) return Math.floor(ms / 1000);
    }
    return computeExpiryTimestamp(presetDays, nowSeconds);
  }, [expiryMode, customDate, presetDays, nowSeconds]);

  const validation = useMemo(
    () =>
      validateCreateVoucherInput({
        recipient,
        amount,
        decimals: tokenMeta.decimals,
        balance,
        expiryTimestamp,
        nowSeconds,
      }),
    [recipient, amount, tokenMeta.decimals, balance, expiryTimestamp, nowSeconds]
  );

  const requiresApproval = needsTokenApproval(allowance, validation.parsedAmount);

  const handleMax = () => {
    if (balance === undefined) return;
    const raw = formatTokenAmount(balance, tokenMeta.decimals, tokenMeta.decimals).replace(
      /,/g,
      ''
    );
    setAmount(raw);
  };

  const handleApprove = async () => {
    setTouched(true);
    if (!validation.valid || validation.parsedAmount === null) return;
    try {
      await approveTx.approve(validation.parsedAmount);
    } catch {
      // Error surfaced via approveTx.errorMessage
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!validation.valid || validation.parsedAmount === null) return;
    if (requiresApproval) {
      await handleApprove();
      return;
    }
    try {
      await createTx.createVoucher({
        recipient: recipient.trim() as `0x${string}`,
        token: token.address,
        amount: validation.parsedAmount,
        expiry: BigInt(expiryTimestamp),
        message: message.trim(),
      });
    } catch {
      // Error surfaced via createTx.errorMessage
    }
  };

  const createdGiftLink =
    createTx.createdVoucherId !== null
      ? buildGiftLink(window.location.origin, createTx.createdVoucherId)
      : null;

  const handleCopyGiftLink = async () => {
    if (!createdGiftLink) return;
    await navigator.clipboard.writeText(createdGiftLink);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <section className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10 py-12 sm:py-16 space-y-10">
      <div className="space-y-2 max-w-2xl">
        <p className="text-xs font-bold tracking-widest uppercase text-crimson">New gift</p>
        <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-cocoa tracking-tight">
          Create a voucher
        </h1>
        <p className="text-sm sm:text-base text-cocoa-muted leading-relaxed">
          Choose USDC or EURC, name the recipient wallet, and seal your voucher on Arc.
        </p>
      </div>

      {!isConnected ? (
        <WalletGate
          title="Connect your wallet to wrap a voucher"
          description="Wallet balances, token allowances, and voucher creation are available once your wallet is connected."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Stationery Form */}
          <form
            onSubmit={handleCreate}
            noValidate
            className="lg:col-span-7 stationery-panel rounded-2xl p-6 sm:p-8 space-y-6"
          >
            {!hasContract && (
              <div className="rounded-xl border border-cocoa/15 bg-parchment px-4 py-3 text-xs sm:text-sm text-cocoa">
                Giftstore contract address is not set in environment configuration yet. Once
                configured, transactions execute directly on Arc.
              </div>
            )}

            {/* Token Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold tracking-widest uppercase text-cocoa-muted">
                  Currency
                </label>
                <span className="text-xs text-cocoa-muted tabular-nums">
                  Balance:{' '}
                  <strong className="text-cocoa font-semibold">
                    {balanceLoading
                      ? 'Loading...'
                      : balance !== undefined
                      ? `${formatTokenAmount(balance, tokenMeta.decimals)} ${tokenMeta.symbol}`
                      : '—'}
                  </strong>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {TOKEN_LIST.map((item) => {
                  const active = item.symbol === selectedSymbol;
                  return (
                    <button
                      key={item.symbol}
                      type="button"
                      onClick={() => {
                        setSelectedSymbol(item.symbol);
                        approveTx.resetWrite();
                      }}
                      className={`rounded-xl px-4 py-3 text-left border transition-all cursor-pointer ${
                        active
                          ? 'bg-parchment border-crimson shadow-[0_0_0_1px_rgba(179,18,58,0.2)]'
                          : 'bg-[#FAF6EE] border-cocoa/18 hover:border-cocoa/35'
                      }`}
                    >
                      <span className="block font-serif text-lg font-semibold text-cocoa">
                        {item.symbol}
                      </span>
                      <span className="block text-xs text-cocoa-muted">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipient Address */}
            <div className="space-y-1.5">
              <label
                htmlFor="voucher-recipient"
                className="block text-[11px] font-bold tracking-widest uppercase text-cocoa-muted"
              >
                Recipient wallet address
              </label>
              <input
                id="voucher-recipient"
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full rounded-xl bg-[#FAF6EE] border border-cocoa/20 px-4 py-3 text-sm font-mono text-cocoa placeholder:text-cocoa-muted/60 focus:outline-none focus:border-crimson focus:ring-2 focus:ring-crimson/12"
              />
              {touched && validation.recipientError && (
                <p className="text-xs font-medium text-crimson">{validation.recipientError}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="voucher-amount"
                  className="block text-[11px] font-bold tracking-widest uppercase text-cocoa-muted"
                >
                  Amount ({tokenMeta.symbol})
                </label>
                {balance !== undefined && (
                  <button
                    type="button"
                    onClick={handleMax}
                    className="text-xs font-semibold text-crimson hover:underline cursor-pointer"
                  >
                    Use max
                  </button>
                )}
              </div>
              <input
                id="voucher-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl bg-[#FAF6EE] border border-cocoa/20 px-4 py-3 text-base font-medium tabular-nums text-cocoa placeholder:text-cocoa-muted/60 focus:outline-none focus:border-crimson focus:ring-2 focus:ring-crimson/12"
              />
              {touched && validation.amountError && (
                <p className="text-xs font-medium text-crimson">{validation.amountError}</p>
              )}
            </div>

            {/* Expiry */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold tracking-widest uppercase text-cocoa-muted">
                  Expiry
                </label>
                <span className="text-xs text-cocoa-muted tabular-nums">
                  Reclaimable after {formatUnixDate(expiryTimestamp)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {EXPIRY_PRESETS.map((p) => {
                  const active = expiryMode === 'preset' && presetDays === p.days;
                  return (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => {
                        setExpiryMode('preset');
                        setPresetDays(p.days);
                      }}
                      className={`rounded-full px-4 py-2 text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-cocoa text-tissue border-cocoa'
                          : 'bg-[#FAF6EE] text-cocoa border-cocoa/18 hover:border-cocoa/40'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setExpiryMode('custom')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    expiryMode === 'custom'
                      ? 'bg-cocoa text-tissue border-cocoa'
                      : 'bg-[#FAF6EE] text-cocoa border-cocoa/18 hover:border-cocoa/40'
                  }`}
                >
                  Custom date
                </button>
              </div>
              {expiryMode === 'custom' && (
                <input
                  type="date"
                  aria-label="Custom expiry date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="mt-2 w-full rounded-xl bg-[#FAF6EE] border border-cocoa/20 px-4 py-2.5 text-sm text-cocoa focus:outline-none focus:border-crimson"
                />
              )}
              {touched && validation.expiryError && (
                <p className="text-xs font-medium text-crimson">{validation.expiryError}</p>
              )}
            </div>

            {/* Optional Note */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="voucher-note"
                  className="block text-[11px] font-bold tracking-widest uppercase text-cocoa-muted"
                >
                  Personal note (optional)
                </label>
                <span className="text-xs text-cocoa-muted tabular-nums">{message.length}/200</span>
              </div>
              <textarea
                id="voucher-note"
                rows={3}
                maxLength={200}
                placeholder="Write a brief message for the recipient..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl bg-[#FAF6EE] border border-cocoa/20 px-4 py-3 text-sm text-cocoa placeholder:text-cocoa-muted/60 focus:outline-none focus:border-crimson focus:ring-2 focus:ring-crimson/12 resize-none"
              />
            </div>

            {/* Approval & Creation Tx Status */}
            <TxStatusBanner
              phase={approveTx.phase}
              hash={approveTx.hash}
              errorMessage={approveTx.errorMessage}
              pendingLabel={`Approve ${tokenMeta.symbol} in your wallet`}
              confirmingLabel={`Confirming ${tokenMeta.symbol} approval on Arc`}
              confirmedLabel={`${tokenMeta.symbol} approved`}
            />

            <TxStatusBanner
              phase={createTx.phase}
              hash={createTx.hash}
              errorMessage={createTx.errorMessage}
              pendingLabel="Confirm voucher creation in your wallet"
              confirmingLabel="Sealing voucher on Arc"
              confirmedLabel="Voucher created on Arc"
            />

            {/* Created Gift Link Panel */}
            {createTx.phase === 'confirmed' && createdGiftLink && (
              <div className="rounded-xl kraft-surface border border-cocoa/15 p-4 space-y-3">
                <p className="text-xs font-bold tracking-widest uppercase text-cocoa">
                  Ready to share
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    aria-label="Shareable gift link"
                    value={createdGiftLink}
                    className="flex-1 rounded-lg bg-tissue border border-cocoa/15 px-3 py-2 text-xs font-mono text-cocoa"
                  />
                  <button
                    type="button"
                    onClick={handleCopyGiftLink}
                    className="inline-flex items-center gap-1.5 rounded-full bg-crimson text-white text-xs font-semibold px-4 py-2 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copied' : 'Copy link'}
                  </button>
                </div>
                {createTx.createdVoucherId !== null && (
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <Link
                      to={`/gift/${createTx.createdVoucherId.toString()}`}
                      className="inline-flex items-center gap-1 text-cocoa hover:text-crimson"
                    >
                      Preview Gift Opened
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to={`/voucher/${createTx.createdVoucherId.toString()}`}
                      className="inline-flex items-center gap-1 text-cocoa hover:text-crimson"
                    >
                      Open Voucher Detail
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Submit Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {requiresApproval ? (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={
                    !hasContract ||
                    approveTx.phase === 'pending' ||
                    approveTx.phase === 'confirming'
                  }
                  className="rounded-full bg-gold hover:bg-gold-hover text-cocoa font-semibold text-sm px-8 py-3.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                >
                  {approveTx.phase === 'pending' || approveTx.phase === 'confirming'
                    ? `Approving ${tokenMeta.symbol}...`
                    : `1. Approve ${tokenMeta.symbol}`}
                </button>
              ) : null}

              <button
                type="submit"
                disabled={
                  !hasContract ||
                  requiresApproval ||
                  createTx.phase === 'pending' ||
                  createTx.phase === 'confirming'
                }
                className="rounded-full bg-crimson hover:bg-crimson-hover text-white font-semibold text-sm px-8 py-3.5 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              >
                {createTx.phase === 'pending' || createTx.phase === 'confirming'
                  ? 'Creating Voucher...'
                  : requiresApproval
                  ? '2. Create Voucher'
                  : 'Create Voucher'}
              </button>
            </div>
          </form>

          {/* Right Column: Live Tactile Card Preview */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <p className="text-[11px] font-bold tracking-widest uppercase text-cocoa-muted">
              Stationery preview
            </p>
            <VoucherCard
              mode="live"
              tokenSymbol={tokenMeta.symbol}
              formattedAmount={amount.trim() ? amount.trim() : '0.00'}
              recipient={recipient.trim() || undefined}
              expirySeconds={expiryTimestamp}
              nowSeconds={nowSeconds}
              message={message.trim() || undefined}
              status="active"
            />
          </div>
        </div>
      )}
    </section>
  );
}
