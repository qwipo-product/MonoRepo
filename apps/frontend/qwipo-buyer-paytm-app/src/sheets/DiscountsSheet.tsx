import { ChevronDown, Percent } from 'lucide-react';
import { Sheet } from '@mockups/ui';
import { offersForProduct, type Offer } from '../data/offers';
import { OfferIconChip, SchemeProgressBar, SlabTable } from '../components/OfferBits';

/* Offers & Schemes sheet — opened from a product card's "Discounts" button.
   Shows only what actually runs on THIS product (ONDC applicability:
   item_ids / seller-wide offers), not a fixed table:

     Primary   — the product's QPS slab table (unit price per band) and/or the
                 seller's invoice value slab
     Secondary — cart/checkout schemes touching this product, as expandable
                 rows with eligibility, validity and scheme progress. */

export interface DiscountsProduct {
  id: string;
  shortName: string;
  seller: string;
  price: number;
}

export function DiscountsSheet({
  product,
  onClose,
}: {
  product: DiscountsProduct | null;
  onClose: () => void;
}) {
  const offers = product ? offersForProduct(product) : [];
  const primary = offers.filter((o) => o.level === 'primary');
  const secondary = offers.filter((o) => o.level === 'secondary');

  return (
    <Sheet
      open={product != null}
      onClose={onClose}
      icon={<Percent size={18} />}
      title="Offers & Schemes"
      subtitle={product ? `On ${product.shortName} · ${product.seller}` : undefined}
    >
      {offers.length === 0 && (
        <p className="py-6 text-center text-sm text-foreground-secondary">
          No running schemes on this product right now.
        </p>
      )}

      {/* primary — the price you buy at */}
      {primary.map((o) => (
        <section key={o.id} className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            {o.itemIds.length > 0 ? 'Buy more, pay less' : 'On your total bill'}
          </h3>
          {/* QPS on this item shows the resulting unit price; the seller-wide
              value slab has no per-unit price — bands + % only */}
          <SlabTable offer={o} unitPrice={o.itemIds.length > 0 && product ? product.price : undefined} />
        </section>
      ))}

      {/* secondary — applied on the cart, settled at checkout */}
      {secondary.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-foreground">More offers on this product</h3>
          <div className="space-y-3">
            {secondary.map((o) => (
              <SecondaryRow key={o.id} offer={o} />
            ))}
          </div>
        </section>
      )}
    </Sheet>
  );
}

function SecondaryRow({ offer }: { offer: Offer }) {
  return (
    <details className="group rounded-lg border border-border bg-card [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
        <OfferIconChip offer={offer} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">{offer.title}</span>
          <span className="block text-xs text-foreground-secondary">{offer.eligibility}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-foreground-secondary transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-2.5 border-t border-border p-3">
        <div className="text-sm font-medium text-success-foreground">{offer.benefit}</div>
        {offer.progress && <SchemeProgressBar progress={offer.progress} />}
      </div>
    </details>
  );
}
