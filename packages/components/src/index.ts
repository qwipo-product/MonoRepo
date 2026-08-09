/**
 * @mockups/components — product components composed from @mockups/ui primitives
 * and @mockups/types. Layer 5: these know product semantics (order status,
 * price, pack tiers) where primitives do not.
 *
 * Shared contract across web and native; platform-specific rendering lives in
 * `.tsx` (web) / `.native.tsx` (React Native) files as the set grows.
 */
export { StatusBadge, orderStatusMap, type StatusBadgeProps } from './StatusBadge';
export { PriceLabel, formatInr, formatInrExact, type PriceLabelProps } from './PriceLabel';
export { ProductCard, type ProductCardProps, type PackPill } from './ProductCard';
