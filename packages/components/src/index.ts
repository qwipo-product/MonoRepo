/**
 * @mockups/components — product components composed from @mockups/ui primitives
 * and @mockups/types. Layer 5: these know product semantics (order status,
 * price, pack tiers) where primitives do not.
 *
 * Used by the Qwipo Buyer / Paytm application.
 */
export { StatusBadge, orderStatusMap, type StatusBadgeProps } from './StatusBadge';
export { PriceLabel, formatInr, formatInrExact, type PriceLabelProps } from './PriceLabel';
export { ProductImage, isProductPhoto, type ProductImageProps } from './ProductImage';
export { ProductCard, type ProductCardProps, type PackPill } from './ProductCard';
export { QtyPill, type QtyPillProps } from './QtyPill';
