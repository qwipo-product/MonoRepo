/** Screen ids for the prototype's push/back router (App.tsx). */
export type Screen =
  // root tabs
  | 'home'
  | 'reorder'
  | 'cart'
  // shop
  | 'listing'
  | 'storefront'
  | 'distributors'
  | 'wholesalers'
  | 'search'
  // checkout
  | 'order-summary'
  | 'coupons'
  | 'order-confirmation'
  // orders
  | 'my-orders'
  | 'order-details'
  | 'notifications'
  // account
  | 'account'
  | 'business-details'
  | 'addresses'
  | 'payments'
  | 'credit'
  | 'settings'
  | 'language'
  | 'contact'
  | 'terms'
  // auth
  | 'splash'
  | 'login'
  | 'otp'
  | 'onboarding'
  | 'kyc'
  | 'kyc-success';

export type Navigate = (s: Screen) => void;
