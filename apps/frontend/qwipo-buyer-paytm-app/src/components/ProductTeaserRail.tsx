import { Badge, Card } from '@mockups/ui';
import { PriceLabel, ProductImage } from '@mockups/components';
import type { ProductTeaser } from '../data/teaser';
import { CarouselDots } from './CarouselDots';
import { useAutoAdvance } from './useAutoAdvance';
import { OfflineBadge, useSellerOffline } from './SellerOffline';

/* The Home product rail — two compact cards to a page, the pages walking
   sideways on their own. Used by Previously Ordered and Trending Products,
   which differ only in what they rank. A teaser, not the product list: no
   pack pills and no Add on the card itself, because the quantity is always
   chosen in the selling-units sheet — which is what tapping a card opens. */

/** Two rows to a page; the callers cap the list at four pages' worth. */
const PER_PAGE = 2;
const ADVANCE_MS = 5000;

function TeaserCard({ item: p, onOpen }: { item: ProductTeaser; onOpen: (id: string) => void }) {
  const { notify } = useSellerOffline();
  const off = p.offlineSeller;
  return (
    <button
      type="button"
      onClick={() => (off ? notify(off) : onOpen(p.id))}
      aria-label={off ? `${p.name} is unavailable: ${off} is currently offline` : p.name}
      className="block w-full text-left active:scale-[0.99]"
    >
      {/* The plate is as tall as the text column beside it (two lines of name
          plus the price block), so the mark fills the card instead of
          floating in the middle of it. */}
      <Card className="relative flex items-center gap-3 p-2.5">
        {off && <OfflineBadge className="absolute right-2 top-2 z-10" />}
        <div className={off ? 'flex min-w-0 flex-1 items-center gap-3 opacity-50 grayscale' : 'contents'}>
        <div className="grid h-22 w-22 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-card text-4xl">
          <ProductImage image={p.image} alt={p.name} />
        </div>
        <div className="min-w-0 flex-1">
          {/* Always two lines tall, so the two cards on a page line up whether
              the name wraps or not. */}
          <div className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-foreground">
            {p.name}
          </div>
          <div className="mt-1.5 flex items-end justify-between gap-2">
            <Badge variant="success">{p.margin}</Badge>
            <PriceLabel price={p.price} mrp={p.mrp} suffix="/pc" size="lg" />
          </div>
        </div>
        </div>
      </Card>
    </button>
  );
}

export function ProductTeaserRail({
  items,
  onOpen,
  paused = false,
}: {
  items: ProductTeaser[];
  /** Tapping a card hands back its product id — the rails open its sheet. */
  onOpen: (id: string) => void;
  /** True while the add-to-cart sheet one of these cards opened is up. */
  paused?: boolean;
}) {
  const pages = Array.from({ length: Math.ceil(items.length / PER_PAGE) }, (_, i) =>
    items.slice(i * PER_PAGE, i * PER_PAGE + PER_PAGE)
  );
  const { index, autoplay, fillRef, railProps } = useAutoAdvance(pages.length, ADVANCE_MS, paused);

  return (
    <div>
      <div {...railProps} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
        {pages.map((page, j) => (
          <div key={j} className="w-full shrink-0 snap-start space-y-2 px-4">
            {page.map((it) => (
              <TeaserCard key={it.id} item={it} onOpen={onOpen} />
            ))}
          </div>
        ))}
      </div>
      {pages.length > 1 && (
        <CarouselDots count={pages.length} index={index} autoplay={autoplay} fillRef={fillRef} />
      )}
    </div>
  );
}
