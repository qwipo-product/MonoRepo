import { X } from 'lucide-react';
import { Sheet } from '@mockups/ui';
import { useAutoAdvance } from '../components/useAutoAdvance';
import { CarouselDots } from '../components/CarouselDots';

/* Full-screen promotional banners — what greets a buyer on Home when a brand
   has something to announce. Tall 9:16 artwork, one banner per page, walking
   itself every few seconds and swipeable by hand.

   It is a Sheet like every other, so it keeps the handle and drag-to-dismiss.
   What it drops is the header: these creatives are designed to BE the screen —
   headline, pack shot, Shop Now, the Qwipo/ONDC lockup are all inside the
   picture — so a title bar above them would only repeat the artwork badly and
   crop it. The close ✕ and the dots sit on the picture instead. */

const BANNERS = [
  { src: './promo-banners/colgate-onboarding.webp', alt: 'Colgate is now on Qwipo' },
  { src: './promo-banners/itc-on-qwipo.webp', alt: 'ITC is now available on Qwipo' },
  { src: './promo-banners/emami-on-qwipo.webp', alt: 'Emami is now available on Qwipo' },
];

/** Long enough to read a banner, short enough that all three get seen. */
const HOLD_MS = 4000;

export function PromoBannersSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { index, autoplay, fillRef, railProps } = useAutoAdvance(BANNERS.length, HOLD_MS);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      /* The phone frame is itself 9:16, so a full-height sheet lets the
         artwork land close to its own proportions. It keeps the rounded top
         every other sheet has — and clips to it, or the artwork would square
         the corners off from the inside. */
      className="h-full overflow-hidden"
      bodyClassName="relative p-0"
    >
      <div
        {...railProps}
        className="no-scrollbar flex h-full cursor-grab snap-x snap-mandatory select-none overflow-x-auto active:cursor-grabbing"
      >
        {BANNERS.map((b) => (
          <img
            key={b.src}
            src={b.src}
            alt={b.alt}
            /* Native image dragging would swallow the swipe before the rail
               ever sees it — the same thing that stopped the product gallery
               moving from the centre. */
            onDragStart={(e) => e.preventDefault()}
            className="h-full w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/85 text-foreground shadow-sm backdrop-blur active:scale-[0.98]"
      >
        <X size={18} />
      </button>

      {/* On a plate, not bare on the artwork: a brand-blue dot has to stay
          legible whatever the banner behind it happens to be. */}
      <CarouselDots
        count={BANNERS.length}
        index={index}
        autoplay={autoplay}
        fillRef={fillRef}
        className="absolute inset-x-0 bottom-4 mx-auto mt-0 w-fit rounded-full bg-card/85 px-2 py-1.5 shadow-sm backdrop-blur"
      />
    </Sheet>
  );
}
