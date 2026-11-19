import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoucherCard } from '../components/VoucherCard';
import { usePlatformStats } from '../hooks/useGiftstoreContract';

const ROADMAP_PHASES = [
  {
    phase: 'Phase 1',
    status: 'Live',
    title: 'Core vouchers live',
    description:
      'Lock USDC or EURC into an on-chain voucher with an expiry timestamp, spendable in full or in parts, with post-expiry sender reclaim.',
  },
  {
    phase: 'Phase 2',
    status: 'Next',
    title: 'Voucher links that can be shared by message',
    description:
      'Generate direct unboxing links you can paste into any chat or email so a recipient lands straight on their sealed gift.',
  },
  {
    phase: 'Phase 3',
    status: 'Planned',
    title: 'Bulk vouchers for teams and events',
    description:
      'Issue dozens of numbered vouchers in a single batch for contributor rewards, hackathons, and community gatherings.',
  },
  {
    phase: 'Phase 4',
    status: 'Planned',
    title: 'Merchant redemption pages',
    description:
      'Dedicated checkout links where stores and creators can accept a voucher directly toward a purchase or invoice.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Who can spend a voucher?',
    answer:
      'Only the recipient wallet address specified when the voucher was created can spend from it. Anyone else viewing the voucher can see its public on-chain details, but the contract rejects spend calls from any other address.',
  },
  {
    question: 'Can it be spent in parts?',
    answer:
      'Yes. A recipient can spend any amount up to the remaining balance, to any destination address they choose, across as many transactions as they need until the balance reaches zero or the voucher expires.',
  },
  {
    question: 'What happens when it expires?',
    answer:
      'Once the expiry timestamp has passed, the recipient can no longer spend from the voucher. The original sender can then call reclaim to return any remaining unspent balance back to their own wallet.',
  },
  {
    question: 'Can a voucher be cancelled?',
    answer:
      'No. While a voucher is active and before its expiry date, the funds remain locked for the recipient so they can rely on the gift. Only unspent funds remaining after the expiry date can be reclaimed by the sender.',
  },
];

export function HomePage() {
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <div>
      {/* Hero Section */}
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10 py-14 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <p className="text-xs font-bold tracking-widest uppercase text-crimson">
              Built on Arc
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-semibold leading-[1.1] tracking-tight text-cocoa text-balance">
              Wrap stablecoins in a gift voucher
            </h1>
            <p className="text-base sm:text-lg text-cocoa-muted leading-relaxed max-w-xl">
              Lock USDC or EURC for someone you care about. They can spend it all at once or in
              parts, and anything unspent after expiry returns to you.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/create"
                className="inline-flex items-center gap-2 rounded-full bg-crimson hover:bg-crimson-hover text-white font-semibold text-sm px-7 py-3.5 transition-all duration-150 hover:-translate-y-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] whitespace-nowrap shrink-0"
              >
                Create a Voucher
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/vouchers"
                className="inline-flex items-center rounded-full border-[1.5px] border-cocoa text-cocoa hover:bg-kraft/20 font-semibold text-sm px-7 py-3.5 transition-colors whitespace-nowrap shrink-0"
              >
                My Vouchers
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <VoucherCard mode="illustration" />
          </div>
        </div>

        {/* Live Contract Platform Stats Strip */}
        <div className="mt-14 sm:mt-16 pt-8 border-t border-cocoa/12 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          <div className="space-y-1">
            <p className="text-xs font-bold tracking-widest uppercase text-cocoa-muted">
              Vouchers created
            </p>
            <p className="font-serif text-3xl font-semibold text-cocoa tabular-nums">
              {statsLoading ? '—' : (stats?.totalVouchers ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold tracking-widest uppercase text-cocoa-muted">
              Active vouchers
            </p>
            <p className="font-serif text-3xl font-semibold text-cocoa tabular-nums">
              {statsLoading ? '—' : (stats?.activeVouchers ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold tracking-widest uppercase text-cocoa-muted">
              Completed spends
            </p>
            <p className="font-serif text-3xl font-semibold text-cocoa tabular-nums">
              {statsLoading ? '—' : (stats?.totalSpends ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="border-t border-cocoa/10 bg-parchment/70 py-16 sm:py-20">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10 space-y-10">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-bold tracking-widest uppercase text-crimson">About</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-cocoa tracking-tight text-balance">
              Simple rules held in code
            </h2>
            <p className="text-base text-cocoa-muted leading-relaxed">
              Every voucher lives directly in the Giftstore contract on Arc. There are no custodial
              balances and no hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stationery-panel rounded-2xl p-7 space-y-3">
              <p className="text-xs font-bold tracking-widest uppercase text-cocoa-muted">
                01. Lock funds
              </p>
              <h3 className="font-serif text-xl font-semibold text-cocoa">
                How a voucher is created
              </h3>
              <p className="text-sm text-cocoa-muted leading-relaxed">
                Approve USDC or EURC, enter a recipient wallet address, choose an expiry date, and
                add an optional note. The contract holds the tokens until spent or reclaimed.
              </p>
            </div>

            <div className="stationery-panel rounded-2xl p-7 space-y-3">
              <p className="text-xs font-bold tracking-widest uppercase text-cocoa-muted">
                02. Recipient spends
              </p>
              <h3 className="font-serif text-xl font-semibold text-cocoa">
                Who can spend it
              </h3>
              <p className="text-sm text-cocoa-muted leading-relaxed">
                Only the named recipient wallet can draw from the voucher. They can send the entire
                amount at once or spend smaller amounts to any destination address over time.
              </p>
            </div>

            <div className="stationery-panel rounded-2xl p-7 space-y-3">
              <p className="text-xs font-bold tracking-widest uppercase text-cocoa-muted">
                03. Expiry protection
              </p>
              <h3 className="font-serif text-xl font-semibold text-cocoa">
                What happens at expiry
              </h3>
              <p className="text-sm text-cocoa-muted leading-relaxed">
                After the expiry timestamp passes, spending closes. If any balance remains unused,
                the original sender can reclaim it back to their wallet in one transaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section (Kraft Tan chapter) */}
      <section className="kraft-surface border-t border-b border-cocoa/15 py-16 sm:py-20 text-cocoa">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10 space-y-10">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-bold tracking-widest uppercase text-cocoa/80">
              What comes next
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-cocoa tracking-tight">
              Giftstore roadmap
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROADMAP_PHASES.map((item) => (
              <div
                key={item.phase}
                className="rounded-2xl bg-tissue border border-cocoa/12 p-6 voucher-card-elevation flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold tracking-widest uppercase">
                    <span className="text-cocoa-muted">{item.phase}</span>
                    <span
                      className={
                        item.status === 'Live' ? 'text-crimson' : 'text-cocoa-muted'
                      }
                    >
                      {item.status}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-cocoa leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm text-cocoa-muted leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-3">
              <p className="text-xs font-bold tracking-widest uppercase text-crimson">Answers</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-cocoa tracking-tight text-balance">
                Frequently asked questions
              </h2>
              <p className="text-sm text-cocoa-muted leading-relaxed">
                Straight answers about how Giftstore vouchers behave on chain.
              </p>
            </div>

            <div className="lg:col-span-8 divide-y divide-cocoa/12 border-t border-b border-cocoa/12">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={item.question} className="py-5">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson rounded-md py-1"
                    >
                      <span className="font-serif text-lg sm:text-xl font-medium text-cocoa group-hover:text-crimson transition-colors">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-cocoa-muted shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-crimson' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="pt-3 pr-8 text-sm sm:text-base text-cocoa-muted leading-relaxed">
                            {item.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
