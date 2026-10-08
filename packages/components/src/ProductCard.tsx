// ProductCard — the single product card. Merges the app's near-duplicate
// ProductCard + ShopProductCard by composition: Card + Chip (pack pills) +
// Badge (margin / seller) + PriceLabel + QtyStepper + Button. Distributor vs
// wholesaler, in-cart vs not, discounts — all props, not separate cards.

import * as React from 'react';
import { Badge, Button, Card, Chip, cn } from '@mockups/ui';
import { PriceLabel } from './PriceLabel';
import { ProductImage } from './ProductImage';
import { QtyPill } from './QtyPill';

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
  /* Optional strip above the name — Global Search uses it to say whether this
     is the distributor's card or a wholesaler's, since there the two sit in
     one list and the card alone doesn't say. */
  badge?: React.ReactNode;
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
  // Fixed square — equal width and height.
  return (
    <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-card text-4xl">
      <ProductImage image={image} alt={name} />
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
  margin,
  price,
  mrp,
  priceSuffix = '/pc',
  qty = 0,
  onAdd,
  onImageClick,
  onDiscounts,
  footer,
  badge,
  className,
}: ProductCardProps) {
  return (
    <Card className={cn('p-3', className)}>
      {badge && <div className="mb-2">{badge}</div>}
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

      {delivery && <div className="mt-2.5 text-sm text-success-foreground">{delivery}</div>}

      {/* margin + price */}
      <div className="mt-3 flex items-end justify-between gap-3">
        {margin ? <Badge variant="success">{margin}</Badge> : <span />}
        <PriceLabel price={price} mrp={mrp} suffix={priceSuffix} size="lg" />
      </div>

      {/* actions — each button is as wide as what's in it, Discounts on the
          left and Add on the right, rather than two halves of a row. Both are
          40px tall in every state, so nothing grows or shrinks when a product
          goes into the cart. */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {onDiscounts ? (
          <Button variant="soft" className="h-10 font-medium" onClick={onDiscounts}>
            Discounts
            <ChevronDownIcon />
          </Button>
        ) : (
          <span />
        )}
        <div>
          {qty > 0 ? (
            <QtyPill qty={qty} onEdit={onAdd} label={name} />
          ) : (
            <Button className="h-10" onClick={onAdd}>
              + Add
            </Button>
          )}
        </div>
      </div>

      {/* who it's from, then when it comes — both under the rule, below the
          actions. The seller wears the badge the Distributor label used to:
          which of the two it is follows from the list you're on, but WHICH
          seller doesn't, so that's the part worth stating. */}
      {(seller || footer) && (
        <div className="mt-3 border-t border-border pt-2">
          {seller && (
            <Badge variant="info" className="max-w-full truncate">
              {seller}
            </Badge>
          )}
          {footer && (
            <div
              className={`flex items-center justify-between text-xs text-foreground-secondary${seller ? ' mt-1.5' : ''}`}
            >
              {footer}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
