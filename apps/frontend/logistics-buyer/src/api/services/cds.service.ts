// CDS client: its own sign-in session (separate from the Logistics Buyer login) and the CDS API.
import { http, HttpError } from '../http';
import type { Column, Report } from '../../cds/reports';
import type { TripShown } from '../../cds/status';
import type {
  AuditEntry, CdsOrder, CdsPage, CdsRole, CdsSettings, CdsStore, StoreConfig, Collection, CollectionStatus, DeliveryPerson, Distributor, Grn, ItemCondition,
  OrderStatus, OtpTxn, Plan, Retailer, ReturnRecord, ReturnStatus, Trip, TripStatus, TripStop, TripType, Vehicle,
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
export type OrderRow = CdsOrder & { retailerName: string; retailerPhone: string; retailerAddress: string; locality: string; city: string; state: string; retailerLat: number; retailerLng: number; distributorName: string; storeName: string; units: number; salesPersonName: string; salesPersonPhone: string };
export interface ReportRunRow { id: string; reportId: string; filters: Record<string, string>; rows: number; at: string; by: string }
export interface NewStore { code: string; name: string; address: string; city: string; state: string; lat: number; lng: number; polygon: [number, number][]; localities: string[]; managerName: string; managerPhone: string }
export type StopView = TripStop & { otp: OtpTxn | null; refs: { id: string; no: string; retailer: string; units: number; value: number }[] };
/** `shown`: the status shown (Assigned / In Progress / Completed / Cancelled) and what the vehicle is doing now. */
export type TripView = Omit<Trip, 'stops'> & { ownerName: string; providerName: string; collected: { cod: number; digital: number }; units: number; stops: StopView[]; shown: { status: TripShown; note: string } };
export type ReturnRow = ReturnRecord & { retailerName: string; distributorName: string; storeName: string; units: number; accepted: number; weightKg: number };
export type GrnRow = Grn & { distributorName: string; cdsTripNo: string; pickupTripNos: string[]; received: number; dispatched: number; issues: boolean };
export type CollectionRow = Collection & { retailerName: string };
export interface Resources { vehicles: (Vehicle & { available: boolean; busyTripNo: string | null })[]; deliveryPersons: (DeliveryPerson & { available: boolean; busyTripNo: string | null })[] }
export interface Meta { stores: CdsStore[]; allStores: CdsStore[]; distributors: Distributor[]; settings: CdsSettings; returnReasons: string[]; settlementParties: string[]; reports: { id: string; title: string; filters: string[] }[]; today: string; tomorrow: string }
export interface CoverageRetailer { id: string; code: string; name: string; ownerName: string; phone: string; locality: string; address: string; lat: number; lng: number; storeId: string | null; orders: number; openOrders: number; lastOrder: string | null }
export interface Kpi { key: string; label: string; value: number; tone: string; to: string }
export interface Incoming { tripId: string; tripNo: string; type: TripType; status: TripStatus; plannedDate: string; deliveryPersonName: string; deliveryPersonPhone: string; vehicleRegNo: string; stopStatus: string; verifiedAt: string | null; units: number; handled: number; orders: number; returns: number }
export type MyOtp = OtpTxn & { deliveryPersonName: string; vehicleRegNo: string; label: string };
export type PlanRow = Plan & { trips: { id: string; tripNo: string; type: TripType; status: TripStatus; deliveryPersonName: string; vehicleRegNo: string }[] };
export interface StopCompleteInput { otp: string; lines?: { idx: number; actualQty: number; acceptedQty?: number; rejectedQty?: number }[]; collections?: { orderId: string; amount: number; mode: 'CASH' | 'UPI' }[]; note?: string }
export type { Column, Report };

export const cdsApi = {
  sendOtp: (mobile: string) => call<{ sent: boolean }>('POST', '/cds/auth/otp/send', { mobile }),
  verifyOtp: (mobile: string, otp: string) => call<{ token: string; user: CdsSessionUser }>('POST', '/cds/auth/otp/verify', { mobile, otp }),
  logout: () => call('POST', '/cds/auth/logout'),
  meta: () => call<Meta>('GET', '/cds/meta'),
  summary: () => call<Kpi[]>('GET', '/cds/summary'),
  /** Demo: rebuild the CDS demo data. */
  resetDemo: () => call<{ reset: boolean }>('POST', '/cds/demo/reset'),
  report: (id: string, f: Record<string, string>, run = false) => call<Report>('GET', `/cds/reports/${id}`, undefined, run ? { ...f, run: '1' } : f),
  reportHistory: (id: string) => call<ReportRunRow[]>('GET', `/cds/reports/${id}/history`),
  resources: (date: string) => call<Resources>('GET', '/cds/resources', undefined, { date }),

  searchOrders: (f: { cdsStoreId?: string; statuses?: OrderStatus[]; distributorId?: string; retailerId?: string; state?: string; city?: string; search?: string; fromDate?: string; toDate?: string; noActiveCdsTrip?: boolean; pageNumber?: number; pageSize?: number }) => call<Paged<OrderRow>>('POST', '/cds/orders/search', f),
  order: (id: string) => call<{ order: CdsOrder; salesPerson: { salesPersonName: string; salesPersonPhone: string }; retailer: Retailer | null; distributor: Distributor; store: CdsStore; trips: { id: string; tripNo: string; type: TripType; status: TripStatus; plannedDate: string; slot: string; deliveryPersonName: string; etaMinutes: number }[]; grn: Grn | null; returns: ReturnRecord[]; collections: Collection[]; returnable: { sku: string; max: number }[] }>('GET', `/cds/orders/${id}`),
  cancelOrder: (id: string, reason: string) => call<CdsOrder>('POST', `/cds/orders/${id}/cancel`, { reason }),

  createPickupPlan: (b: { orders: { orderId: string; cdsStoreId?: string }[]; plannedDate: string; slot?: string; pickup: { vehicleId: string; deliveryPersonId: string }; cdsDelivery?: { vehicleId: string; deliveryPersonId: string } | null; remarks?: string }) =>
    call<{ plan: Plan; pickupTrip: Trip; cdsDeliveryTrip: Trip | null }>('POST', '/cds/pickup/plans', b),
  createCdsDeliveryPlan: (b: { orderIds: string[]; plannedDate: string; slot?: string; vehicleId: string; deliveryPersonId: string; remarks?: string }) => call<{ plan: Plan; trip: Trip }>('POST', '/cds/deliver-to-cds/plans', b),
  deliverOverview: () => call<{ store: CdsStore; awaiting: number; trips: { tripId: string; tripNo: string; tripStatus: TripStatus; plannedDate: string; deliveryPersonName: string; vehicleRegNo: string; stopStatus: string; verifiedAt: string | null; orders: number; dispatched: number; received: number }[] }[]>('GET', '/cds/deliver-to-cds/overview'),
  createReturnPlan: (b: { returnIds: string[]; plannedDate: string; slot?: string; vehicleId: string; deliveryPersonId: string; remarks?: string }) => call<{ plan: Plan; trip: Trip }>('POST', '/cds/return-planning/plans', b),
  autoAssign: (date: string, loadKg: number) => call<{ vehicle: Vehicle; deliveryPerson: DeliveryPerson }>('GET', `/cds/delivery/auto-assign?date=${date}&loadKg=${loadKg}`),
  bookOrder: (id: string, b: { provider: string; price: number }) => call<{ plan: Plan; trip: Trip }>('POST', `/cds/orders/${id}/book`, b),
  createDeliveryPlan: (b: { orderIds: string[]; returnIds: string[]; plannedDate: string; slot?: string; vehicleId: string; deliveryPersonId: string; remarks?: string }) => call<{ plan: Plan; trip: Trip }>('POST', '/cds/delivery/plans', b),
  plans: (kind?: Plan['kind']) => call<PlanRow[]>('GET', '/cds/plans', undefined, { kind }),

  searchTrips: (f: { types?: TripType[]; statuses?: TripStatus[]; date?: string; search?: string; pageNumber?: number; pageSize?: number }) => call<Paged<TripView>>('POST', '/cds/trips/search', f),
  trip: (id: string) => call<{ trip: TripView; canRun: boolean; otps: Omit<OtpTxn, 'code'>[]; orders: { id: string; cdsStoreId: string; orderNo: string; status: OrderStatus; paymentMode: 'COD' | 'PREPAID'; retailerId: string; retailerName: string; retailerAddress: string; distributorName: string; storeName: string; deliveredAt: string | null; sellerOrderRef: string; confirmedAt: string; orderValue: number; lines: CdsOrder['lines'] }[]; retailers: { id: string; name: string; phone: string; address: string; city: string; state: string; lat: number; lng: number }[]; returns: { id: string; returnNo: string; status: ReturnStatus; orderNo: string; orderId: string; retailerId: string | null; retailerName: string; retailerAddress: string; storeName: string; lines: { sku: string; name: string; unitPrice: number; unitWeightKg: number; reason: string; qty: number; orderedQty: number }[]; distributorName: string; units: number; value: number }[]; collections: Collection[] }>('GET', `/cds/trips/${id}`),
  startTrip: (id: string) => call<Trip>('POST', `/cds/trips/${id}/start`),
  cancelTrip: (id: string, reason: string) => call<Trip>('POST', `/cds/trips/${id}/cancel`, { reason }),
  updateTripResources: (id: string, body: { vehicleId: string; deliveryPersonId: string }) => call<Trip>('POST', `/cds/trips/${id}/resources`, body),
  updateTripHelper: (id: string, helperId: string) => call<Trip>('POST', `/cds/trips/${id}/helper`, { helperId }),
  sendStopOtp: (id: string, stopId: string) => call<{ otpId: string; sentToName: string; sentToPhone: string; expiresAt: string; demoSms: string }>('POST', `/cds/trips/${id}/stops/${stopId}/otp`),
  completeStop: (id: string, stopId: string, b: StopCompleteInput) => call<Trip>('POST', `/cds/trips/${id}/stops/${stopId}/complete`, b),
  failStop: (id: string, stopId: string, reason: string) => call<Trip>('POST', `/cds/trips/${id}/stops/${stopId}/fail`, { reason }),
  addReturnAtStop: (id: string, stopId: string, b: { orderId: string; lines: { sku: string; qty: number; reason: string; condition: ItemCondition }[] }) => call<ReturnRecord>('POST', `/cds/trips/${id}/stops/${stopId}/returns`, b),
  myOtps: () => call<MyOtp[]>('GET', '/cds/otps/mine'),
  incoming: (type?: TripType) => call<Incoming[]>('GET', '/cds/incoming', undefined, { type }),

  searchGrns: (f: { status?: 'PENDING' | 'COMPLETED'; distributorId?: string; search?: string; pageNumber?: number; pageSize?: number }) => call<Paged<GrnRow>>('POST', '/cds/grns/search', f),
  grn: (id: string) => call<{ grn: Grn; distributor: Distributor; store: CdsStore; cdsTrip: Trip; pickupTrips: { id: string; tripNo: string }[]; orders: { id: string; orderNo: string; status: OrderStatus; retailerName: string }[] }>('GET', `/cds/grns/${id}`),
  updatePlannedQty: (tripId: string, b: { sku: string; items: { orderId: string; qty: number }[]; remarks: string }) => call<Trip>('POST', `/cds/trips/${tripId}/planned-qty`, b),
  saveGrnLines: (id: string, lines: { idx: number; acceptedQty: number; damagedQty: number; remarks?: string }[]) => call<Grn>('POST', `/cds/grns/${id}/lines`, { lines }),
  completeGrn: (id: string, b: { lines: { idx: number; acceptedQty: number; damagedQty: number; remarks?: string }[]; remarks?: string }) => call<Grn>('POST', `/cds/grns/${id}/complete`, b),

  searchReturns: (f: { cdsStoreId?: string; statuses?: ReturnStatus[]; distributorId?: string; unplanned?: boolean; search?: string; pageNumber?: number; pageSize?: number }) => call<Paged<ReturnRow>>('POST', '/cds/returns/search', f),
  initiateReturn: (b: { orderId: string; lines: { sku: string; qty: number; reason: string; condition: ItemCondition }[] }) => call<ReturnRecord>('POST', '/cds/returns', b),
  cancelReturn: (id: string, reason: string) => call<ReturnRecord>('POST', `/cds/returns/${id}/cancel`, { reason }),

  searchCollections: (f: { status?: CollectionStatus; search?: string; pageNumber?: number; pageSize?: number }) => call<Paged<CollectionRow>>('POST', '/cds/collections/search', f),
  receiveCollections: (items: { id: string; amount: number }[], note?: string) => call<Collection[]>('POST', '/cds/collections/receive', { items, note }),
  handToQwipo: (ids: string[], ref: string) => call<Collection[]>('POST', '/cds/collections/handover', { ids, ref }),
  recordSettlement: (ids: string[], ref: string) => call<Collection[]>('POST', '/cds/collections/settle', { ids, ref }),

  retailers: () => call<(Retailer & { orders: number; openOrders: number; deliveredValue: number; returns: number; collected: number; lastOrder: string | null; isBulk: boolean; source: 'system' | 'manual'; updatedAt: string | null })[]>('GET', '/cds/retailers'),
  updateRetailerLocation: (id: string, b: { latitude: string; longitude: string; address?: string; is_bulk_order: boolean }) => call<{ ordersUpdated: number; skippedOrderStatuses: string[] }>('PUT', `/cds/retailers/${id}/location`, b),
  deleteRetailer: (id: string) => call<boolean>('POST', `/cds/retailers/${id}/delete`),
  stores: () => call<(CdsStore & { user: { name: string; mobile: string; active: boolean } | null; incoming: number; grnPending: number; ready: number; outForDelivery: number; delivered: number; returnsAtCds: number; vehicles: number; deliveryPersons: number })[]>('GET', '/cds/stores'),
  coverage: () => call<CoverageRetailer[]>('GET', '/cds/coverage'),
  createStore: (b: NewStore) => call<CdsStore>('POST', '/cds/stores', b),
  updateStore: (id: string, b: Partial<Pick<CdsStore, 'managerName' | 'managerPhone' | 'active' | 'polygon'>>) => call<CdsStore>('PUT', `/cds/stores/${id}`, b),
  fleet: () => call<{ vehicles: Vehicle[]; deliveryPersons: DeliveryPerson[]; settings: CdsSettings }>('GET', '/cds/fleet'),
  setFleetActive: (kind: 'vehicles' | 'persons', id: string, active: boolean) => call('POST', `/cds/fleet/${kind}/${id}/active`, { active }),
  addVehicle: (b: { regNo: string; type: string; capacityKg: number }) => call<Vehicle>('POST', '/cds/fleet/vehicles', b),
  addPerson: (b: { name: string; phone: string }) => call<DeliveryPerson>('POST', '/cds/fleet/persons', b),
  updateSettings: (b: Partial<CdsSettings>) => call<CdsSettings>('PUT', '/cds/settings', b),
  storeSettings: () => call<StoreConfig>('GET', '/cds/store-settings'),
  updateStoreSettings: (b: Partial<StoreConfig>) => call<StoreConfig>('PUT', '/cds/store-settings', b),
  audit: (entityId: string) => call<AuditEntry[]>('GET', '/cds/audit', undefined, { entityId }),
};
