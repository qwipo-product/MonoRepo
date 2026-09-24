import { Badge, Card } from '@mockups/ui';
import { PriceLabel } from '@mockups/components';
import type { RepeatBuy } from '../data/reorder';
import { CarouselDots } from './CarouselDots';
import { useAutoAdvance } from './useAutoAdvance';

/* Previously Ordered — the buyer's repeat buys, two to a page, the pages
   walking sideways on their own. A teaser, not the product list: no pack
   pills and no Add, because the quantity always gets chosen on the Reorder
   page or in the selling-units sheet, never from a home rail. */

/** Two rows to a page, four pages at most — see `previouslyOrdered`. */
const PER_PAGE = 2;
const ADVANCE_MS = 5000;

function PreviousItem({ item: p, onOpen }: { item: RepeatBuy; onOpen: () => void }) {
  const isUrl = /^https?:\/\//.test(p.image);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Reorder ${p.name}`}
      className="block w-full text-left active:scale-[0.99]"
    >
      <Card className="flex items-center gap-3 p-2.5">
        <div className="grid h-18 w-18 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-card text-3xl">
          {isUrl ? (
            <img src={p.image} alt="" className="h-full w-full object-contain" />
          ) : (
            <span aria-hidden>{p.image}</span>
          )}
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

export function PreviouslyOrderedRail({
  items,
  onOpen,
}: {
  items: RepeatBuy[];
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
              <PreviousItem key={it.id} item={it} onOpen={onOpen} />
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
