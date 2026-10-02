// Shared domain types for the Qwipo Buyer App.
// Framework-agnostic — usable from React, Angular, Vue, or plain TS.

export type StockStatus = 'available' | 'limited' | 'out';

export type SellerType = 'distributor' | 'wholesaler';

export type SortKey =
  | 'recommended'
  | 'price_asc'
  | 'price_desc'
  | 'margin_desc';

export interface ProductVariant {
  id: string;
  size: string;
  casePack: string;
  casePcs: number;
  mrp: number;
  sellingPrice: number;
  casePrice: number;
  discount: number;
  margin: number;
  stock: StockStatus;
  moq: number;
  scheme: string | null;
}

export type DeliveryOption = 'beat' | 'tomorrow';

export interface Product {
  id: string;
  name: string;
  brand: string;
  manufacturer: string;
  countryOfOrigin: string;
  hsn: string;
  gst: number;
  category: string;
  image: string;
  images: string[];
  bgColor: string;
  variants: ProductVariant[];
  // Which per-seller delivery slots this SKU is eligible for. Omitted means
  // both (default). Use ['tomorrow'] for perishables / express-only SKUs and
  // ['beat'] for items only offered on the beat-day route.
  deliveryOptions?: DeliveryOption[];
}

export interface Seller {
  id: string;
  name: string;
  shortName: string;
  location: string;
  mov: number;
  deliveryTime: string;
  deliveryFee: string;
  isVerified: boolean;
  yearsActive: number;
  totalSKUs: number;
}

export interface Distributor {
  id: string;
  name: string;
  shortName: string;
  location: string;
  mov: number;
  skuCount: number;
  featuredBrand: string;
  featuredBrandTitle: string;
  featuredColor: string;
  isAuthorised: boolean;
}

export interface BrandRegistryEntry {
  name: string;
  parent: string;
  founded: number;
  hq: string;
  color: string;
  logo: string | null;
}

export interface Brand extends BrandRegistryEntry {
  id: string;
  logoText: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
  image?: string;
}

export interface HeroBanner {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  bullets: string[];
  cta: string;
  bg: string;
  emoji: string;
  image?: string;
}

export interface WholesalerBanner {
  id: string;
  tag: string;
  title: string;
  discount: string;
  cta: string;
  bg: string;
  emoji: string;
}

export interface WholesalerCategory {
  id: string;
  name: string;
  bg: string;
  emoji: string;
  image?: string;
}

export interface ExclusiveOffer {
  id: string;
  title: string;
  subtitle: string;
  discount: string;
  bg: string;
  textColor: string;
  emoji: string;
}

export interface CartItem {
  productId: string;
  name: string;
  variant: string;
  image: string;
  bgColor: string;
  brand: string;
  mrp: number;
  price: number;
  quantity: number;
  unit: string;
  scheme: string | null;
  freeQty?: number;
  extraDiscount?: number;
  flatOff?: number;
  // Per-piece weight in kg — drives a vendor's minimum-order-weight check.
  weight?: number;
}

export interface CartSeller {
  id: string;
  name: string;
  logo: string;
  logoColor: string;
  mov: number;
  // Optional minimum order weight (kg). A vendor may enforce value, weight,
  // or both.
  minOrderWeight?: number;
  deliveryTime: string;
  sellerOffer: string | null;
  type?: 'distributor' | 'wholesaler';
  items: CartItem[];
  // Optional multiple selectable delivery windows, each with its own MOV
  // (e.g. a "Beat day" vs "Tomorrow" pill). Falls back to a generic
  // Beat/Tomorrow pair when absent.
  deliveryWindows?: { day: string; mov: number }[];
}

export interface Cart {
  sellers: CartSeller[];
}

export interface MovSuggestion {
  id: string;
  name: string;
  image: string;
  bgColor: string;
  price: number;
  mrp: number;
  casePcs: number;
  casePrice: number;
}

export interface ReorderHistoryEntry {
  productId: string;
  variantId: string;
  lastOrderedAt: string;
  lastQty: number;
  timesOrdered: number;
  sellerType: SellerType;
}

