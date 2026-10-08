import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge, Button, Card, Chip, QtyStepper } from '@mockups/ui';
import { ProductImage, PriceLabel, formatInr } from '@mockups/components';
import type { WholesalerProduct } from '../data/wholesaler';
import { VendorPicker } from './VendorPicker';

/* The wholesale product card. Unlike the distributor card, the same SKU is
   offered by several vendors at different prices, so the card carries the
   vendor picker and reads its price, margin and delivery off whichever one is
   chosen. Shared by the wholesaler Product List and Reorder's Wholesalers tab.

   Exported from here rather than duplicated: the two screens must show the
   same card, or the same SKU looks like two products. */
export function VendorProductCard({
  product,
  vendorId,
  onVendor,
  qty,
  onQty,
  onAdd,
  onImageClick,
  onDiscounts,
  badge,
}: {
  product: WholesalerProduct;
  vendorId: string;
  onVendor: (id: string) => void;
  qty: number;
  onQty: (n: number) => void;
  onAdd: () => void;
  onImageClick: () => void;
  onDiscounts: () => void;
  /** Strip above the name — see ProductCard. */
  badge?: ReactNode;
}) {
  const [variant, setVariant] = useState(product.variants[0].id);
  const selected = product.vendors.find((v) => v.id === vendorId) ?? product.vendors[0];

  return (
    <Card className="p-3">
      {badge && <div className="mb-2">{badge}</div>}
      {/* image (left) + info (right); square image sized to the info column's
          height — same layout as the distributor card. Image opens the gallery. */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onImageClick}
          aria-label={`View images of ${product.name}`}
          className="grid h-24 w-24 shrink-0 place-items-center rounded-lg border border-border bg-card text-4xl active:scale-[0.98]"
        >
          <ProductImage image={product.images?.[variant] ?? product.image} alt={product.name} />
        </button>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onAdd}
            aria-label={`Open selling units for ${product.name}`}
            className="block w-full text-left active:scale-[0.99]"
          >
            <div className="text-sm font-semibold leading-snug text-foreground">{product.name}</div>
            <div className="mt-0.5 text-xs text-foreground-secondary">{product.caseLabel}</div>
          </button>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <Chip key={v.id} selected={v.id === variant} onClick={() => setVariant(v.id)} className="px-2.5 py-1">
                {v.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <VendorPicker
        className="mt-3"
        vendors={product.vendors}
        value={vendorId}
        onChange={onVendor}
      />

      {/* The chosen vendor's terms, read across two rows: when it arrives
          against what it lists at, then the margin against what it costs.
          Splitting MRP off the price label puts each number beside the one it
          qualifies — the distributor card stacks them instead, because it has
          no vendor to choose and the delivery day lives in its footer. */}
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-medium text-success-foreground">
          {selected.delivery}
        </span>
        {selected.mrp > selected.price && (
          <span className="shrink-0 text-xs text-foreground-secondary">
            MRP <span className="line-through">{formatInr(selected.mrp)}</span>
          </span>
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <Badge variant="success">{selected.margin}</Badge>
        <PriceLabel price={selected.price} suffix="/pc" size="lg" />
      </div>

      {/* Discounts + Add, laid out as on the distributor card — each as wide
          as its own contents, one to each end, 40px tall in either state.
          Wholesale SKUs run schemes too, so the sheet has something to say. */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <Button variant="soft" className="h-10 font-medium" onClick={onDiscounts}>
          Discounts
          <ChevronDown className="h-4 w-4" />
        </Button>
        <div>
          {qty > 0 ? (
            <QtyStepper value={qty} onChange={onQty} tone="soft" className="h-10" />
          ) : (
            <Button className="h-10" onClick={onAdd}>
              + Add
            </Button>
          )}
        </div>
      </div>

    </Card>
  );
}
