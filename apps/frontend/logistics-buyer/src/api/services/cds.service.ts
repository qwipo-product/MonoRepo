// CDS client: its own sign-in session (separate from the Logistics Buyer login) and the CDS API.
import { http, HttpError } from '../http';
import type { Column, Report } from '../../cds/reports';
import type {
  AuditEntry, CdsOrder, CdsPage, CdsRole, CdsSettings, CdsStore, Collection, DeliveryPerson, DeliveryRoute, Distributor,
  OrderStatus, OtpTxn, Plan, Retailer, Trip, TripStatus, TripStop, TripType, Vehicle,
} from '../../cds/types';

const BASE = 'mock://cds-svc/api/v1';
const K = { token: 'cdsToken', user: 'cdsUser' };

export interface CdsSessionUser { id: string; name: string; mobile: string; email: string; role: CdsRole; cdsStoreIds: string[]; pages: CdsPage[] }

type Listener = () => void;
const listeners = new Set<Listener>();
const readJson = <T>(k: string): T | null => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
};

export const cdsAuth = {
  token: localStorage.getItem(K.token),
  user: readJson<CdsSessionUser>(K.user),
  /** True after a deliberate sign-out (the sign-in page then opens without a return link). */
  signedOut: false,
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  emit() {
    listeners.forEach((l) => l());
  },
  isSignedIn() {
    return !!this.token && !!this.user?.pages;
  },
  canView(p: CdsPage) {
    return !!this.user?.pages?.includes(p);
  },
  isSC() {
    return this.user?.role === 'SERVICE_CENTRE';
  },
  /** Both roles start on Orders, the first item of their menu. */
  home() {
    return '/cds/orders';
  },
  set(token: string, user: CdsSessionUser) {
    localStorage.setItem(K.token, token);
    localStorage.setItem(K.user, JSON.stringify(user));
    this.token = token;
    this.user = user;
    this.signedOut = false;
    this.emit();
  },
  clear(signedOut = false) {
    this.signedOut = signedOut;
    [K.token, K.user].forEach((k) => localStorage.removeItem(k));
    this.token = null;
    this.user = null;
    this.emit();
  },
};

async function call<T>(method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown, params?: Record<string, string | number | undefined>): Promise<T> {
  const headers: Record<string, string> = cdsAuth.token ? { 'X-Cds-Token': cdsAuth.token } : {};
  try {
    const opts = { skipAuth: true, headers, params };
    const res = method === 'GET' ? await http.get<{ data: T }>(`${BASE}${path}`, opts)
      : method === 'PUT' ? await http.put<{ data: T }>(`${BASE}${path}`, body ?? {}, opts)
      : await http.post<{ data: T }>(`${BASE}${path}`, body ?? {}, opts);
    return res.data;
  } catch (e) {
    if (e instanceof HttpError && e.status === 401 && !path.startsWith('/cds/auth/')) {
      cdsAuth.clear();
      if (window.location.pathname.startsWith('/builds/')) window.location.hash = '/cds/login';
      else window.location.assign('/cds/login');
    }
    throw e;
  }
}

/** Message of an API error, for alerts. */
export function cdsErrorText(e: unknown): string {
  if (e instanceof HttpError) {
    const b = e.error as { message?: string; error?: { message?: string } } | string;
    if (typeof b === 'string') return b;
    return b?.message || b?.error?.message || e.message;
  }
  return (e as Error)?.message || 'Something went wrong';
}

