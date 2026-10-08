import { useState, type ComponentType, type ReactNode } from 'react';
import { AlertTriangle, ChevronDown, MapPin, Package, Plus, ShoppingCart, Store, Trash2, Scale } from 'lucide-react';
import { Button, Sheet } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import type { CartSeller } from '../data/cart';
import { OfflineBadge } from '../components/SellerOffline';

// Sections whose items can be removed individually via a Delete action.
/* No fixed "Seller unavailable" group: a seller that isn't taking orders is
   the live Seller Unavailable group above (Accept Orders OFF), so the sheet
   never says it twice or contradicts the cart. */
const DELETABLE = new Set(['unavailable', 'location']);

const kg = (n: number) => `${Number(n.toFixed(2))} kg`;

/* Pre-checkout Alerts sheet — the buyer reviews every blocker (MOV shortfall,
   stock/availability, serviceability) before proceeding. Opened from the Cart
   "Checkout" button; "Proceed Anyway" continues to Order Summary. Content is a
   self-contained demo model (like the rest of the cart mock). */

interface MovFail {
  seller: string;
  balance: number;
  mov: number;
  deliveryBy: string;
}

interface MowFail {
  seller: string;
  weight: number;
  mow: number;
  weightRemaining: number;
  deliveryBy: string;
}

interface AlertRow {
  title: string;
  note: string;
}

interface AlertSection {
  key: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  rows: AlertRow[];
}

const SECTIONS: AlertSection[] = [
  {
    key: 'stock',
    icon: Package,
    label: 'Stock Adjustments',
    rows: [
      { title: 'Freedom Sunflower Oil 1L', note: 'Quantity reduced from 12 to 8 — limited stock' },
      { title: 'Aashirvaad Atta 5kg', note: 'Quantity reduced from 8 to 6 — limited stock' },
    ],
  },
  {
    key: 'unavailable',
    icon: MapPin,
    label: 'Unavailable Items',
    rows: [{ title: 'Mysore Sandal Soap', note: 'Out of stock — will be removed at checkout' }],
  },
  {
    key: 'location',
    icon: MapPin,
    label: 'Location not serviceable',
    rows: [
      { title: 'Fortune Besan 1kg', note: "Doesn't deliver to 560001" },
      { title: 'Maggi Noodles', note: "Doesn't deliver to 560001" },
    ],
  },
];

