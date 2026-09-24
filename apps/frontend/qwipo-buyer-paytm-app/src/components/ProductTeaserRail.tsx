import { Badge, Card } from '@mockups/ui';
import { PriceLabel, ProductImage } from '@mockups/components';
import type { ProductTeaser } from '../data/teaser';
import { CarouselDots } from './CarouselDots';
import { useAutoAdvance } from './useAutoAdvance';

/* The Home product rail — two compact cards to a page, the pages walking
   sideways on their own. Used by Previously Ordered and Trending Products,
   which differ only in what they rank and where they lead. A teaser, not the
   product list: no pack pills and no Add, because the quantity always gets
   chosen on a product card or in the selling-units sheet, never from a Home
   rail. */

/** Two rows to a page; the callers cap the list at four pages' worth. */
const PER_PAGE = 2;
const ADVANCE_MS = 5000;

function TeaserCard({ item: p, onOpen }: { item: ProductTeaser; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={p.name}
      className="block w-full text-left active:scale-[0.99]"
    >
      {/* The plate is as tall as the text column beside it (two lines of name
          plus the price block), so the mark fills the card instead of
          floating in the middle of it. */}
      <Card className="flex items-center gap-3 p-2.5">
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
      </Card>
    </button>
  );
}

export function ProductTeaserRail({
  items,
  onOpen,
}: {
  items: ProductTeaser[];
  onOpen: () => void;
}) {
  const pages = Array.from({ length: Math.ceil(items.length / PER_PAGE) }, (_, i) =>
    items.slice(i * PER_PAGE, i * PER_PAGE + PER_PAGE)
  );
  const { index, autoplay, fillRef, railProps } = useAutoAdvance(pages.length, ADVANCE_MS);

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
