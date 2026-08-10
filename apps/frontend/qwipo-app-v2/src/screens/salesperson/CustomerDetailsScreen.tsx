import { useState } from 'react';
import { ChevronLeft, Phone, MapPin } from 'lucide-react';
import { SegmentedControl } from '@mockups/ui';
import { OrdersPanel, RecoPanel } from './customerPanels';
import type { Order } from '../../data/orders';
import { CUSTOMERS } from '../../data/salesperson';

/* Salesperson · Customer Details — read-only view of one retailer: Info,
   Orders, Recommendation (shares the Orders/Reco panels with Task Details). */

type Tab = 'info' | 'orders' | 'reco';

export function CustomerDetailsScreen({
  customerId,
  onBack,
  onOpenOrder,
}: {
  customerId: string;
  onBack: () => void;
  onOpenOrder: (order: Order) => void;
}) {
  const c = CUSTOMERS.find((x) => x.id === customerId) ?? CUSTOMERS[0];
  const [tab, setTab] = useState<Tab>('info');

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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">{c.businessName}</h1>
      </header>

      <div className="border-b border-border bg-card px-3 py-2.5">
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'info', label: 'Info' },
            { value: 'orders', label: 'Orders' },
            { value: 'reco', label: 'Reco' },
          ]}
        />
      </div>

      {tab === 'info' && (
        <div className="no-scrollbar flex-1 overflow-y-auto bg-background-subtle p-4">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="text-sm font-semibold text-foreground">{c.businessName}</div>
            <div className="mt-0.5 text-xs text-foreground-secondary">{c.name}</div>
            <div className="mt-2 flex items-start gap-2 text-xs text-foreground-secondary">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {c.address}
            </div>
            <div className="mt-3 flex gap-2">
              <a
                href={`tel:${c.mobile}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-muted py-2 text-xs font-medium text-foreground active:scale-[0.98]"
              >
                <Phone size={14} /> {c.mobile}
              </a>
              <a
                href={`https://maps.google.com/maps?q=${c.lat},${c.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-muted py-2 text-xs font-medium text-foreground active:scale-[0.98]"
              >
                <MapPin size={14} /> Navigate
              </a>
            </div>
            <div className="mt-3 border-t border-border pt-3 text-xs font-medium text-success-foreground">
              {c.lastOrderDate}
            </div>
          </div>
        </div>
      )}
      {tab === 'orders' && <OrdersPanel customerId={c.id} businessName={c.businessName} onOpenOrder={onOpenOrder} />}
      {tab === 'reco' && <RecoPanel customerId={c.id} />}
    </div>
  );
}
