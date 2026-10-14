// Distributor detail drill-down: the story behind one leaderboard row —
// summary KPIs, overdue load, beats — with the order list one step deeper.
import { X } from 'lucide-react';
import { Badge, Button, cn } from '@mockups/ui';
import type { DistributorRow } from '../data/distributors';
import { topBeats } from '../data/distributors';
import { drillDistributors } from '../data/sales';
import type { Page } from '../nav';

const NETWORK_CANCEL = 24.9;
const priorityVariant = { Spotlight: 'success', 'Push in beats': 'info', Nurture: 'neutral' } as const;

export function DistributorDrawer({
  d, onClose, onOrders, go,
}: {
  d: DistributorRow; onClose: () => void; onOrders: () => void; go: (p: Page | string) => void;
}) {
  const overdue = drillDistributors.find((x) => x.label.startsWith(d.name));
  const beats = topBeats.filter((b) => b.label.toLowerCase().includes(d.name.split(' ')[0] === 'Sri' ? d.name.split(' ')[1].toLowerCase() : d.name.split(' ')[0].toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className="animate-slide-in-right fixed right-0 top-0 flex h-dvh w-[480px] flex-col border-l border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={d.name}
      >
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex-1 leading-tight">
            <span className="type-h3 flex items-center gap-2">{d.name} <Badge variant={priorityVariant[d.priority]}>{d.priority}</Badge></span>
            <span className="type-caption block text-foreground-secondary">{d.city} · current scope and period</span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <div className="type-caption text-foreground-secondary">Order value</div>
              <div className="type-h1 tabular-nums">₹{d.value}L</div>
              <div className={cn('type-caption font-medium', d.change < 0 ? 'text-error-foreground' : 'text-success-foreground')}>
                {d.change < 0 ? '↓' : '↑'} {Math.abs(d.change)}% vs Jul
              </div>
            </div>
            <div>
              <div className="type-caption text-foreground-secondary">Orders</div>
              <div className="type-h1 tabular-nums">{d.orders}</div>
              <div className="type-caption text-foreground-secondary">{((d.value / 38.6) * 100).toFixed(1)}% of network ₹</div>
            </div>
            <div>
              <div className="type-caption text-foreground-secondary">Delivery rate</div>
              <div className="type-h1 tabular-nums">{d.delivery}%</div>
              <div className={cn('type-caption', d.delivery < 70 ? 'text-warning-foreground' : 'text-success-foreground')}>target 70%</div>
            </div>
            <div>
              <div className="type-caption text-foreground-secondary">Cancellation</div>
              <div className={cn('type-h1 tabular-nums', d.cancel > NETWORK_CANCEL && 'text-error-foreground')}>{d.cancel}%</div>
              <div className="type-caption text-foreground-secondary">network {NETWORK_CANCEL}%</div>
            </div>
          </div>

          {overdue && (
            <div className="mt-5 rounded-lg border border-error-border bg-error-subtle px-3.5 py-2.5">
              <span className="type-label text-error-foreground">{overdue.n} orders open past 4 days</span>
              <span className="type-caption block text-error-foreground">{overdue.value} at risk · accepted but not delivered</span>
            </div>
          )}

          {beats.length > 0 && (
            <div className="mt-5">
              <div className="type-micro mb-2 text-foreground-tertiary">Sales beats</div>
              {beats.map((b) => (
                <div key={b.label} className="type-caption flex justify-between border-b border-border-subtle py-1.5">
                  <span>{b.label.split(' · ')[0]}</span>
                  <span className="tabular-nums text-foreground-secondary">{b.n} orders · {b.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5">
            <div className="type-micro mb-2 text-foreground-tertiary">Activation</div>
            <p className="type-caption text-warning-foreground">Needs the retailer↔distributor mapping feed.</p>
          </div>
        </div>

        <footer className="flex gap-2 border-t border-border p-4">
          <Button fullWidth size="sm" onClick={onOrders}>View {d.orders} orders</Button>
          <Button variant="secondary" size="sm" onClick={() => go('reports/run:distributor-performance')}>Distributor report</Button>
        </footer>
      </aside>
    </div>
  );
}