export function CartAlertsSheet({
  open,
  sellers,
  offlineSellers = [],
  onRemoveSeller,
  onClose,
  onProceed,
}: {
  open: boolean;
  /** The live cart's sellers — MOV/MOW blockers are derived from these on
   * every render, so they stay in step with whatever's actually in the cart. */
  sellers: CartSeller[];
  /** Sellers in the cart with Accept Orders OFF — their items won't be ordered. */
  offlineSellers?: CartSeller[];
  /** Takes an offline seller's items out of the cart. */
  onRemoveSeller?: (sellerId: string) => void;
  onClose: () => void;
  onProceed: () => void;
}) {
  const MOV_FAILS: MovFail[] = sellers
    .filter((s) => s.status === 'below')
    .map((s) => ({ seller: s.name, balance: s.unlockRemaining, mov: s.mov, deliveryBy: s.windows[0] ?? '—' }));
  const MOW_FAILS: MowFail[] = sellers
    .filter((s) => s.belowWeight)
    .map((s) => ({ seller: s.name, weight: s.weight, mow: s.mow, weightRemaining: s.weightRemaining, deliveryBy: s.windows[0] ?? '—' }));
  const [sections, setSections] = useState<AlertSection[]>(SECTIONS);
  const removeRow = (sectionKey: string, title: string) =>
    setSections((prev) =>
      prev.map((s) => (s.key === sectionKey ? { ...s, rows: s.rows.filter((r) => r.title !== title) } : s))
    );
  // Hide a deletable section once the buyer clears all its items.
  const visibleSections = sections.filter((s) => s.rows.length > 0);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      icon={<AlertTriangle size={18} />}
      iconClassName="bg-warning-subtle text-warning-foreground"
      title="Alerts"
      subtitle="Please review the following alerts before proceeding"
      footer={
        <Button fullWidth onClick={onProceed}>
          Proceed Anyway
        </Button>
      }
    >
      <div className="space-y-3">
        {/* First, because it changes what gets ordered at all: an offline
            seller's items are left out of this order. */}
        {offlineSellers.length > 0 && (
          <AlertGroup
            icon={Store}
            title={`Seller Unavailable (${offlineSellers.length} ${offlineSellers.length === 1 ? 'Seller' : 'Sellers'})`}
            defaultOpen
          >
            <div className="space-y-2">
              {offlineSellers.map((s) => (
                <div key={s.id} className="rounded-lg border border-error-border bg-error-subtle p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 text-sm font-semibold text-foreground">{s.name}</div>
                    <OfflineBadge />
                  </div>
                  <p className="mt-1.5 text-xs leading-snug text-error-foreground">
                    This seller is currently offline and not accepting orders. These items won&apos;t be ordered.
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="text-xs text-foreground-secondary">
                      {s.items.length} {s.items.length === 1 ? 'item' : 'items'} ·{' '}
                      <span className="font-semibold tabular-nums text-foreground">{formatInr(s.subtotal)}</span>
                    </div>
                    {onRemoveSeller && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="border-error-border text-error-foreground"
                        onClick={() => onRemoveSeller(s.id)}
                      >
                        <Trash2 size={14} /> Remove items
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AlertGroup>
        )}

        {MOV_FAILS.length > 0 && (
        <AlertGroup
          icon={ShoppingCart}
          title={`MOV Fail (${MOV_FAILS.length} ${MOV_FAILS.length === 1 ? 'Seller' : 'Sellers'})`}
          defaultOpen
        >
          <div className="space-y-2">
            {MOV_FAILS.map((f) => (
              <div key={f.seller} className="rounded-lg bg-muted p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{f.seller}</div>
                    <div className="mt-1 text-xs text-foreground-secondary">
                      Balance to Order:{' '}
                      <span className="font-semibold tabular-nums text-foreground">{formatInr(f.balance)}</span>
                    </div>
                    <div className="text-xs text-foreground-secondary">Delivery By: {f.deliveryBy}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="text-xs text-foreground-secondary">
                      MOV: <span className="font-semibold tabular-nums text-foreground">{formatInr(f.mov)}</span>
                    </div>
                    <Button variant="secondary" size="sm" onClick={onClose}>
                      <Plus size={14} /> Add items
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AlertGroup>
        )}

        {MOW_FAILS.length > 0 && (
        <AlertGroup
          icon={Scale}
          title={`MOW Fail (${MOW_FAILS.length} ${MOW_FAILS.length === 1 ? 'Seller' : 'Sellers'})`}
          defaultOpen
        >
          <div className="space-y-2">
            {MOW_FAILS.map((f) => (
              <div key={f.seller} className="rounded-lg bg-muted p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{f.seller}</div>
                    <div className="mt-1 text-xs text-foreground-secondary">
                      Weight to Add:{' '}
                      <span className="font-semibold tabular-nums text-foreground">{kg(f.weightRemaining)}</span>
                    </div>
                    <div className="text-xs text-foreground-secondary">Delivery By: {f.deliveryBy}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="text-xs text-foreground-secondary">
                      MOW: <span className="font-semibold tabular-nums text-foreground">{kg(f.mow)}</span>
                    </div>
                    <Button variant="secondary" size="sm" onClick={onClose}>
                      <Plus size={14} /> Add items
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AlertGroup>
        )}

        {visibleSections.map((s) => {
          const deletable = DELETABLE.has(s.key);
          return (
            <AlertGroup key={s.key} icon={s.icon} title={`${s.label} (${s.rows.length})`}>
              <ul className="space-y-2.5">
                {s.rows.map((r) => (
                  <li key={r.title} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">{r.title}</div>
                      <div className="text-xs text-foreground-secondary">{r.note}</div>
                    </div>
                    {deletable && (
                      <button
                        onClick={() => removeRow(s.key, r.title)}
                        aria-label={`Remove ${r.title}`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-error hover:bg-error-subtle active:scale-95"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </AlertGroup>
          );
        })}
      </div>
    </Sheet>
  );
}

function AlertGroup({
  icon: Icon,
  title,
  defaultOpen,
  children,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-border bg-card [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
        <Icon className="h-5 w-5 shrink-0 text-foreground-secondary" strokeWidth={1.75} />
        <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-foreground-secondary transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border p-3">{children}</div>
    </details>
  );
}
