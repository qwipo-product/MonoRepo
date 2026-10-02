import { useState } from 'react';
import { Check, Package, Search } from 'lucide-react';
import { Badge, Button, Chip, EmptyState, Input, Sheet, Switch, cn } from '@mockups/ui';
import { ProductImage, formatInrExact } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import type { SellerSku } from '@mockups/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { imageOf, isCompliant, type Catalog } from '../catalog';

export type ProductFilter = 'all' | 'out' | 'inactive' | 'missing';

const FILTERS: Record<ProductFilter, (s: SellerSku) => boolean> = {
  all: () => true,
  out: (s) => !s.inStock,
  inactive: (s) => !s.active,
  missing: (s) => !isCompliant(s),
};

type BulkChange = 'in' | 'out' | 'active' | 'inactive';

/* Products (the portal's My SKU). The stock switch sits on every row — the
   most common change is one tap. Price is one more tap (the edit sheet).
   Select → tick → "Update" changes many products at once. */
export function ProductsScreen({
  catalog,
  filter,
  onFilterChange,
  onOpen,
  onEditPrice,
  onToast,
}: {
  catalog: Catalog;
  filter: ProductFilter;
  onFilterChange: (f: ProductFilter) => void;
  onOpen: (code: string) => void;
  onEditPrice: (code: string) => void;
  onToast: (message: string) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const shown = catalog.skus.filter(
    (s) =>
      FILTERS[filter](s) &&
      (!q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q))
  );
  const pickedCodes = shown.filter((s) => picked.has(s.code)).map((s) => s.code);
  const stopSelecting = () => {
    setSelecting(false);
    setPicked(new Set());
  };
  const toggle = (code: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const applyBulk = (change: BulkChange) => {
    const n = pickedCodes.length;
    if (change === 'in' || change === 'out') catalog.setStock(pickedCodes, change === 'in');
    else catalog.setActive(pickedCodes, change === 'active');
    setBulkOpen(false);
    stopSelecting();
    onToast(t(`seller.products.bulk_done.${change}`).replace('{n}', String(n)));
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        title={t('seller.products.title')}
        right={
          shown.length > 0 && (
            <Button variant="ghost" size="sm" onClick={selecting ? stopSelecting : () => setSelecting(true)}>
              {selecting ? t('seller.action.done') : t('seller.orders.select')}
            </Button>
          )
        }
      />

      <div className="space-y-2 border-b border-border bg-card px-3 pb-3 pt-2">
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('seller.products.search')} aria-label={t('seller.products.search')} className="pl-9" />
        </label>
        <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3">
          {(Object.keys(FILTERS) as ProductFilter[]).map((f) => (
            <Chip key={f} selected={filter === f} onClick={() => onFilterChange(f)}>
              {t(`seller.products.filter.${f}`)} ({catalog.skus.filter(FILTERS[f]).length})
            </Chip>
          ))}
        </div>
        {selecting && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground-secondary">{t('seller.orders.selected').replace('{n}', String(pickedCodes.length))}</span>
            <button
              className="font-semibold text-primary"
              onClick={() => setPicked(pickedCodes.length === shown.length ? new Set() : new Set(shown.map((s) => s.code)))}
            >
              {pickedCodes.length === shown.length ? t('seller.orders.clear_all') : t('seller.orders.select_all')}
            </button>
          </div>
        )}
      </div>

      <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto bg-background-subtle p-3">
        {shown.length === 0 ? (
          <EmptyState
            icon={<Package strokeWidth={1.75} />}
            title={catalog.skus.length === 0 ? t('seller.products.empty') : t('seller.products.no_match')}
            description={catalog.skus.length === 0 ? t('seller.products.empty_help') : undefined}
          />
        ) : (
          shown.map((s) => (
            <ProductRow
              key={s.code}
              sku={s}
              selecting={selecting}
              selected={picked.has(s.code)}
              onToggle={() => toggle(s.code)}
              onOpen={() => onOpen(s.code)}
              onEditPrice={() => onEditPrice(s.code)}
              onStock={(v) => {
                catalog.setStock([s.code], v);
                onToast(t(v ? 'seller.products.now_in' : 'seller.products.now_out'));
              }}
            />
          ))
        )}
      </div>

      {selecting && pickedCodes.length > 0 && (
        <div className="border-t border-border bg-card p-3 shadow-[var(--shadow-bar-top)]">
          <Button fullWidth onClick={() => setBulkOpen(true)}>
            {t('seller.products.update_n').replace('{n}', String(pickedCodes.length))}
          </Button>
        </div>
      )}

      <Sheet
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title={t('seller.products.update_n').replace('{n}', String(pickedCodes.length))}
        subtitle={t('seller.products.bulk_help')}
      >
        <div className="grid grid-cols-2 gap-2">
          {(['in', 'out', 'active', 'inactive'] as BulkChange[]).map((c) => (
            <Button key={c} variant={c === 'out' || c === 'inactive' ? 'secondary' : 'outlinePrimary'} onClick={() => applyBulk(c)}>
              {t(`seller.products.bulk.${c}`)}
            </Button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function ProductRow({
  sku,
  selecting,
  selected,
  onToggle,
  onOpen,
  onEditPrice,
  onStock,
}: {
  sku: SellerSku;
  selecting: boolean;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onEditPrice: () => void;
  onStock: (inStock: boolean) => void;
}) {
  const { t } = useI18n();
  return (
    <div className={cn('rounded-lg border bg-card p-3 shadow-sm', selected ? 'border-primary' : 'border-border', !sku.active && 'opacity-75')}>
      <div className="flex gap-3">
        {selecting && (
          <button role="checkbox" aria-checked={selected} aria-label={sku.name} onClick={onToggle} className="-m-2 grid h-10 w-10 shrink-0 place-items-center self-center">
            <span className={cn('grid h-5 w-5 place-items-center rounded border-2', selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong bg-card')}>
              {selected && <Check size={14} strokeWidth={3} />}
            </span>
          </button>
        )}
        <button onClick={selecting ? onToggle : onOpen} className="flex min-w-0 flex-1 gap-3 text-left">
          <ProductImage image={imageOf(sku.productId)} alt={sku.name} className="h-14 w-14 shrink-0 rounded-md" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium leading-snug">{sku.name}</span>
            <span className="block text-xs text-foreground-secondary">
              {sku.pack} · {sku.code}
            </span>
            <span className="mt-1 flex items-baseline gap-1.5">
              <span className="text-sm font-semibold tabular-nums">{formatInrExact(sku.price)}</span>
              {sku.mrp > sku.price && <span className="text-xs text-foreground-secondary line-through tabular-nums">{formatInrExact(sku.mrp)}</span>}
            </span>
          </span>
        </button>
      </div>

      {(!sku.active || !isCompliant(sku)) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {!sku.active && <Badge variant="neutral">{t('seller.products.badge.inactive')}</Badge>}
          {!isCompliant(sku) && <Badge variant="danger">{t('seller.products.badge.missing')}</Badge>}
        </div>
      )}

      {!selecting && (
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={sku.inStock} onCheckedChange={onStock} aria-label={t('seller.products.in_stock')} />
            <span className={sku.inStock ? 'font-medium text-success-foreground' : 'font-medium text-warning-foreground'}>
              {t(sku.inStock ? 'seller.products.in_stock' : 'seller.products.out_of_stock')}
            </span>
          </label>
          <Button variant="ghost" size="sm" className="text-primary" onClick={onEditPrice}>
            {t('seller.products.edit_price')}
          </Button>
        </div>
      )}
    </div>
  );
}
