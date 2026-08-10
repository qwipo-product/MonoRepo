import { useState } from 'react';
import { ChevronLeft, Search, Users } from 'lucide-react';
import { EmptyState } from '@mockups/ui';
import { ShopCard } from './ShopCard';
import { CUSTOMERS } from '../../data/salesperson';

/* Salesperson · Customers — every retailer assigned to the salesperson (broader
   than today's tasks). Search by business name or mobile; each card opens the
   customer's details. */
export function CustomerListScreen({
  onBack,
  onOpenCustomer,
}: {
  onBack: () => void;
  onOpenCustomer: (customerId: string) => void;
}) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const list = query
    ? CUSTOMERS.filter((c) => c.businessName.toLowerCase().includes(query) || c.mobile.includes(query))
    : CUSTOMERS;

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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Customers</h1>
      </header>

      <div className="border-b border-border bg-card px-3 py-2.5">
        <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-background-subtle px-3">
          <Search className="h-4 w-4 text-foreground-secondary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by business or mobile"
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-secondary"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="grid flex-1 place-items-center bg-background-subtle">
          <EmptyState
            icon={<Users className="h-7 w-7 text-foreground-secondary" />}
            title="No Customers Found"
            description={query ? 'No customer matches your search.' : 'Please contact your manager.'}
          />
        </div>
      ) : (
        <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
          <div className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm">
            Total customers: <span className="font-semibold tabular-nums">{CUSTOMERS.length}</span>
          </div>
          {list.map((c, i) => (
            <ShopCard
              key={c.id}
              badge={i + 1}
              title={c.businessName}
              subtitle={c.name}
              address={c.address}
              mobile={c.mobile}
              lat={c.lat}
              lng={c.lng}
              footer={<span className="text-xs font-medium text-success-foreground">{c.lastOrderDate}</span>}
              onOpen={() => onOpenCustomer(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