export type NotificationType = 'order' | 'promo' | 'stock' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  icon: string;
  iconColor: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export interface UserProfile {
  name: string;
  businessName: string;
  businessType: string;
  location: string;
  phone: string;
  email: string;
  gst: string;
  fssai: string;
  kycVerified: boolean;
  memberSince: string;
  totalOrders: number;
  totalSavings: number;
  creditLimit: number;
  creditUsed: number;
}

export interface SavedAddress {
  id: string;
  type: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  contact: string;
  isDefault: boolean;
  icon: string;
}

export type OrderStatus = 'placed' | 'in_transit' | 'processing' | 'delivered' | 'cancelled';

export interface OrderHistoryEntry {
  id: string;
  placedAt: string;
  seller: string;
  sellerLogo: string;
  sellerColor: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
  statusLabel: string;
  eta: string;
  items: string[];
}

// Seller side — mirrors the seller platform's real enums
// (seller-platform packages/types/src/order.ts), casing included.
export type SellerOrderStatus =
  | 'CREATED'
  | 'ACCEPTED'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type SellerOrderItemStatus = 'ORDERED' | 'FULFILLED' | 'CANCELLED' | 'RETURNED' | 'OUT_OF_STOCK';

export interface SellerOrderLine {
  id: string;
  productId: string; // → products[].id, for the picture
  skuCode: string;
  name: string;
  pack: string;
  qty: number;
  price: number; // per unit the buyer pays, ₹ (after any offer)
  /** Set when a "Buy more, save more" (QPS) slab applied: the price before it and the offer. */
  basePrice?: number;
  offerCode?: string;
  status: SellerOrderItemStatus;
}

export interface SellerOrderBuyer {
  storeName: string; // the customer's business name
  ownerName: string;
  mobile: string;
  address: string; // shop / street line, up to the area
  area: string;
  city: string;
  pincode: string;
  /** Exact shop location; null when the store never set it. */
  lat: number | null;
  lng: number | null;
  gstn?: string;
}

/** The seller platform's provider-agnostic logistics status (logistics-status.ts). */
export type SellerLogisticsStatus =
  | 'REQUESTED'
  | 'PENDING'
  | 'READY_FOR_SHIPMENT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'PARTIALLY_DELIVERED'
  | 'RETURNED'
  | 'CANCELLED'
  | 'OFFLINE_DELIVERY';

/** Set once a confirmed order is handed to a 3PL partner or a dark store. */
export interface SellerOrderLogistics {
  via: 'LOGISTICS' | 'DARK_STORE';
  partner: string; // e.g. "Shiprocket", "Moosapet Dark Store"
  status: SellerLogisticsStatus;
  awb?: string; // tracking number
}

export interface SellerOrder {
  id: string;
  /** Every order is for one company (brand owner) — the portal's Company column. */
  company: string;
  marketplace: 'ONDC' | 'AMAZON' | 'FLIPKART';
  /** The marketplace's own order number — what the buyer app shows. */
  channelOrderId?: string;
  placedAt: string; // ISO
  deliveryDate: string; // ISO date — expected delivery
  /** The beat (delivery route) the order rides on. null = quick delivery
   *  outside a beat, next day — the platform's "Non-Beat" order. */
  beatName: string | null;
  paymentMode: 'COD' | 'PREPAID';
  status: SellerOrderStatus;
  buyer: SellerOrderBuyer;
  lines: SellerOrderLine[];
  cancelReason?: string;
  cancelledBy?: 'SELLER' | 'CUSTOMER';
  cancelledAt?: string; // ISO
  logistics?: SellerOrderLogistics;
}

/** The rest of the portal's product form (My SKU → Product Details), read-only
 *  on the phone. An empty string = not filled in yet (an ONDC "Required"). */
export interface SellerSkuDetails {
  groupName: string;
  shortDescription: string;
  longDescription: string;
  measureUnit: 'Unit' | 'Gram' | 'Kilogram' | 'Liter' | 'Milliliter';
  unitValue: number;
  weightMeasure: 'Gram' | 'Kilogram';
  skuWeight: number;
  innerPack: number;
  unitsPerCase: number;
  sellingUnits: number[];
  dimensionsCm: [number, number, number]; // length, width, height
  categoryId: string; // ONDC eB2B taxonomy
  gstCessPct: number | null;
  fulfillmentId: string;
  locationId: string;
  timeToShip: string;
  customerCare: { name: string; email: string; phone: string };
  manufacturerAddress: string;
  countryOfOrigin: string;
  /** Up to 5 pictures, the first is the primary. A URL / path, or an emoji stand-in where no photo exists. */
  images: string[];
}