export interface Paged<T> { rows: T[]; total: number; pageNumber: number; pageSize: number }
export type OrderRow = CdsOrder & { retailerName: string; retailerPhone: string; retailerAddress: string; locality: string; distributorName: string; storeName: string; units: number };
export type StopView = TripStop & { otp: Omit<OtpTxn, 'code'> | null };
export type TripView = Omit<Trip, 'stops'> & { ownerName: string; units: number; stops: StopView[] };
export interface Resources { vehicles: (Vehicle & { available: boolean; busyTripNo: string | null })[]; deliveryPersons: (DeliveryPerson & { available: boolean; busyTripNo: string | null })[] }
export interface Meta { stores: CdsStore[]; allStores: CdsStore[]; distributors: Distributor[]; settings: CdsSettings; reports: { id: string; title: string; filters: string[] }[]; today: string; tomorrow: string }
export interface CoverageRetailer { id: string; code: string; name: string; ownerName: string; phone: string; locality: string; address: string; lat: number; lng: number; storeId: string | null; orders: number; openOrders: number; lastOrder: string | null }
export interface Kpi { key: string; label: string; value: number; tone: string; to: string }
export type MyOtp = OtpTxn & { deliveryPersonName: string; vehicleRegNo: string; label: string };
export type PlanRow = Plan & { trips: { id: string; tripNo: string; type: TripType; status: TripStatus; deliveryPersonName: string; vehicleRegNo: string }[] };
export interface StopCompleteInput { otp: string; lines?: { idx: number; actualQty: number }[]; collections?: { orderId: string; amount: number; mode: 'CASH' | 'UPI' }[]; note?: string }
/** Plan Routes result: one proposed route per vehicle (not saved until Confirm Routes). */
export type RouteProposal = DeliveryRoute & { orderIds: string[]; retailers: (Retailer | null)[] };
/** A confirmed delivery route (Delivery Planning list) and its trip once generated. */
export type RouteRow = Plan & { route: DeliveryRoute; dropPoints: number; trip: { id: string; tripNo: string; status: TripStatus; deliveryPersonName: string } | null };
export type CustomerRow = Pick<Retailer, 'id' | 'code' | 'name' | 'ownerName' | 'phone' | 'address' | 'locality' | 'lat' | 'lng'>;
export type { Column, Report };

