import { ChevronLeft, Tag } from 'lucide-react';
import { Button, Card, EmptyState, QtyStepper, SelectableCard } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import { PRODUCTS, COUPONS } from '../data/products';

function couponDiscount(code: string | undefined, subtotal: number) {
  if (code === 'QWIPO500') return subtotal >= 6000 ? 500 : 0;
  if (code === 'WELCOME10') return Math.min(400, Math.round(subtotal * 0.1));
  return 0;
}

export function CartScreen({
  qty,
  onSetQty,
  couponId,
  onSelectCoupon,
  onBack,
}: {
  qty: Record<string, number>;
  onSetQty: (id: string, n: number) => void;
  couponId: string | null;
  onSelectCoupon: (id: string) => void;
  onBack: () => void;
}) {
  const lines = PRODUCTS.filter((p) => (qty[p.id] ?? 0) > 0).map((p) => ({ product: p, qty: qty[p.id] }));
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const coupon = COUPONS.find((c) => c.id === couponId);
  const freeShip = coupon?.code === 'FREESHIP' && subtotal >= 3500;
  const delivery = lines.length === 0 || freeShip ? 0 : 30;
  const discount = couponDiscount(coupon?.code, subtotal);
  const toPay = Math.max(0, subtotal - discount) + delivery;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground" aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        <div className="text-base font-semibold leading-tight">Cart</div>
      </header>

      {lines.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          description="Add products to see them here."
          action={<Button onClick={onBack}>Browse products</Button>}
        />
      ) : (
        <>
          <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-3">
            {/* items */}
            <div className="space-y-2.5">
              {lines.map(({ product, qty: q }) => (
                <Card key={product.id} className="flex items-center gap-3 p-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-muted text-xl">
                    {product.image}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{product.name}</div>
                    <div className="text-xs text-foreground-secondary">
                      {formatInr(product.price)} · {product.seller}
                    </div>
                  </div>
                  <QtyStepper value={q} onChange={(n) => onSetQty(product.id, n)} />
                </Card>
              ))}
            </div>

            {/* coupons */}
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <Tag size={15} /> Offers
              </div>
              <div className="space-y-2.5">
                {COUPONS.map((c) => (
                  <SelectableCard
                    key={c.id}
                    selected={c.id === couponId}
                    onClick={() => onSelectCoupon(c.id)}
                    radio
                    className="p-3"
                  >
                    <div className="pr-7">
                      <div className="text-sm font-semibold">{c.title}</div>
                      <div className="mt-0.5 text-xs text-foreground-secondary">
                        {c.detail} · {c.code}
                      </div>
                    </div>
                  </SelectableCard>
                ))}
              </div>
            </div>

            {/* bill */}
            <Card className="p-4">
              <div className="mb-2 text-sm font-semibold">Bill details</div>
              <BillRow k="Subtotal" v={formatInr(subtotal)} />
              {discount > 0 && <BillRow k="Coupon discount" v={`− ${formatInr(discount)}`} good />}
              <BillRow k="Delivery fee" v={delivery === 0 ? 'Free' : formatInr(delivery)} />
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <span className="text-sm font-semibold">To pay</span>
                <span className="text-lg font-bold tabular-nums">{formatInr(toPay)}</span>
              </div>
            </Card>
          </div>

          <div className="flex items-center gap-3 border-t border-border bg-card px-4 py-3 shadow-[var(--shadow-bar-top)]">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-foreground-secondary">To pay</div>
              <div className="text-lg font-bold tabular-nums">{formatInr(toPay)}</div>
            </div>
            <Button className="flex-1">Place order</Button>
          </div>
        </>
      )}
    </div>
  );
}

function BillRow({ k, v, good }: { k: string; v: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-foreground-secondary">{k}</span>
      <span className={good ? 'font-medium text-success-foreground tabular-nums' : 'tabular-nums'}>{v}</span>
    </div>
  );
}
