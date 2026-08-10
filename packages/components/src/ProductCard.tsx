// ProductCard — the single product card. Merges the app's near-duplicate
// ProductCard + ShopProductCard by composition: Card + Chip (pack pills) +
// Badge (margin / source) + PriceLabel + QtyStepper + Button. Distributor vs
// wholesaler, in-cart vs not, discounts — all props, not separate cards.

import * as React from 'react';
import { Badge, Button, Card, Chip, QtyStepper, cn } from '@mockups/ui';
import { PriceLabel, formatInr } from './PriceLabel';

export interface PackPill {
  id: string;
  label: string;
}

export interface ProductCardProps {
  name: string;
  caseLabel?: string;
  /** Emoji or image URL for the thumbnail. */
  image?: string;
  variants?: PackPill[];
  selectedVariant?: string;
  onSelectVariant?: (id: string) => void;
  seller?: string;
  delivery?: string;
  source?: 'distributor' | 'wholesaler';
  margin?: string;
  price: number;
  mrp?: number;
  priceSuffix?: string;
  /** When > 0, the Add button is replaced by a QtyStepper. */
  qty?: number;
  onQty?: (n: number) => void;
  onAdd?: () => void;
  onDiscounts?: () => void;
  /** Line total (selling price × selected qty). Shows a Total row when > 0. */
  subtotal?: number;
  /** Label for the total row, e.g. "Total (12 pcs)". */
  subtotalLabel?: string;
  /** Optional footer strip (e.g. delivery day + MOV). */
  footer?: React.ReactNode;
  className?: string;
}

function Thumb({ image, name }: { image?: string; name: string }) {
  const isUrl = !!image && /^https?:\/\//.test(image);
  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-2xl">
      {isUrl ? (
        <img src={image} alt={name} className="h-full w-full object-contain" />
      ) : (
        <span aria-hidden>{image ?? '📦'}</span>
      )}
    </div>
  );
}

export function ProductCard({
  name,
  caseLabel,
  image,
  variants,
  selectedVariant,
  onSelectVariant,
  seller,
  delivery,
  source,
  margin,
  price,
  mrp,
  priceSuffix = '/pc',
  qty = 0,
  onQty,
  onAdd,
  onDiscounts,
  subtotal,
  subtotalLabel = 'Total',
  footer,
  className,
}: ProductCardProps) {
  return (
    <Card className={cn('p-3', className)}>
      {/* title + thumb */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-snug text-foreground">{name}</div>
          {caseLabel && <div className="mt-0.5 text-xs text-foreground-secondary">{caseLabel}</div>}
        </div>
        <Thumb image={image} name={name} />
      </div>

      {/* pack pills */}
      {variants && variants.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {variants.map((v) => (
            <Chip
              key={v.id}
              selected={v.id === selectedVariant}
              onClick={() => onSelectVariant?.(v.id)}
              className="px-2.5 py-1"
            >
              {v.label}
            </Chip>
          ))}
        </div>
      )}

      {/* seller line (+ optional source badge), then delivery line */}
      {(seller || delivery || source) && (
        <div className="mt-2.5 space-y-0.5">
          {(seller || source) && (
            <div className="flex items-center gap-2">
              {seller && <span className="text-sm text-foreground">{seller}</span>}
              {source && (
                <Badge variant={source === 'distributor' ? 'info' : 'warning'}>
                  {source === 'distributor' ? 'Distributor' : 'Wholesaler'}
                </Badge>
              )}
            </div>
          )}
          {delivery && <span className="block text-sm text-success-foreground">{delivery}</span>}
        </div>
      )}

      {/* margin + price */}
      <div className="mt-3 flex items-end justify-between gap-3">
        {margin ? <Badge variant="success">{margin}</Badge> : <span />}
        <PriceLabel price={price} mrp={mrp} suffix={priceSuffix} size="lg" />
      </div>

      {/* actions */}
      <div className="mt-3 flex items-center gap-2">
        {onDiscounts && (
          <Button variant="soft" className="flex-1" onClick={onDiscounts}>
            Discounts ⌄
          </Button>
        )}
        {qty > 0 && onQty ? (
          <QtyStepper value={qty} onChange={onQty} tone="soft" className="ml-auto" />
        ) : (
          <Button className="flex-1" onClick={onAdd}>
            + Add
          </Button>
        )}
      </div>

      {subtotal != null && subtotal > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-foreground-secondary">
            {subtotalLabel}
          </span>
          <span className="text-base font-bold tabular-nums text-foreground">{formatInr(subtotal)}</span>
        </div>
      )}

      {footer && (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-foreground-secondary">
          {footer}
        </div>
      )}
    </Card>
  );
}
