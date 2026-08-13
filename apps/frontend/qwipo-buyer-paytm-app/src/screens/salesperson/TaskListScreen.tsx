import { useState } from 'react';
import { ChevronLeft, Search, ClipboardList } from 'lucide-react';
import { EmptyState, cn } from '@mockups/ui';
import { ShopCard } from './ShopCard';
import { TASKS, TASK_STATUS_LABEL, type TaskStatus } from '../../data/salesperson';
import { useEmptyable } from '../../review/demoState';

/* Salesperson · Tasks — the day's assigned shops sorted by stop number. Search
   by business name or mobile; each card taps into Task Details. Shares the
   ShopCard layout with the Customers list. */

const STATUS_TONE: Record<TaskStatus, string> = {
  none: 'bg-muted text-foreground-secondary',
  checked_in: 'bg-primary-soft text-primary',
  interaction_added: 'bg-warning-subtle text-warning-foreground',
  checked_out: 'bg-success-subtle text-success-foreground',
};

export function TaskListScreen({
  onBack,
  onOpenTask,
}: {
  onBack: () => void;
  onOpenTask: (taskId: string) => void;
}) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const tasks = useEmptyable(
    query
      ? TASKS.filter(
          (t) =>
            t.customer.businessName.toLowerCase().includes(query) || t.customer.mobile.includes(query)
        )
      : TASKS
  );

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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Tasks</h1>
        <span className="shrink-0 text-xs text-foreground-secondary">{tasks.length} shops</span>
      </header>

      <div className="border-b border-border bg-card px-3 py-2.5">
        <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-background-subtle px-3">
          <Search className="h-4 w-4 text-foreground-secondary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by shop or mobile"
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-secondary"
          />
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="grid flex-1 place-items-center bg-background-subtle">
          <EmptyState
            icon={<ClipboardList strokeWidth={1.75} />}
            title="No tasks today"
            description="Shops assigned for your beat day will appear here."
          />
        </div>
      ) : (
        <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
          {tasks.map((t) => (
            <ShopCard
              key={t.id}
              badge={t.stop}
              title={t.customer.businessName}
              subtitle={t.customer.ownerName}
              address={t.customer.address}
              mobile={t.customer.mobile}
              lat={t.customer.lat}
              lng={t.customer.lng}
              topRight={
                <span className={cn('shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium', STATUS_TONE[t.status])}>
                  {TASK_STATUS_LABEL[t.status]}
                </span>
              }
              onOpen={() => onOpenTask(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
