import { ChevronLeft, ChevronRight, Lock, Clock, BadgeCheck, FileSearch, XCircle } from 'lucide-react';
import { DMS_PARTNERS, type DmsStatus } from '../data/dmsPartners';

/** Entry banner pinned on Authorised Distributors — prompts the buyer into the
    Register-to-Order flow for the gated company catalogues. */
export function DmsPromoCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-primary/30 bg-primary-soft p-3 text-left shadow-sm active:scale-[0.99]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Lock className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">
          Register to order from more distributors
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-foreground-secondary">
          Colgate, Pepsi, Marico &amp; ITC sell only to registered shops — register once to unlock
          their catalogues
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-primary-soft-foreground" />
    </button>
  );
}

/* Register to Order — the gated company distributors (Colgate, PepsiCo, …).
   Each card shows the company's DMS partner + registration status: Register
   (locked) → Pending approval → Registered (catalogue unlocked). */

export function DmsPartnersScreen({
  statuses,
  onBack,
  onOpen,
}: {
  statuses: Record<string, DmsStatus>;
  onBack: () => void;
  onOpen: (partnerId: string) => void;
}) {
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
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight">Register to Order</h1>
          <p className="text-xs text-foreground-secondary">Company distributors near you</p>
        </div>
      </header>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-4">
        <p className="rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-foreground-secondary shadow-sm">
          These companies sell only to shops registered in their distributor system. Register once
          — or link your existing customer ID — to unlock their full catalogue on Qwipo.
        </p>

        {DMS_PARTNERS.map((p) => {
          const status = statuses[p.id] ?? 'none';
          return (
            <button
              key={p.id}
              onClick={() => onOpen(p.id)}
              className="block w-full overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm active:scale-[0.99]"
            >
              <span className="flex items-center gap-3 p-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-border bg-muted text-2xl">
                  {p.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{p.company}</span>
                  <span className="mt-0.5 block truncate text-xs text-foreground-secondary">
                    via {p.distributor} · {p.products} products
                  </span>
                </span>
                {status === 'none' && (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                    <Lock className="h-3.5 w-3.5" /> Register
                  </span>
                )}
                {status === 'pending' && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full border border-warning-border bg-warning-subtle px-2.5 py-1 text-xs font-medium text-warning-foreground">
                    <Clock className="h-3.5 w-3.5" /> Pending approval
                  </span>
                )}
                {status === 'review' && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-soft-foreground">
                    <FileSearch className="h-3.5 w-3.5" /> Under review
                  </span>
                )}
                {status === 'rejected' && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full border border-error-border bg-error-subtle px-2.5 py-1 text-xs font-medium text-error-foreground">
                    <XCircle className="h-3.5 w-3.5" /> Rejected
                  </span>
                )}
                {status === 'registered' && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full border border-success-border bg-success-subtle px-2.5 py-1 text-xs font-medium text-success-foreground">
                    <BadgeCheck className="h-3.5 w-3.5" /> Registered
                  </span>
                )}
                <ChevronRight className="h-5 w-5 shrink-0 text-foreground-secondary" />
              </span>
              <span className="flex gap-1.5 border-t border-border px-3 py-2.5">
                {p.brands.map((b) => (
                  <span
                    key={b}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground-secondary"
                  >
                    {b}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
