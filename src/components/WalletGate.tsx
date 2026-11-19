import { ConnectButton } from '@rainbow-me/rainbowkit';
import { WaxSeal } from './WaxSeal';

interface WalletGateProps {
  title: string;
  description: string;
}

export function WalletGate({ title, description }: WalletGateProps) {
  return (
    <div className="stationery-panel rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6">
      <div className="flex justify-center">
        <WaxSeal variant="crimson" size="lg" ariaLabel="Giftstore seal" />
      </div>
      <div className="space-y-2">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-cocoa">{title}</h2>
        <p className="text-sm sm:text-base text-cocoa-muted leading-relaxed">{description}</p>
      </div>
      <div className="flex justify-center pt-2">
        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => (
            <button
              type="button"
              onClick={openConnectModal}
              disabled={!mounted}
              className="rounded-full bg-crimson hover:bg-crimson-hover text-white font-semibold text-sm px-8 py-3.5 transition-all duration-200 hover:-translate-y-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer disabled:opacity-50"
            >
              Connect Wallet
            </button>
          )}
        </ConnectButton.Custom>
      </div>
    </div>
  );
}
