import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import {
  addressesEqual,
  canSpendVoucher,
  formatTokenAmount,
  formatUnixDate,
  truncateAddress,
} from '../lib/voucher';
import { useNowSeconds, useSingleVoucher } from '../hooks/useGiftstoreContract';
import { WaxSeal } from '../components/WaxSeal';
import { VoucherCard, buildVoucherCardStatusProps } from '../components/VoucherCard';

export function GiftOpenedPage() {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected } = useAccount();
  const nowSeconds = useNowSeconds();
  const { data, isLoading } = useSingleVoucher(id);

  const [opened, setOpened] = useState(false);

  const voucher = data?.voucher ?? null;

  if (isLoading) {
    return (
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10 py-16">
        <div className="h-[420px] rounded-2xl bg-parchment/70 border border-cocoa/10 animate-pulse" />
      </section>
    );
  }

  if (!voucher) {
    return (
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10 py-16">
        <div className="stationery-panel rounded-2xl p-10 sm:p-14 text-center max-w-xl mx-auto space-y-5">
          <h1 className="font-serif text-3xl font-semibold text-cocoa">Gift link unavailable</h1>
          <p className="text-sm sm:text-base text-cocoa-muted leading-relaxed">
            {!data?.isConfigured
              ? 'The Giftstore contract address is not configured yet. Once deployed and configured, shared voucher links open here.'
              : 'No voucher was found for this gift link on Arc.'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/"
              className="rounded-full bg-crimson hover:bg-crimson-hover text-white text-sm font-semibold px-6 py-3 transition-colors"
            >
              Back Home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const spendable = canSpendVoucher(voucher, address, nowSeconds);
  const isRecipient = addressesEqual(voucher.recipient, address);

  return (
    <section className="kraft-surface min-h-[calc(100vh-12rem)] py-12 sm:py-20 text-cocoa border-b border-cocoa/15">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left: Interactive Unboxing Sleeve / Revealed Card */}
          <div className="lg:col-span-6">
            <AnimatePresence mode="wait">
              {!opened ? (
                <motion.div
                  key="sealed-envelope"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="relative rounded-2xl bg-tissue border border-cocoa/15 p-8 sm:p-12 voucher-card-lifted overflow-hidden min-h-[360px] flex flex-col items-center justify-center text-center"
                >
                  {/* Debossed inner border */}
                  <div className="pointer-events-none absolute inset-3 rounded-xl border border-cocoa/12" />

                  {/* Horizontal & Vertical Grosgrain Ribbons */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-7 grosgrain-ribbon opacity-90"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-7 grosgrain-ribbon-h opacity-90"
                  />

                  <div className="relative z-10 flex flex-col items-center gap-5 bg-tissue/95 px-6 py-5 rounded-2xl border border-cocoa/10 shadow-sm">
                    <WaxSeal
                      variant="gold"
                      size="lg"
                      interactive
                      cracked={opened}
                      onClick={() => setOpened(true)}
                      ariaLabel="Open gift voucher"
                    />
                    <div className="space-y-1">
                      <p className="font-serif text-xl font-semibold text-cocoa">
                        Voucher #{voucher.id.toString()}
                      </p>
                      <p className="text-xs font-semibold tracking-widest uppercase text-crimson">
                        Click seal to open
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="opened-card"
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <VoucherCard
                    mode="live"
                    {...buildVoucherCardStatusProps(voucher, nowSeconds)}
                    className="voucher-card-lifted"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Unboxing Invitation & Redemption Controls */}
          <div className="lg:col-span-6 space-y-6 bg-tissue rounded-2xl border border-cocoa/15 p-8 sm:p-10 voucher-card-elevation">
            <p className="text-xs font-bold tracking-widest uppercase text-crimson">
              {opened ? 'Gift opened' : 'A gift for you'}
            </p>
            <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-cocoa tracking-tight text-balance">
              {opened ? 'Your voucher is ready' : 'You received a Giftstore voucher'}
            </h1>

            {!opened ? (
              <div className="space-y-6">
                <p className="text-base text-cocoa-muted leading-relaxed">
                  Sent by <span className="font-mono text-cocoa">{truncateAddress(voucher.sender)}</span>{' '}
                  for recipient{' '}
                  <span className="font-mono text-cocoa">{truncateAddress(voucher.recipient)}</span>.
                  Break the wax seal to reveal the enclosed balance and note.
                </p>
                <button
                  type="button"
                  onClick={() => setOpened(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-crimson hover:bg-crimson-hover text-white text-sm font-semibold px-8 py-3.5 transition-all cursor-pointer"
                >
                  Open Gift
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl bg-parchment border border-cocoa/10 p-5 space-y-2">
                  <p className="text-xs font-bold tracking-widest uppercase text-cocoa-muted">
                    Available balance
                  </p>
                  <p className="font-serif text-3xl font-semibold text-cocoa tabular-nums">
                    {formatTokenAmount(voucher.remainingAmount, voucher.decimals)}{' '}
                    {voucher.tokenSymbol}
                  </p>
                  <p className="text-xs text-cocoa-muted">
                    Valid until {formatUnixDate(voucher.expiry)}
                  </p>
                </div>

                {voucher.message && (
                  <blockquote className="font-serif italic text-lg text-cocoa leading-relaxed border-t border-b border-cocoa/12 py-4">
                    “{voucher.message}”
                  </blockquote>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {!isConnected ? (
                    <ConnectButton.Custom>
                      {({ openConnectModal, mounted }) => (
                        <button
                          type="button"
                          onClick={openConnectModal}
                          disabled={!mounted}
                          className="inline-flex items-center gap-2 rounded-full bg-crimson hover:bg-crimson-hover text-white text-sm font-semibold px-7 py-3.5 transition-all cursor-pointer"
                        >
                          Connect Wallet to Spend
                        </button>
                      )}
                    </ConnectButton.Custom>
                  ) : spendable ? (
                    <Link
                      to={`/voucher/${voucher.id.toString()}`}
                      className="inline-flex items-center gap-2 rounded-full bg-crimson hover:bg-crimson-hover text-white text-sm font-semibold px-7 py-3.5 transition-all"
                    >
                      Spend from Voucher
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : !isRecipient ? (
                    <p className="text-xs text-cocoa-muted">
                      Spending is reserved for recipient{' '}
                      <span className="font-mono text-cocoa">
                        {truncateAddress(voucher.recipient)}
                      </span>
                      .
                    </p>
                  ) : null}

                  <Link
                    to={`/voucher/${voucher.id.toString()}`}
                    className="inline-flex items-center rounded-full border-[1.5px] border-cocoa text-cocoa hover:bg-parchment text-sm font-semibold px-6 py-3.5 transition-colors"
                  >
                    View Voucher Details
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
