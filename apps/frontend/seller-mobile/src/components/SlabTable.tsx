import { cn } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import type { SellerSchemeSlab } from '@mockups/types';
import { slabPrice } from '../catalog';

/* The offer's slabs as a table: quantity, discount and what the buyer pays
   per unit. With `newPrice`, a fourth column shows the price after an edit.
   The product page, the price sheet, the offer sheet and Create offer all
   use this one table, so an offer reads the same everywhere. */
export function SlabTable({ slabs, price, newPrice }: { slabs: SellerSchemeSlab[]; price: number; newPrice?: number }) {
  const { t } = useI18n();
  const cols = newPrice === undefined ? 'grid-cols-3' : 'grid-cols-4';
  return (
    <div className="overflow-hidden rounded-lg border border-border text-sm">
      <div className={cn('grid gap-2 bg-background-subtle px-3 py-2 text-xs text-foreground-secondary', cols)}>
        <span>{t('seller.product.qty')}</span>
        <span>{t('seller.product.discount')}</span>
        <span className="text-right">{newPrice === undefined ? t('seller.product.pays') : t('seller.product.now')}</span>
        {newPrice !== undefined && <span className="text-right">{t('seller.product.new')}</span>}
      </div>
      <ul className="divide-y divide-border">
        {slabs.map((s) => (
          <li key={s.min} className={cn('grid items-center gap-2 px-3 py-2', cols)}>
            <span className="font-medium tabular-nums">
              {s.max === null ? t('seller.product.and_above').replace('{n}', String(s.min)) : `${s.min}–${s.max}`}
            </span>
            <span className={s.discountPct > 0 ? 'font-medium text-success-foreground' : 'text-foreground-secondary'}>
              {s.discountPct > 0 ? t('seller.product.off').replace('{n}', String(s.discountPct)) : t('seller.product.no_discount')}
            </span>
            <span className={cn('text-right tabular-nums', newPrice === undefined ? 'font-semibold' : 'text-foreground-secondary')}>
              {formatInrExact(slabPrice(price, s.discountPct))}
            </span>
            {newPrice !== undefined && <span className="text-right font-semibold tabular-nums">{formatInrExact(slabPrice(newPrice, s.discountPct))}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
