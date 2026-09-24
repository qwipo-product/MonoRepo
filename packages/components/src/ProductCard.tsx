// ProductCard — the single product card. Merges the app's near-duplicate
// ProductCard + ShopProductCard by composition: Card + Chip (pack pills) +
// Badge (margin / source) + PriceLabel + QtyStepper + Button. Distributor vs
// wholesaler, in-cart vs not, discounts — all props, not separate cards.

import * as React from 'react';
import { Badge, Button, Card, Chip, cn } from '@mockups/ui';
import { PriceLabel } from './PriceLabel';

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
  /** When > 0, the Add button is replaced by the quantity control. */
  qty?: number;
  onAdd?: () => void;
  /** Tap the thumbnail to open an image gallery. Falls back to onAdd if unset. */
  onImageClick?: () => void;
  onDiscounts?: () => void;
  /** Optional footer strip (e.g. delivery day + MOV). */
  footer?: React.ReactNode;
  className?: string;
}

/* Drawn here rather than pulled from an icon set: this package has no icon
   dependency, and @mockups/ui draws its own the same way. A real glyph sits on
   the text baseline, which the "⌄" character never did. */
function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Thumb({ image, name }: { image?: string; name: string }) {
  const isUrl = !!image && /^https?:\/\//.test(image);
  // Fixed square — equal width and height.
  return (
    <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-card text-4xl">
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
  onAdd,
  onImageClick,
  onDiscounts,
  footer,
  className,
}: ProductCardProps) {
  return (
    <Card className={cn('p-3', className)}>
      {/* image (left) + info (right). items-stretch + aspect-square makes the
          image a square sized to the info column's height (name/case/pills).
          Image opens the gallery; the title opens the selling-units sheet —
          separate tap targets, never nested. */}
      <div className="flex items-start gap-3">
        {onImageClick || onAdd ? (
          <button
            type="button"
            onClick={onImageClick ?? onAdd}
            aria-label={onImageClick ? `View images of ${name}` : `Open selling units for ${name}`}
            className="shrink-0 rounded-lg active:scale-[0.98]"
          >
            <Thumb image={image} name={name} />
          </button>
        ) : (
          <div className="shrink-0">
            <Thumb image={image} name={name} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              aria-label={`Open selling units for ${name}`}
              className="block w-full text-left active:scale-[0.99]"
            >
              <div className="text-sm font-semibold leading-snug text-foreground">{name}</div>
              {caseLabel && <div className="mt-0.5 text-xs text-foreground-secondary">{caseLabel}</div>}
            </button>
          ) : (
            <>
              <div className="text-sm font-semibold leading-snug text-foreground">{name}</div>
              {caseLabel && <div className="mt-0.5 text-xs text-foreground-secondary">{caseLabel}</div>}
            </>
          )}

          {/* pack pills */}
          {variants && variants.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
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
        </div>
      </div>

      {/* seller line (+ optional source badge), then delivery line */}
      {(seller || delivery || source) && (
        <div className="mt-2.5 space-y-0.5">
          {(seller || source) && (
            <div className="flex items-center gap-2">
              {seller && (
                <span className="min-w-0 truncate text-sm font-semibold text-foreground">{seller}</span>
              )}
              {source && (
                <Badge variant={source === 'distributor' ? 'info' : 'warning'} className="shrink-0">
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

      {/* actions — Discounts and Add split the row evenly. Both halves are
          flex-1, and the Add half keeps its width when qty turns it into the
          stepper, so the row never reflows. */}
      <div className="mt-3 flex items-center gap-2">
        {onDiscounts && (
          <div className="flex-1">
            <Button variant="soft" className="h-10 w-full font-medium" onClick={onDiscounts}>
              Discounts
              <ChevronDownIcon />
            </Button>
          </div>
        )}
        <div className="flex-1">
          {qty > 0 ? (
            /* One control, not a stepper: every quantity change goes through
               the selling-units sheet, so the pack the buyer picked is never
               silently turned into a loose count. − and + are affordances
               that open it, the same as tapping the number. */
            <button
              type="button"
              onClick={onAdd}
              aria-label={`Edit quantity for ${name}`}
              className="flex h-10 w-full items-center justify-between rounded-md bg-primary-soft px-3 text-primary-soft-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:opacity-80"
            >
              <span aria-hidden className="text-lg font-medium leading-none">−</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">{qty}</span>
              <span aria-hidden className="text-lg font-medium leading-none">+</span>
            </button>
          ) : (
            <Button className="h-10 w-full" onClick={onAdd}>
              + Add
            </Button>
          )}
        </div>
      </div>

      {footer && (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-foreground-secondary">
          {footer}
        </div>
      )}
    </Card>
  );
}
