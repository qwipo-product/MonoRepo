import { ProductImage } from '@mockups/components';
import { cn } from '@mockups/ui';
import { imageOf } from '../catalog';

const SIZE = {
  sm: 'h-12 w-12 text-2xl',
  md: 'h-16 w-16 text-3xl',
  lg: 'h-24 w-24 text-5xl',
} as const;

/* A product's picture in a fixed square plate. ProductImage fills whatever
   box it sits in, so the box sets the size — never the image. Every product
   picture in the app goes through here, so they all line up. */
export function ProductThumb({
  productId,
  image,
  alt,
  size = 'sm',
}: {
  productId?: string;
  /** The seller's own primary picture — wins over the catalogue's. */
  image?: string;
  alt: string;
  size?: keyof typeof SIZE;
}) {
  return (
    <span className={cn('grid shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-card', SIZE[size])}>
      <ProductImage image={image ?? (productId ? imageOf(productId) : undefined)} alt={alt} />
    </span>
  );
}
