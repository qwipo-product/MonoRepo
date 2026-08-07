import * as data from '@mockups/mock-data';

/**
 * Every exported array in @mockups/mock-data, keyed by the URL slug it is
 * served under. Adding an endpoint is one line here — the routes in index.ts
 * are generic and pick it up automatically.
 */
export const collections = {
  products: data.products,
  'generated-products': data.generatedProducts,
  categories: data.categories,
  brands: data.brands,
  'all-brands': data.allBrandsList,
  distributors: data.distributors,
  'distributors-list': data.distributorsList,
  'distributor-categories': data.distributorCategories,
  'wholesaler-categories': data.wholesalerCategories,
  'wholesalers-groceries': data.wholesalersGroceries,
  'wholesalers-fmcg': data.wholesalersFMCG,
  'wholesalers-all': data.wholesalersAllCategories,
  'hero-banners': data.heroBanners,
  'wholesaler-banners': data.wholesalerBanners,
  'exclusive-offers': data.exclusiveOffers,
  orders: data.orderHistoryList,
  'reorder-history': data.reorderHistory,
  notifications: data.notifications,
  addresses: data.savedAddresses,
  'payment-methods': data.paymentMethods,
  'help-topics': data.helpTopics,
  'mov-suggestions': data.movSuggestions,
} satisfies Record<string, readonly unknown[]>;

/** Single objects (not lists) — served whole at /api/singletons/:name. */
export const singletons = {
  seller: data.seller,
  cart: data.initialCart,
  profile: data.userProfile,
  'brand-registry': data.brandRegistry,
  'seller-type-map': data.sellerTypeMap,
  'distributor-category-map': data.DIST_CAT_TO_PRODUCT_CAT,
  images: data.IMG,
} satisfies Record<string, unknown>;

export type CollectionName = keyof typeof collections;
export type SingletonName = keyof typeof singletons;
