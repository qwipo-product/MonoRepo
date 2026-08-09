import { useMemo, useState } from 'react';
import { ChevronLeft, Search, SlidersHorizontal } from 'lucide-react';
import { EmptyState, SegmentedControl, Button } from '@mockups/ui';
import { ProductCard, formatInr } from '@mockups/components';
import { PRODUCTS, type Source } from '../data/products';

export function CatalogScreen({
  qty,
  onOpenSheet,
  onSetQty,
  onGoToCart,
  cartCount,
  cartTotal,
}: {
  qty: Record<string, number>;
  onOpenSheet: (id: string) => void;
  onSetQty: (id: string, n: number) => void;
  onGoToCart: () => void;
  cartCount: number;
  cartTotal: number;
}) {
  const [tab, setTab] = useState<Source>('distributor');
  const [variant, setVariant] = useState<Record<string, string>>({});
  const items = useMemo(() => PRODUCTS.filter((p) => p.source === tab), [tab]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground" aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="text-base font-semibold leading-tight">Catalog</div>
          <div className="text-xs text-foreground-secondary">{items.length} products</div>
        </div>
        <button className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground" aria-label="Search">
          <Search size={18} />
        </button>
        <button className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground" aria-label="Filters">
          <SlidersHorizontal size={18} />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <SegmentedControl<Source>
          options={[
            { value: 'distributor', label: 'Distributors' },
            { value: 'wholesaler', label: 'Wholesalers' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {items.length === 0 ? (
          <EmptyState icon="🔍" title="No products here" description="Try the other category." />
        ) : (
          items.map((p) => (
            <ProductCard
              key={p.id}
              name={p.name}
              caseLabel={p.caseLabel}
              image={p.image}
              variants={p.variants}
              selectedVariant={variant[p.id] ?? p.variants[0].id}
              onSelectVariant={(id) => setVariant((v) => ({ ...v, [p.id]: id }))}
              seller={p.seller}
              delivery={p.delivery}
              margin={p.margin}
              price={p.price}
              mrp={p.mrp}
              qty={qty[p.id] ?? 0}
              onQty={(n) => onSetQty(p.id, n)}
              onAdd={() => onOpenSheet(p.id)}
              onDiscounts={() => undefined}
              footer={
                <>
                  <span>{p.deliveryDay}</span>
                  <span>MOV {formatInr(p.mov)}</span>
                </>
              }
            />
          ))
        )}
      </div>

      {cartCount > 0 && (
        <div className="flex items-center gap-3 border-t border-border bg-card px-4 py-3 shadow-[var(--shadow-bar-top)]">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-foreground-secondary">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </div>
            <div className="text-lg font-bold tabular-nums">{formatInr(cartTotal)}</div>
          </div>
          <Button className="flex-1" onClick={onGoToCart}>
            Go to cart
          </Button>
        </div>
      )}
    </div>
  );
}
