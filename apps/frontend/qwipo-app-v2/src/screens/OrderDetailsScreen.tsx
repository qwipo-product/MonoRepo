import { useState, type ReactNode } from 'react';
import { ChevronLeft, MapPin, Copy, Check } from 'lucide-react';
import { StatusBadge, PriceLabel, formatInrExact } from '@mockups/components';
import type { Order } from '../data/orders';
import { ADDRESSES, DEFAULT_ADDRESS_ID } from '../data/addresses';

/* Order Details — seller + status, the order summary bill, the item list, and
   the delivery address. Read-only. */
export function OrderDetailsScreen({ order, onBack }: { order: Order; onBack: () => void }) {
  const itemsTotal = order.total - order.deliveryFee;
  const address = ADDRESSES.find((a) => a.id === DEFAULT_ADDRESS_ID) ?? ADDRESSES[0];
  const initials = order.seller
    .replace(/[^a-zA-Z ]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

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
          <h1 className="truncate text-base font-semibold leading-tight">Order Details</h1>
          <p className="text-xs text-foreground-secondary">{order.orderId}</p>
        </div>
      </header>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
        {/* seller */}
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-sm font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{order.seller}</div>
            <StatusBadge status={order.status} label={order.statusLabel} className="mt-1" />
          </div>
        </div>

        {/* order summary */}
        <Section title="Order Summary">
          <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
            <SumRow label="Order ID" value={<CopyValue value={order.orderId} />} />
            <SumRow label="Order date" value={order.placedAt} />
            <SumRow label="Expected delivery" value={order.eta} />
            <SumRow label="Order status" value={order.statusLabel} />
            <SumRow label="Items total" value={formatInrExact(itemsTotal)} />
            <SumRow label="Delivery fee" value={formatInrExact(order.deliveryFee)} />
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2.5">
              <span className="text-sm font-semibold text-foreground">Total amount</span>
              <span className="text-base font-bold tabular-nums text-foreground">{formatInrExact(order.total)}</span>
            </div>
          </div>
        </Section>

        {/* items */}
        <Section title={`Items (${order.items.length})`}>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-border bg-card text-2xl">
                  {item.image}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-foreground-secondary">
                    {item.brand}
                  </div>
                  <div className="text-sm font-medium text-foreground">{item.name}</div>
                  <div className="text-xs text-foreground-secondary">{item.pack}</div>
                </div>
                <PriceLabel price={item.price} mrp={item.mrp} className="shrink-0" />
              </div>
            ))}
          </div>
        </Section>

        {/* delivery address */}
        <Section title="Delivery Address">
          <div className="flex gap-2.5 rounded-lg border border-border bg-card p-3 shadow-sm">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">{address.title}</div>
              <div className="text-xs text-foreground-secondary">
                {address.locality} – {address.pincode}
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function SumRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-foreground-secondary">{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      },
      () => undefined
    );
  };
  return (
    <button
      onClick={copy}
      aria-label={`Copy order number ${value}`}
      className="inline-flex items-center gap-1.5 font-medium text-foreground active:scale-[0.98]"
    >
      {value}
      {copied ? <Check size={13} className="text-success-foreground" /> : <Copy size={13} className="text-foreground-secondary" />}
    </button>
  );
}
