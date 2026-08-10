import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { EmptyState } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { CREDIT_PARTNERS, type CreditPartner } from '../data/payments';

/* Account · Credit Partners — Rupifi / ePay Later statements: limit usage,
   upcoming due, and a Pay Now link to the partner's repayment page. */
export function CreditPartnersScreen({ onBack }: { onBack: () => void }) {
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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Credit Partners</h1>
      </header>

      {CREDIT_PARTNERS.length === 0 ? (
        <div className="grid flex-1 place-items-center bg-background-subtle">
          <EmptyState
            icon={<Users className="h-7 w-7 text-foreground-secondary" />}
            title="No Credit Partners Found"
            description="You don't have any credit partners available at this time."
          />
        </div>
      ) : (
        <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
          {CREDIT_PARTNERS.map((p) => (
            <PartnerCard key={p.id} partner={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PartnerCard({ partner: p }: { partner: CreditPartner }) {
  const usedPct = p.totalCreditLimit ? Math.min(100, (p.usedCreditLimit / p.totalCreditLimit) * 100) : 0;
  const soon = p.daysDifference <= 3;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 p-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-soft text-lg">
          {p.logo}
        </span>
        <div className="min-w-0 flex-1 text-sm font-semibold text-foreground">{p.name}</div>
      </div>

      <div className="border-t border-border p-3">
        <Row label="Total limit" value={formatInrExact(p.totalCreditLimit)} />
        <Row label="Limit used" value={formatInrExact(p.usedCreditLimit)} />
        <Row label="Balance" value={formatInrExact(p.currentBalance)} strong />
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${usedPct}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border p-3">
        <div className="min-w-0">
          <div className="text-xs text-foreground-secondary">
            Upcoming due{' '}
            <span className="font-semibold tabular-nums text-foreground">
              {formatInrExact(p.amountDue)}
            </span>
          </div>
          <div className={soon ? 'text-xs font-medium text-warning-foreground' : 'text-xs text-foreground-secondary'}>
            Due in {p.daysDifference} {p.daysDifference === 1 ? 'day' : 'days'}
          </div>
        </div>
        <a
          href={p.repaymentUrl}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary active:scale-[0.98]"
        >
          Pay Now
          <ChevronRight size={15} />
        </a>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="text-xs text-foreground-secondary">{label}</span>
      <span className={strong ? 'text-sm font-semibold text-foreground' : 'text-sm font-medium text-foreground'}>
        {value}
      </span>
    </div>
  );
}
