import { ShoppingBag } from 'lucide-react';
import { Button, Sheet } from '@mockups/ui';
import { ProductImage, formatInr } from '@mockups/components';
import type { CartItem, CartSeller } from '../data/cart';

/* Order Summary · View Items — read-only bottom sheet listing every line in one
   seller's order with its MRP, selling price, quantity and line total. Opened
   from the Order Summary "View items" link; review-only (no edit/remove), so it
   pairs with the editable Cart screen without duplicating its controls. */
export function OrderItemsSheet({
  open,
  seller,
  onClose,
}: {
  open: boolean;
  seller: CartSeller | null;
  onClose: () => void;
}) {
  if (!seller) return <Sheet open={false} onClose={onClose} />;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      icon={<ShoppingBag size={18} />}
      title={seller.name}
      subtitle={`${seller.items.length} ${seller.items.length === 1 ? 'item' : 'items'} in this order`}
      footer={
        <div className="flex items-center gap-3">
          <div>
            <div className="text-2xs font-medium uppercase tracking-wide text-foreground-secondary">
              Order total
            </div>
            <div className="text-lg font-bold tabular-nums text-foreground">{formatInr(seller.subtotal)}</div>
          </div>
          <Button className="flex-1" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-2.5">
        {seller.items.map((item, idx) => (
          <ItemRow key={`${item.product.id}-${idx}`} item={item} />
        ))}
      </div>
    </Sheet>
  );
}

function ItemRow({ item }: { item: CartItem }) {
  const { product, quantity, lineTotal, free } = item;
  return (
    <div className="flex gap-3 rounded-lg border border-border p-3">
      <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-card text-2xl">
        <ProductImage image={product.image} alt={product.name} />
        {free && (
          <span className="absolute inset-x-0 top-0 bg-success py-0.5 text-center text-2xs font-bold uppercase tracking-wide text-white">
            Free
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{product.shortName}</div>

        {free ? (
          <div className="mt-1 text-xs font-semibold text-success-foreground">Free item</div>
        ) : (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs tabular-nums text-foreground-secondary">
              MRP{' '}
              <span className="line-through">{formatInr(product.mrp)}</span>
            </span>
            <span className="text-sm font-semibold tabular-nums text-foreground">{formatInr(product.price)}</span>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <span className="inline-flex items-center rounded-md bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
            Qty ×{quantity}
          </span>
          <div className="text-right leading-tight">
            <div className="text-2xs uppercase tracking-wide text-foreground-secondary">Total</div>
            <div className="text-sm font-bold tabular-nums text-foreground">{formatInr(lineTotal)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
