import { ChevronLeft, Wallet } from 'lucide-react';
import { EmptyState, cn } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import { CANCELLATION_FEE, useWallet } from '../data/cancellation';
import { formatDay } from '../date';
import { useEmptyable } from '../review/demoState';

/* Wallet: cancellation fees the retailer owes each seller, and the ledger of
   every fee raised and collected. Fees are never charged on the spot: they wait
   here until the next order with that seller. */
export function WalletScreen({ onBack }: { onBack: () => void }) {
  const wallet = useWallet();
  const entries = useEmptyable(wallet.entries);
  const outstanding = entries.filter((e) => e.status === 'outstanding');
  const total = outstanding.reduce((n, e) => n + e.amount, 0);
  const bySeller = [...new Set(outstanding.map((e) => e.seller))].map((seller) => ({
    seller,
    amount: outstanding.filter((e) => e.seller === seller).reduce((n, e) => n + e.amount, 0),
  }));

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Wallet</h1>
      </header>

      {entries.length === 0 ? (
        <div className="grid flex-1 place-items-center bg-background-subtle">
          <EmptyState
            icon={<Wallet strokeWidth={1.75} />}
            title="No cancellation fees"
            description="Late-cancellation fees and their settlement will show up here."
          />
        </div>
      ) : (
        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="text-xs text-foreground-secondary">Outstanding cancellation fees</div>
            <div className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">{formatInr(total)}</div>
            <p className="mt-1 text-xs text-foreground-secondary">
              {total > 0
                ? 'Collected with your next order from each seller below.'
                : 'Nothing due. You’re all settled with your sellers.'}
            </p>
            {bySeller.length > 0 && (
              <ul className="mt-3 divide-y divide-border border-t border-border">
                {bySeller.map((b) => (
                  <li key={b.seller} className="flex items-center justify-between py-2 text-sm">
                    <span className="min-w-0 truncate text-foreground">{b.seller}</span>
                    <span className="font-semibold tabular-nums text-foreground">{formatInr(b.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <section className="space-y-1.5">
            <h2 className="px-1 text-2xs font-semibold uppercase tracking-wider text-foreground-secondary">Ledger</h2>
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              {entries.map((e) => {
                const open = e.status === 'outstanding';
                return (
                  <div key={e.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{e.seller}</div>
                      <div className="text-xs text-foreground-secondary">
                        Late cancellation · {e.orderId} · {formatDay(e.raisedOn)}
                      </div>
                      {!open && e.collectedWith && (
                        <div className="text-xs text-foreground-secondary">
                          Collected with {e.collectedWith}
                          {e.collectedOn ? ` · ${formatDay(e.collectedOn)}` : ''}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold tabular-nums text-foreground">{formatInr(e.amount)}</div>
                      <span
                        className={cn(
                          'mt-0.5 inline-block rounded px-1.5 py-0.5 text-2xs font-semibold',
                          open ? 'bg-warning-subtle text-warning-foreground' : 'bg-success-subtle text-success-foreground'
                        )}
                      >
                        {open ? 'Outstanding' : 'Collected'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <p className="px-1 text-xs text-foreground-secondary">
            Cancelling an order on its delivery day or later adds a {formatInr(CANCELLATION_FEE)} fee. It is collected
            with your next order from the same seller. No fee if the seller delays the delivery.
          </p>
        </div>
      )}
    </div>
  );
}
