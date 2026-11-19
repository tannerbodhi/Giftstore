import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ArrowRight, Check, Copy } from 'lucide-react';
import {
  buildGiftLink,
  canReclaimVoucher,
  canSpendVoucher,
  deriveVoucherStatus,
  type VoucherRecord,
} from '../lib/voucher';
import { useNowSeconds, useUserVouchers } from '../hooks/useGiftstoreContract';
import { VoucherCard, buildVoucherCardStatusProps } from '../components/VoucherCard';
import { WalletGate } from '../components/WalletGate';

type FolderTab = 'received' | 'sent';
type StatusFilter = 'all' | 'active' | 'spent' | 'expired';

export function MyVouchersPage() {
  const { address, isConnected } = useAccount();
  const nowSeconds = useNowSeconds();
  const { data, isLoading } = useUserVouchers();

  const [tab, setTab] = useState<FolderTab>('received');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rawList: VoucherRecord[] = useMemo(() => {
    if (!data) return [];
    return tab === 'received' ? data.received : data.sent;
  }, [data, tab]);

  const filteredList = useMemo(() => {
    return rawList.filter((v) => {
      if (statusFilter === 'all') return true;
      const status = deriveVoucherStatus(v, nowSeconds);
      if (statusFilter === 'active') return status === 'active' || status === 'partially-spent';
      if (statusFilter === 'spent') return status === 'spent';
      return status === 'expired' || status === 'reclaimed';
    });
  }, [rawList, statusFilter, nowSeconds]);

  const handleCopyLink = async (id: bigint) => {
    const link = buildGiftLink(window.location.origin, id);
    await navigator.clipboard.writeText(link);
    setCopiedId(id.toString());
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10 py-12 sm:py-16 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-bold tracking-widest uppercase text-crimson">Your ledger</p>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-cocoa tracking-tight">
            My vouchers
          </h1>
          <p className="text-sm sm:text-base text-cocoa-muted leading-relaxed">
            Vouchers addressed to or sent from your connected wallet appear here.
          </p>
        </div>

        {isConnected && (
          <Link
            to="/create"
            className="inline-flex items-center gap-2 rounded-full bg-crimson hover:bg-crimson-hover text-white text-sm font-semibold px-6 py-3 transition-all whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            Create a Voucher
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {!isConnected ? (
        <WalletGate
          title="Connect your wallet to view vouchers"
          description="Giftstore only shows vouchers belonging to your connected wallet."
        />
      ) : (
        <div className="space-y-8">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cocoa/12 pb-5">
            {/* Received / Sent tabs */}
            <div
              role="tablist"
              aria-label="Voucher direction"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-parchment border border-cocoa/10 self-start"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'received'}
                onClick={() => setTab('received')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  tab === 'received'
                    ? 'bg-tissue text-cocoa shadow-sm'
                    : 'text-cocoa-muted hover:text-cocoa'
                }`}
              >
                Received ({data?.received.length ?? 0})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'sent'}
                onClick={() => setTab('sent')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  tab === 'sent'
                    ? 'bg-tissue text-cocoa shadow-sm'
                    : 'text-cocoa-muted hover:text-cocoa'
                }`}
              >
                Sent ({data?.sent.length ?? 0})
              </button>
            </div>

            {/* Status filter buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'active', 'spent', 'expired'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === filter
                      ? 'bg-cocoa text-tissue border-cocoa'
                      : 'bg-tissue text-cocoa-muted border-cocoa/18 hover:text-cocoa'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1].map((n) => (
                <div
                  key={n}
                  className="h-64 rounded-2xl bg-parchment/70 border border-cocoa/10 animate-pulse"
                />
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="stationery-panel rounded-2xl p-10 sm:p-14 text-center max-w-xl mx-auto space-y-5">
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-semibold text-cocoa">
                  {tab === 'received' ? 'No received vouchers yet' : 'No sent vouchers yet'}
                </h2>
                <p className="text-sm text-cocoa-muted leading-relaxed">
                  {!data?.isConfigured
                    ? 'The Giftstore contract address is not configured yet. Once deployed and configured, your on-chain vouchers will load here.'
                    : tab === 'received'
                    ? 'When someone locks USDC or EURC for your wallet on Arc, it will appear here.'
                    : 'Wrap USDC or EURC in a voucher for a friend to see it listed here.'}
                </p>
              </div>
              <Link
                to="/create"
                className="inline-flex items-center gap-2 rounded-full bg-crimson hover:bg-crimson-hover text-white text-sm font-semibold px-7 py-3 transition-colors"
              >
                Create a Voucher
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredList.map((voucher) => {
                const spendable = canSpendVoucher(voucher, address, nowSeconds);
                const reclaimable = canReclaimVoucher(voucher, address, nowSeconds);
                const idStr = voucher.id.toString();

                return (
                  <div key={idStr} className="space-y-3">
                    <VoucherCard
                      mode="live"
                      {...buildVoucherCardStatusProps(voucher, nowSeconds)}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/voucher/${idStr}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-crimson hover:bg-crimson-hover text-white text-xs font-semibold px-5 py-2.5 transition-colors whitespace-nowrap shrink-0"
                        >
                          {spendable
                            ? 'Spend'
                            : reclaimable
                            ? 'Reclaim Balance'
                            : 'Open Details'}
                        </Link>
                        <Link
                          to={`/gift/${idStr}`}
                          className="inline-flex items-center rounded-full border border-cocoa/25 hover:bg-parchment text-cocoa text-xs font-semibold px-4 py-2.5 transition-colors whitespace-nowrap shrink-0"
                        >
                          Gift View
                        </Link>
                      </div>

                      {tab === 'sent' && (
                        <button
                          type="button"
                          onClick={() => handleCopyLink(voucher.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cocoa-muted hover:text-cocoa cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {copiedId === idStr ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-crimson" />
                              Copied link
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy gift link
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
