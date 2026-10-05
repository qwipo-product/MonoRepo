import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Lock, Clock, BadgeCheck, FileSearch, XCircle, MapPin } from 'lucide-react';
import { DMS_COMPANIES, DMS_DISTRIBUTORS, companyDistributors, type DmsStatus } from '../data/dmsPartners';

/** Which kind of list entry the buyer opened (company vs distributor). */
export type DmsTab = 'company' | 'distributor';

/** Entry banner pinned on Authorised Distributors — prompts the buyer into the
    Register-to-Order flow for the gated catalogues. */
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
          ITC, TCPL, Colgate &amp; Pepsi sell only to registered shops — register once to unlock
          their catalogues
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-primary-soft-foreground" />
    </button>
  );
}

/** Registration status pill — shared by the list cards and the detail pages. */
export function DmsStatusPill({ status }: { status: DmsStatus }) {
  if (status === 'pending')
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full border border-warning-border bg-warning-subtle px-2.5 py-1 text-xs font-medium text-warning-foreground">
        <Clock className="h-3.5 w-3.5" /> Pending
      </span>
    );
  if (status === 'review')
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-soft-foreground">
        <FileSearch className="h-3.5 w-3.5" /> In review
      </span>
    );
  if (status === 'rejected')
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full border border-error-border bg-error-subtle px-2.5 py-1 text-xs font-medium text-error-foreground">
        <XCircle className="h-3.5 w-3.5" /> Rejected
      </span>
    );
  if (status === 'registered')
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full border border-success-border bg-success-subtle px-2.5 py-1 text-xs font-medium text-success-foreground">
        <BadgeCheck className="h-3.5 w-3.5" /> Registered
      </span>
    );
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
      <Lock className="h-3.5 w-3.5" /> Register
    </span>
  );
}

function PartnerCard({
  emoji,
  title,
  meta,
  status,
  chips,
  onClick,
}: {
  emoji: string;
  title: string;
  meta: ReactNode;
  status: DmsStatus;
  chips: string[];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="block w-full overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm active:scale-[0.99]"
    >
      <span className="flex items-center gap-3 p-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-border bg-muted text-2xl">
          {emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
          <span className="mt-0.5 block text-xs leading-snug text-foreground-secondary">{meta}</span>
        </span>
        <DmsStatusPill status={status} />
        <ChevronRight className="h-5 w-5 shrink-0 text-foreground-secondary" />
      </span>
      <span className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2.5">
        {chips.map((b) => (
          <span key={b} className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground-secondary">
            {b}
          </span>
        ))}
      </span>
    </button>
  );
}

/* Register to Order — one list of gated catalogues:
   – companies (ITC): register once with the company; its authorised
     distributors in your area are shown inside;
   – direct companies (TCPL): no distributor step — straight to "already a
     customer / new to TCPL";
   – distributors (Balaji Enterprises): register with their own DMS. */
export function DmsPartnersScreen({
  statuses,
  onBack,
  onOpenCompany,
  onOpenDistributor,
}: {
  statuses: Record<string, DmsStatus>;
  onBack: () => void;
  onOpenCompany: (id: string) => void;
  onOpenDistributor: (id: string) => void;
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
          <p className="text-xs text-foreground-secondary">Unlock gated catalogues near you</p>
        </div>
      </header>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-4">
        <p className="rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-foreground-secondary shadow-sm">
          These companies and distributors sell only to registered shops. Register once, or link
          your existing customer ID, to unlock their full catalogue on Qwipo.
        </p>

        {DMS_COMPANIES.map((c) => {
          const dists = companyDistributors(c);
          return (
            <PartnerCard
              key={c.id}
              emoji={c.emoji}
              title={c.company}
              meta={
                c.direct ? (
                  <>Register directly · {c.products} products</>
                ) : (
                  <>
                    {dists.length} distributor{dists.length > 1 ? 's' : ''} near you · {c.products} products
                  </>
                )
              }
              status={statuses[c.id] ?? 'none'}
              chips={c.brands}
              onClick={() => onOpenCompany(c.id)}
            />
          );
        })}

        {DMS_DISTRIBUTORS.map((d) => (
          <PartnerCard
            key={d.id}
            emoji={d.emoji}
            title={d.name}
            meta={
              <>
                Distributor for {d.serves.join(', ')}
                <span className="mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {d.distanceKm} km · {d.products} products
                </span>
              </>
            }
            status={statuses[d.id] ?? 'none'}
            chips={d.brands}
            onClick={() => onOpenDistributor(d.id)}
          />
        ))}
      </div>
    </div>
  );
}