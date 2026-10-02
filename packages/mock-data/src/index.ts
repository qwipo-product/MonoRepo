/**
 * @mockups/mock-data — one import for every fake entity in the lab.
 *
 *   import { products, distributors, initialCart } from '@mockups/mock-data';
 *
 * Deep imports also work when you only want one slice and care about bundle
 * size (`generatedProducts` alone is ~8k lines):
 *
 *   import { IMG } from '@mockups/mock-data/imageBank';
 *
 * Shapes live in @mockups/types. If you add a field here, add it there too —
 * apps/backend/mock-api serves this same data over HTTP, so the two stay
 * honest with each other for free.
 */
export * from './mockData';
export { generatedProducts } from './generatedProducts';
export { IMG } from './imageBank';
export { sellerOrders } from './sellerOrders';
export { sellerAccounts, sellerSkus, sellerCustomers, sellerSchemes } from './sellerCatalog';
