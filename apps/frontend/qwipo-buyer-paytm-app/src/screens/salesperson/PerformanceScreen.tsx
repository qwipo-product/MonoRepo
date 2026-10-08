import { useState, type ReactNode } from 'react';
import { ChevronLeft, CalendarDays } from 'lucide-react';
import { cn } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { dayPerformanceFor, MONTH_PERFORMANCE, PERFORMANCE_TODAY } from '../../data/salesperson';
import { formatDate } from '../../date';

/* Salesperson · Performance — pick a date, see that day's targets vs achieved.
   A month-to-date allowance card sits below. (No Today/Month tabs.) */
export function PerformanceScreen({ onBack }: { onBack: () => void }) {
  const [date, setDate] = useState(PERFORMANCE_TODAY);
  const p = dayPerformanceFor(date);
  const m = MONTH_PERFORMANCE;

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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Performance</h1>
      </header>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
        {/* date picker */}
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 shadow-sm active:scale-[0.99]">
          <span className="text-sm font-medium text-foreground">Selected date</span>
          <span className="flex items-center gap-2 text-sm font-semibold tabular-nums text-foreground">
            {formatDate(date)}
            <CalendarDays className="h-4 w-4 text-primary" />
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value || PERFORMANCE_TODAY)}
            aria-label="Select date"
            className="sr-only"
          />
        </label>

        {/* day metrics */}
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <Group title="Revenue">
            <Pair label="Revenue" achieved={p.dayRevenueAchieved} target={p.dayRevenueTarget} money />
            <Pair label="Task revenue" achieved={p.taskRevenueAchieved} target={p.taskRevenueTarget} money />
          </Group>
          <Group title="Tasks">
            <Pair label="Tasks visited" achieved={p.visitedCount} target={p.assignedTasks} />
            <Pair label="Buying customers" achieved={p.buyingCountAchieved} target={p.buyingCountTarget} />
            <Pair label="Non-buying customers" achieved={p.nonBuyingAchieved} target={p.nonBuyingTarget} />
          </Group>
          <Group title="Revenue split">
            <Row label="Buying revenue" value={formatInrExact(p.buyingRevenueAchieved)} />
            <Row label="Non-buying revenue" value={formatInrExact(p.nonBuyingRevenueAchieved)} />
          </Group>
          <Group title="Allowances" last>
            <Row label="Petrol allowance" value={formatInrExact(p.petrolAllowance)} />
            <Row label="Incentive allowance" value={formatInrExact(p.incentiveAllowance)} />
          </Group>
        </div>

        {/* month-to-date */}
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
            Monthly performance · {m.month} {m.year}
          </div>
          <div className="p-4">
            <Row label="MTD incentive allowance" value={formatInrExact(m.mtdIncentiveAllowance)} />
            <Row label="MTD petrol allowance" value={formatInrExact(m.mtdPetrolAllowance)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Group({ title, children, last }: { title: string; children: ReactNode; last?: boolean }) {
  return (
    <div className={cn('p-4', !last && 'border-b border-border')}>
      <div className="text-2xs font-semibold uppercase tracking-wider text-foreground-secondary">{title}</div>
      <div className="mt-2 space-y-2.5">{children}</div>
    </div>
  );
}

/** Achieved vs target, with a progress bar. */
function Pair({
  label,
  achieved,
  target,
  money,
}: {
  label: string;
  achieved: number;
  target: number;
  money?: boolean;
}) {
  const fmt = (n: number) => (money ? formatInrExact(n) : String(n));
  const pct = target ? Math.min(100, (achieved / target) * 100) : 0;
  const hit = achieved >= target && target > 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-xs text-foreground-secondary">
          <span className={cn('text-sm font-semibold tabular-nums', hit ? 'text-success-foreground' : 'text-foreground')}>
            {fmt(achieved)}
          </span>{' '}
          / {fmt(target)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', hit ? 'bg-success' : 'bg-primary')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="text-sm text-foreground-secondary">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}
