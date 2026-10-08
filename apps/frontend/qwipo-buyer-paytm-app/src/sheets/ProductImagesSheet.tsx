import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Sheet, cn } from '@mockups/ui';
import { ProductImage } from '@mockups/components';

/** Minimal shape both distributor Products and WholesalerProducts satisfy. */
export interface GalleryProduct {
  image?: string;
  /** The product's own photographs, in the order they should be paged. */
  gallery?: string[];
  name?: string;
}

/* Product images sheet — opened by tapping a product card's thumbnail. Pages
   through the pictures a product actually has: swipe sideways or tap the
   arrows. Nothing is simulated, so a product with one picture opens as one
   picture, with no arrows and no dots to suggest otherwise. */

/** As many as a card is expected to carry. */
const MAX_IMAGES = 5;

function Preview({ image }: { image: string }) {
  return (
    <div className="grid aspect-square w-full select-none place-items-center overflow-hidden rounded-xl border border-border bg-muted">
      {/* The picture, not the string that points at it: a photographed SKU
          carries a path here, and printing it read as literal text.

          No padding: the photo takes the whole square. The arrows sit on top
          of it, in the corners. */}
      <span className="grid h-full w-full place-items-center text-9xl leading-none" aria-hidden>
        <ProductImage image={image} />
      </span>
    </div>
  );
}

export function ProductImagesSheet({
  product,
  onClose,
}: {
  product: GalleryProduct | null;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const shots = (product?.gallery?.length ? product.gallery : [product?.image ?? '📦']).slice(
    0,
    MAX_IMAGES
  );
  const len = shots.length;
  const many = len > 1;
  const step = (d: number) => setIdx((p) => (p + d + len) % len);
  const at = Math.min(idx, len - 1);

  /* Swipe the picture sideways to change it, the way a phone gallery works —
     the arrows stay for anyone who'd rather tap. */
  const [dx, setDx] = useState(0);
  const swipe = useRef<number | null>(null);
  const SWIPE = 44; // far enough that a tap on an arrow never counts as one

  const swipeDown = (e: ReactPointerEvent) => {
    // A press that starts on an arrow is a tap on that arrow, not a swipe.
    if (!many || (e.target as HTMLElement).closest('button')) return;
    swipe.current = e.clientX;
  };
  const swipeMove = (e: ReactPointerEvent) => {
    if (swipe.current === null) return;
    // Damped, so the picture follows the finger without sliding off the sheet.
    setDx((e.clientX - swipe.current) * 0.4);
  };
  const swipeUp = () => {
    if (swipe.current === null) return;
    if (Math.abs(dx) > SWIPE * 0.4) step(dx < 0 ? 1 : -1);
    swipe.current = null;
    setDx(0);
  };

  return (
    /* Tighter than a form sheet: the picture is the content, so it takes the
       width and the padding gets out of its way — heading included. */
    <Sheet
      open={!!product}
      onClose={onClose}
      title={product?.name ?? 'Product images'}
      bodyClassName="p-3"
      headerClassName="px-4 py-2.5"
    >
      <div
        className={cn('relative w-full select-none', many && 'touch-pan-y')}
        onPointerDown={swipeDown}
        onPointerMove={swipeMove}
        onPointerUp={swipeUp}
        onPointerCancel={swipeUp}
        onPointerLeave={swipeUp}
        /* Pressing on the photo itself would otherwise start the browser's own
           image drag, which cancels the pointer stream — so a swipe worked
           everywhere except on the picture, which is where you'd start one. */
        onDragStart={(e) => e.preventDefault()}
      >
        <div
          className={cn(!dx && 'transition-transform duration-200')}
          style={dx ? { transform: `translateX(${dx}px)` } : undefined}
        >
          <Preview image={shots[at]} />
        </div>

        {many && (
          <>
            {/* In the bottom corners rather than across the middle of the
                picture, which is the part worth looking at. */}
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {many && (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {shots.map((src, i) => (
            <span
              key={src}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === at ? 'w-4 bg-primary' : 'w-1.5 bg-foreground-secondary/30'
              )}
            />
          ))}
        </div>
      )}
    </Sheet>
  );
}
