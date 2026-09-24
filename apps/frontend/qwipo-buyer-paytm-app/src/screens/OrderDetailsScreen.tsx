import { useState, type ReactNode } from 'react';
import { ChevronLeft, MapPin, Copy, Check, BadgePercent, Gift } from 'lucide-react';
import { ProductImage, StatusBadge, PriceLabel, formatInrExact } from '@mockups/components';
import type { Order } from '../data/orders';
import { ADDRESSES, DEFAULT_ADDRESS_ID } from '../data/addresses';
import { formatDate } from '../date';

/* Order Details — company + status, the order summary bill, the item list, and
   the delivery address. Read-only.

   An order belongs to ONE company, because each company invoices separately —
   so everything on this screen is that company's: its bill, its items, its
   schemes. Two companies bought from the same distributor in one cart show up
   here as two orders, not one screen with two halves. */
export function OrderDetailsScreen({ order, onBack }: { order: Order; onBack: () => void }) {
  const discount = order.discount ?? 0;
  const offers = order.offers ?? [];
  /* `total` is what was payable, so the gross items figure is read back out of
     it — items − discount + delivery = total, and the rows add up on screen. */
  const itemsTotal = order.total - order.deliveryFee + discount;
  const freeCount = order.items.filter((i) => i.free).reduce((n, i) => n + i.qty, 0);
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
            {order.distributor && (
              <div className="truncate text-xs text-foreground-secondary">
                Delivered by {order.distributor}
              </div>
            )}
            <StatusBadge status={order.status} label={order.statusLabel} className="mt-1" />
          </div>
        </div>

        {/* order summary */}
        <Section title="Order Summary">
          <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
            <SumRow label="Order ID" value={<CopyValue value={order.orderId} />} />
            <SumRow label="Order date" value={formatDate(order.placedAt)} />
            <SumRow label="Expected delivery" value={formatDate(order.eta)} />
            <SumRow label="Order status" value={order.statusLabel} />
            <SumRow label="Items total" value={formatInrExact(itemsTotal)} />
            {discount > 0 && (
              <SumRow
                label="Discount"
                value={<span className="text-success-foreground">− {formatInrExact(discount)}</span>}
              />
            )}
            <SumRow label="Delivery fee" value={formatInrExact(order.deliveryFee)} />
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2.5">
              <span className="text-sm font-semibold text-foreground">Total amount</span>
              <span className="text-base font-bold tabular-nums text-foreground">{formatInrExact(order.total)}</span>
            </div>
          </div>
        </Section>

        {/* offers applied — what the schemes and any coupon actually paid out
            on this order. Money off and free goods are both shown, because a
            scheme pays in one or the other and the buyer cares about both. */}
        {offers.length > 0 && (
          <Section title={`Offers Applied (${offers.length})`}>
            <div className="space-y-2">
              {offers.map((o) => (
                <div key={o.code} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                      <BadgePercent className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="rounded border border-dashed border-primary bg-primary-soft px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                          {o.code}
                        </span>
                        <span className="text-xs font-medium text-foreground-secondary">{o.label}</span>
                      </div>
                      <div className="mt-1 text-sm leading-snug text-foreground">{o.benefit}</div>
                    </div>
                    {o.saved > 0 && (
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-success-foreground">
                        − {formatInrExact(o.saved)}
                      </span>
                    )}
                  </div>
                  {o.freeGoods && (
                    <div className="mt-2 flex items-center gap-1.5 border-t border-border pt-2 text-xs font-medium text-success-foreground">
                      <Gift className="h-3.5 w-3.5 shrink-0" />
                      {o.freeGoods}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* items */}
        {order.items.length > 0 && (
        <Section
          title={
            freeCount > 0
              ? `Items (${order.items.length}) · ${freeCount} free`
              : `Items (${order.items.length})`
          }
        >
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
                <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-border bg-card text-2xl">
                  <ProductImage image={item.image} alt={item.name} />
                  {item.free && (
                    <span className="absolute -top-1.5 rounded-full bg-success px-1.5 py-0.5 text-[10px] font-bold text-white">
                      FREE
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-foreground-secondary">
                    {item.brand}
                  </div>
                  <div className="text-sm font-medium text-foreground">{item.name}</div>
                  <div className="text-xs text-foreground-secondary">{item.pack}</div>
                </div>
                {item.free ? (
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold tabular-nums text-success-foreground">₹0.00</div>
                    <div className="text-[11px] text-foreground-secondary">Free item</div>
                  </div>
                ) : (
                  <PriceLabel price={item.price} mrp={item.mrp} className="shrink-0" />
                )}
              </div>
            ))}
          </div>
        </Section>
        )}

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
