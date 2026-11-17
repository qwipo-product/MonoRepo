import type { ReactNode } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Lock, Clock, BadgeCheck, FileSearch, XCircle } from 'lucide-react';
import { DMS_COMPANIES, type DmsStatus } from '../data/dmsPartners';

/* A form, ticked, with a finger on it. Drawn here rather than shipped as an
   asset: it is one illustration used in one place, and inline it follows the
   theme — the lines are the brand blue and the tick is knocked out in the
   card's own colour, so it stays legible when the square goes dark. */
function RegisterArt() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8 text-primary" aria-hidden="true">
      {/* the form, with a line written on it */}
      <rect x="2" y="4.5" width="19" height="12.5" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M6 9.5h7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      {/* accepted */}
      <circle cx="24" cy="8" r="6" fill="currentColor" />
      <path
        d="m21.4 8.2 1.9 1.9 3.3-3.6"
        className="stroke-card"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* and a hand on it: one finger out of a closed fist, thumb to the side.
          Drawn as overlapping solids rather than one path — they share a fill,
          so they read as a single shape and each part stays tunable. */}
      <g fill="currentColor">
        <rect x="10.5" y="11.5" width="4.5" height="10" rx="2.25" />
        <rect x="9" y="18" width="12.5" height="10" rx="4" />
        <rect x="6.75" y="19.5" width="5" height="5" rx="2.5" />
      </g>
    </svg>
  );
}

/** Entry banner pinned on Authorised Distributors — prompts the buyer into the
    Register-to-Order flow for the gated catalogues.

    Why it says so little: the tile is pinned above every tab of a browsing
    screen, so it competes with the catalogue for attention all day. One line
    naming the thing earns its place; the two-line explanation of gated
    catalogues did not, and that reasoning is on the screen it opens. */
export function DmsPromoCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl bg-primary-soft p-3 text-left active:scale-[0.99]"
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-card">
        <RegisterArt />
      </span>
      <span className="min-w-0 flex-1 text-base font-semibold leading-snug text-foreground">
        Register to Order from more Distributors
      </span>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} />
      </span>
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

/* Register to Order — the list of gated companies. A company opens its own
   registration: straight to the form where its DMS is wired into Qwipo,
   otherwise a choice between linking a customer ID and registering new. */
export function DmsPartnersScreen({
  statuses,
  onBack,
  onOpenCompany,
}: {
  statuses: Record<string, DmsStatus>;
  onBack: () => void;
  onOpenCompany: (id: string) => void;
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
          These companies sell only to registered shops. Register once to unlock
          their full catalogue on Qwipo.
        </p>

        {DMS_COMPANIES.map((c) => (
          <PartnerCard
            key={c.id}
            emoji={c.emoji}
            title={c.company}
            meta={<>Register directly · {c.products} products</>}
            status={statuses[c.id] ?? 'none'}
            chips={c.brands}
            onClick={() => onOpenCompany(c.id)}
          />
        ))}
      </div>
    </div>
  );
}