export const cdsApi = {
  sendOtp: (mobile: string) => call<{ sent: boolean }>('POST', '/cds/auth/otp/send', { mobile }),
  verifyOtp: (mobile: string, otp: string) => call<{ token: string; user: CdsSessionUser }>('POST', '/cds/auth/otp/verify', { mobile, otp }),
  logout: () => call('POST', '/cds/auth/logout'),
  meta: () => call<Meta>('GET', '/cds/meta'),
  summary: () => call<Kpi[]>('GET', '/cds/summary'),
  /** Demo: rebuild the CDS demo data. */
  resetDemo: () => call<{ reset: boolean }>('POST', '/cds/demo/reset'),
  report: (id: string, f: Record<string, string>) => call<Report>('GET', `/cds/reports/${id}`, undefined, f),
  resources: (date: string) => call<Resources>('GET', '/cds/resources', undefined, { date }),

  searchOrders: (f: { cdsStoreId?: string; statuses?: OrderStatus[]; distributorId?: string; retailerId?: string; search?: string; fromDate?: string; toDate?: string; noActiveCdsTrip?: boolean; pageNumber?: number; pageSize?: number }) => call<Paged<OrderRow>>('POST', '/cds/orders/search', f),
  order: (id: string) => call<{ order: CdsOrder; retailer: Retailer | null; distributor: Distributor; store: CdsStore; trips: { id: string; tripNo: string; type: TripType; status: TripStatus; plannedDate: string }[]; collections: Collection[] }>('GET', `/cds/orders/${id}`),
  cancelOrder: (id: string, reason: string) => call<CdsOrder>('POST', `/cds/orders/${id}/cancel`, { reason }),

  createPickupPlan: (b: { orders: { orderId: string; cdsStoreId?: string }[]; plannedDate: string; slot?: string; pickup: { vehicleId: string; deliveryPersonId: string }; cdsDelivery?: { vehicleId: string; deliveryPersonId: string } | null; remarks?: string }) =>
    call<{ plan: Plan; pickupTrip: Trip; cdsDeliveryTrip: Trip | null }>('POST', '/cds/pickup/plans', b),
  createCdsDeliveryPlan: (b: { orderIds: string[]; plannedDate: string; slot?: string; vehicleId: string; deliveryPersonId: string; remarks?: string }) => call<{ plan: Plan; trip: Trip }>('POST', '/cds/deliver-to-cds/plans', b),
  deliverOverview: () => call<{ store: CdsStore; awaiting: number; trips: { tripId: string; tripNo: string; tripStatus: TripStatus; plannedDate: string; deliveryPersonName: string; vehicleRegNo: string; stopStatus: string; verifiedAt: string | null; orders: number; dispatched: number; received: number }[] }[]>('GET', '/cds/deliver-to-cds/overview'),
  /** CDS User Delivery Planning: proposes routes by locality on the store's free vehicles (nothing saved). */
  planRoutes: (b: { orderIds: string[]; plannedDate: string }) => call<{ plannedDate: string; routes: RouteProposal[]; unplannedOrderIds: string[] }>('POST', '/cds/delivery-routes/plan', b),
  /** Confirm Routes: saves the routes; their orders become Delivery Planned. */
  confirmRoutes: (b: { plannedDate: string; routes: { vehicleId: string; orderIds: string[] }[]; remarks?: string }) => call<Plan[]>('POST', '/cds/delivery-routes', b),
  deliveryRoutes: () => call<RouteRow[]>('GET', '/cds/delivery-routes'),
  deliveryRoute: (id: string) => call<{ route: RouteRow; retailers: (Retailer | null)[]; orders: (CdsOrder & { retailerName: string; distributorName: string })[] }>('GET', `/cds/delivery-routes/${id}`),
  /** Generate Trip: the route becomes a Retailer Delivery Trip with the chosen delivery person. */
  generateRouteTrip: (id: string, b: { deliveryPersonId: string; slot?: string }) => call<Trip>('POST', `/cds/delivery-routes/${id}/trip`, b),
  plans: (kind?: Plan['kind']) => call<PlanRow[]>('GET', '/cds/plans', undefined, { kind }),

  searchTrips: (f: { types?: TripType[]; statuses?: TripStatus[]; date?: string; search?: string; pageNumber?: number; pageSize?: number }) => call<Paged<TripView>>('POST', '/cds/trips/search', f),
  trip: (id: string) => call<{ trip: TripView; canRun: boolean; otps: Omit<OtpTxn, 'code'>[]; orders: { id: string; orderNo: string; status: OrderStatus; paymentMode: 'COD' | 'PREPAID'; retailerId: string; retailerName: string; distributorName: string; storeName: string; lines: CdsOrder['lines'] }[]; collections: Collection[] }>('GET', `/cds/trips/${id}`),
  startTrip: (id: string) => call<Trip>('POST', `/cds/trips/${id}/start`),
  cancelTrip: (id: string, reason: string) => call<Trip>('POST', `/cds/trips/${id}/cancel`, { reason }),
  sendStopOtp: (id: string, stopId: string) => call<{ otpId: string; sentToName: string; sentToPhone: string; expiresAt: string; demoSms: string }>('POST', `/cds/trips/${id}/stops/${stopId}/otp`),
  completeStop: (id: string, stopId: string, b: StopCompleteInput) => call<Trip>('POST', `/cds/trips/${id}/stops/${stopId}/complete`, b),
  failStop: (id: string, stopId: string, reason: string) => call<Trip>('POST', `/cds/trips/${id}/stops/${stopId}/fail`, { reason }),
  myOtps: () => call<MyOtp[]>('GET', '/cds/otps/mine'),

  /** CDS User Customers (view only). */
  customers: () => call<CustomerRow[]>('GET', '/cds/customers'),
  stores: () => call<(CdsStore & { user: { name: string; mobile: string; active: boolean } | null; incoming: number; ready: number; outForDelivery: number; delivered: number; vehicles: number; deliveryPersons: number })[]>('GET', '/cds/stores'),
  coverage: () => call<CoverageRetailer[]>('GET', '/cds/coverage'),
  updateStore: (id: string, b: Partial<Pick<CdsStore, 'managerName' | 'managerPhone' | 'active' | 'polygon'>>) => call<CdsStore>('PUT', `/cds/stores/${id}`, b),
  fleet: () => call<{ vehicles: Vehicle[]; deliveryPersons: DeliveryPerson[]; settings: CdsSettings }>('GET', '/cds/fleet'),
  setFleetActive: (kind: 'vehicles' | 'persons', id: string, active: boolean) => call('POST', `/cds/fleet/${kind}/${id}/active`, { active }),
  addVehicle: (b: { regNo: string; type: string; capacityKg: number }) => call<Vehicle>('POST', '/cds/fleet/vehicles', b),
  addPerson: (b: { name: string; phone: string }) => call<DeliveryPerson>('POST', '/cds/fleet/persons', b),
  updateSettings: (b: Partial<CdsSettings>) => call<CdsSettings>('PUT', '/cds/settings', b),
  audit: (entityId: string) => call<AuditEntry[]>('GET', '/cds/audit', undefined, { entityId }),
};
