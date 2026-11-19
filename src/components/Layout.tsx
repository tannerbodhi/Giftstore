import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';

interface LayoutProps {
  children: ReactNode;
}

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/create', label: 'Create a Voucher' },
  { to: '/vouchers', label: 'My Vouchers' },
];

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-tissue text-cocoa paper-grain">
      {/* Top Bar: strict 3-zone contract */}
      <header className="sticky top-0 z-40 bg-tissue/95 backdrop-blur-sm border-b border-cocoa/10">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10 h-18 flex items-center justify-between gap-8">
          {/* Zone 1: Brand lockup */}
          <Link
            to="/"
            className="whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson rounded-lg"
          >
            <Logo size="md" />
          </Link>

          {/* Zone 2: Clean single-line navigation links */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    isActive
                      ? 'text-crimson border-crimson'
                      : 'text-cocoa-muted border-transparent hover:text-cocoa hover:border-cocoa/30'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: Primary Connect Wallet Action + Mobile Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const connected = mounted && account && chain;
                if (!connected) {
                  return (
                    <button
                      type="button"
                      onClick={openConnectModal}
                      disabled={!mounted}
                      className="rounded-full bg-crimson hover:bg-crimson-hover text-white text-sm font-semibold px-5 py-2.5 transition-all duration-150 hover:-translate-y-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      type="button"
                      onClick={openChainModal}
                      className="rounded-full bg-gold hover:bg-gold-hover text-cocoa text-sm font-semibold px-5 py-2.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Switch to Arc
                    </button>
                  );
                }

                return (
                  <button
                    type="button"
                    onClick={openAccountModal}
                    className="rounded-full border border-cocoa/25 bg-parchment hover:bg-kraft/30 text-cocoa text-sm font-semibold px-4 py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
                  >
                    {account.displayName}
                  </button>
                );
              }}
            </ConnectButton.Custom>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-cocoa/15 text-cocoa hover:bg-parchment transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile navigation drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden border-t border-cocoa/10 bg-tissue px-5 py-4 flex flex-col gap-2"
          >
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-parchment text-crimson'
                      : 'text-cocoa hover:bg-parchment/70'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer on every page */}
      <footer className="border-t border-cocoa/12 bg-parchment/60 text-cocoa">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <Logo size="sm" />
            <p className="text-xs text-cocoa-muted">
              Giftstore is a small independent project available on Arc.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <p className="text-sm font-semibold">
              <span className="tanner-shimmer cursor-default">Built by Tanner</span>
            </p>
            <div className="flex items-center gap-5 text-xs text-cocoa-muted">
              <Link to="/" className="hover:text-cocoa transition-colors">
                Home
              </Link>
              <Link to="/create" className="hover:text-cocoa transition-colors">
                Create a Voucher
              </Link>
              <Link to="/vouchers" className="hover:text-cocoa transition-colors">
                My Vouchers
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
