// ProductImage — a product's picture, whether that's a photo or a stand-in
// emoji. The fixtures carry both: most SKUs are still an emoji, the ones that
// have been shot carry a path. Everywhere a product is drawn goes through
// here, so a path never lands on screen as literal text.

import { cn } from '@mockups/ui';

/** A path ("/product-images/…") or a URL is a picture; anything else is an emoji. */
export const isProductPhoto = (image?: string) => !!image && /^(https?:\/\/|\/)/.test(image);

export interface ProductImageProps {
  image?: string;
  /** Names the product for screen readers; the picture itself is decorative. */
  alt?: string;
  className?: string;
}

export function ProductImage({ image, alt = '', className }: ProductImageProps) {
  if (isProductPhoto(image)) {
    return <img src={encodeURI(image!)} alt={alt} className={cn('h-full w-full object-contain', className)} />;
  }
  return <span aria-hidden>{image ?? '📦'}</span>;
}
