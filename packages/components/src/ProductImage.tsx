// ProductImage — a product's picture, whether that's a photo or a stand-in
// emoji. The fixtures carry both: most SKUs are still an emoji, the ones that
// have been shot carry a path. Everywhere a product is drawn goes through
// here, so a path never lands on screen as literal text.

import { cn } from '@mockups/ui';

/** A path ("./product-images/…", "/…") or a URL is a picture; anything else
    is an emoji. Paths are relative to the page since preview builds. */
export const isProductPhoto = (image?: string) => !!image && /^(https?:\/\/|\.?\/)/.test(image);

export interface ProductImageProps {
  image?: string;
  /** Names the product for screen readers; the picture itself is decorative. */
  alt?: string;
  className?: string;
}

export function ProductImage({ image, alt = '', className }: ProductImageProps) {
  if (isProductPhoto(image)) {
    /* The picture goes in a box of its own rather than straight into the
       plate. The plates centre their content, and an <img> carries an
       intrinsic aspect ratio, so it ignores a stretch and a percentage height
       has nothing definite to resolve against — a tall pack (the 1 L bottle
       is over three times its frame) grew past the plate and was clipped. A
       plain span has no ratio of its own, so it does take the plate's size,
       and the picture fills it absolutely: contained, centred, edge to edge
       on whichever side runs out first. */
    return (
      <span className="relative block h-full w-full self-stretch justify-self-stretch">
        <img
          src={encodeURI(image!)}
          alt={alt}
          className={cn('absolute inset-0 h-full w-full object-contain', className)}
        />
      </span>
    );
  }
  return <span aria-hidden>{image ?? '📦'}</span>;
}