/** One sellable product for one seller (the portal's "My SKU"). Stock is a
 *  yes/no flag in the portal, not a quantity. */
export interface SellerSku {
  code: string;
  productId: string; // → products[].id, for the picture
  name: string;
  shortName?: string;
  company: string; // manufacturer / packer
  brand: string;
  category: string;
  pack: string;
  mrp: number;
  price: number; // selling price, ₹
  active: boolean;
  inStock: boolean;
  gstPct: number;
  minQty: number;
  maxQty: number;
  returnable: boolean;
  cancellable: boolean;
  cod: boolean; // available on cash on delivery
  /** ONDC fields still empty. Non-empty = "Non-compliant": listed but nobody can buy it. */
  missingFields: string[];
  updatedAt: string; // ISO date
  details: SellerSkuDetails;
}

export interface SellerCustomerBeat {
  company: string;
  beat: string;
  days: string[]; // 'Monday', …
  /** The customer is blocked for this company, so the beat doesn't serve them. */
  blocked?: boolean;
}

export interface SellerCustomerAddress {
  label: string;
  line: string; // shop / street, up to the area
  area: string;
  city: string;
  state: string;
  pincode: string;
  primary: boolean;
  /** Exact location; null = "Location not set" — beats can't be worked out. */
  lat: number | null;
  lng: number | null;
  /** Which company's beat serves this address — matched from the beat map. */
  serviceability: SellerCustomerBeat[];
  /** Linked companies with no beat at this address ("Not served at this address"). */
  notServedBy: string[];
}

export interface SellerCustomerCompany {
  name: string;
  registeredOn: string; // ISO date — first order with that company
  status: 'ACTIVE' | 'BLOCKED';
}

export interface SellerCustomer {
  customerId: string;
  storeName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  gstn?: string;
  addresses: SellerCustomerAddress[];
  companies: SellerCustomerCompany[];
}

export type SellerSchemeStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

/** A quantity slab: buy at least `min` (up to `max`, null = no top), get `discountPct` off. */
export interface SellerSchemeSlab {
  min: number;
  max: number | null;
  discountPct: number;
  /** Flat ₹ off per unit instead of a % (made on the web; shown read-only). */
  flatOff?: number;
}

/** A QPS offer — one product, slab discounts, starts the day it is made. */
export interface SellerScheme {
  code: string;
  skuCode: string;
  validFrom: string; // ISO date
  validTill: string;
  status: SellerSchemeStatus;
  slabs: SellerSchemeSlab[];
}

export interface SellerAccount {
  id: string;
  name: string;
  role: 'OWNER' | 'STAFF';
  gstId: string;
  address: string;
  contactName: string;
  phone: string;
  /** Connectors the seller has switched on — they light up the Logistics tab. */
  hasLogistics: boolean;
  hasDarkStore: boolean;
}

export type PaymentMethodType = 'upi' | 'card' | 'credit' | 'cod';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  identifier: string;
  name: string;
  icon: string;
  isDefault: boolean;
}

export interface HelpTopic {
  id: string;
  icon: string;
  title: string;
  items: string[];
}

export interface CategoryFilter {
  id: string;
  name: string;
  isBrand?: boolean;
}

export interface ListingFilters {
  sort: SortKey;
  stock: StockStatus[];
  brands: string[];
  minMargin: number;
  schemesOnly: boolean;
}

export type ScreenName =
  | 'home'
  | 'storefront'
  | 'listing'
  | 'cart'
  | 'reorder'
  | 'notifications'
  | 'profile'
  | 'sub:addresses'
  | 'sub:payment'
  | 'sub:credit'
  | 'sub:help'
  | 'sub:business-details'
  | 'sub:settings'
  | 'sub:notif-prefs'
  | 'sub:language'
  | 'sub:terms'
  | 'sub:invoices'
  | 'sub:refer';

export type NavTarget = 'home' | 'listing' | 'cart' | 'profile' | 'notifications';
