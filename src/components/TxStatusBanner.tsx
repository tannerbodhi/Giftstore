import { CheckCircle2, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import type { TxPhase } from '../hooks/useGiftstoreContract';
import { getExplorerTxUrl } from '../lib/chain';

interface TxStatusBannerProps {
  phase: TxPhase;
  hash?: `0x${string}`;
  errorMessage?: string | null;
  pendingLabel?: string;
  confirmingLabel?: string;
  confirmedLabel?: string;
}

export function TxStatusBanner({
  phase,
  hash,
  errorMessage,
  pendingLabel = 'Confirm this transaction in your wallet',
  confirmingLabel = 'Confirming on Arc',
  confirmedLabel = 'Transaction confirmed on Arc',
}: TxStatusBannerProps) {
  if (phase === 'idle') return null;

  if (phase === 'error') {
    return (
      <div
        role="alert"
        className="rounded-xl border border-crimson/30 bg-crimson/5 px-4 py-3 text-sm text-cocoa flex items-start gap-3"
      >
        <AlertCircle className="w-5 h-5 text-crimson shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <p className="font-semibold text-crimson">Transaction failed</p>
          <p className="text-xs text-cocoa-muted break-words">
            {errorMessage || 'The transaction could not be completed.'}
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'confirmed') {
    return (
      <div
        role="status"
        className="rounded-xl border border-cocoa/15 bg-gold/25 px-4 py-3 text-sm text-cocoa flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-cocoa shrink-0" />
          <span className="font-semibold">{confirmedLabel}</span>
        </div>
        {hash && (
          <a
            href={getExplorerTxUrl(hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-crimson hover:underline whitespace-nowrap shrink-0"
          >
            View on Arcscan
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      role="status"
      className="rounded-xl border border-cocoa/15 bg-parchment px-4 py-3 text-sm text-cocoa flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2.5">
        <Loader2 className="w-4 h-4 text-crimson animate-spin shrink-0" />
        <span className="font-medium">
          {phase === 'pending' ? pendingLabel : confirmingLabel}
        </span>
      </div>
      {hash && (
        <a
          href={getExplorerTxUrl(hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-crimson hover:underline whitespace-nowrap shrink-0"
        >
          Explorer
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
