// Buyer + Auth screen ids (Paytm + Salesperson excluded from the RN port).
// Mirrors qwipo-buyer-paytm-app/src/review/screenIndex.ts ids so the flow matches.
export type ScreenId =
  // Auth
  | 'splash'
  | 'login'
  | 'otp'
  | 'onboarding'
  | 'kyc-complete'
  | 'kyc-success'
  // Browse
  | 'home'
  | 'distributors-list'
  | 'wholesaler-categories'
  | 'global-search'
  // Shop
  | 'storefront'
  | 'listing'
  | 'wholesaler-products'
  | 'reorder'
  // Cart & Checkout
  | 'cart'
  | 'view-items'
  | 'order-summary'
  | 'coupons'
  | 'order-confirmation'
  // Orders
  | 'my-orders'
  | 'order-details'
  // Account
  | 'profile'
  | 'notifications'
  | 'sub:business-details'
  | 'sub:addresses'
  | 'sub:payment'
  | 'sub:payment-orders'
  | 'sub:payment-gateways'
  | 'sub:credit'
  | 'sub:language'
  | 'sub:help'
  | 'sub:terms';

// Root screens show the bottom nav; everything else is a pushed screen with a back button.
export const ROOT_SCREENS: ScreenId[] = ['home', 'reorder', 'cart', 'profile'];

// Screens that gate app entry (no bottom nav, full-bleed).
export const AUTH_SCREENS: ScreenId[] = ['splash', 'login', 'otp', 'onboarding', 'kyc-complete', 'kyc-success'];
