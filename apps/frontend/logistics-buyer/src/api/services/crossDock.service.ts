// Cross-dock client (Service Centre now, Cross Dock Store in phase 3). Endpoints are served by
// src/mock/routes/crossDock.ts; shapes are in src/types/crossDock.ts. Prototype contract, not a production API.
import { getConfig } from '../config';
import { http } from '../http';
import type {
  DepositMode, PickupRound, TripKind, TripSlot, TripStatus, VehicleType, XdCashDay, XdCds, XdCustomerLine, XdDayCdsSummary, XdGrnView, XdInboundTruck,
  XdOrderRow, XdOrderStatus, XdOverview, XdProductLine, XdReturnRow, XdReturnStatus, XdRider, XdRoutePlanRow, XdRunRow, XdSettings, XdStoreDay,
  XdStoreOverview, XdTripRow, XdVehicle,
} from '../../types/crossDock';

const base = () => `${getConfig().buyerUrl}/cross-dock`;
interface Envelope<T> {
  success: boolean;
  data: T;
  message?: string;
}
const unwrap = async <T>(p: Promise<Envelope<T>>): Promise<T> => (await p).data;

export interface XdVehicleRow extends XdVehicle {
  driverName: string;
  driverPhone: string;
  /** Trip already using the vehicle in the asked slot, if any. */
  busyTripNo: string | null;
}

export interface XdTripDetail {
  trip: XdTripRow;
  orders: XdOrderRow[];
  returns: XdReturnRow[];
  products: XdProductLine[];
  customers: XdCustomerLine[];
}

export interface XdRunDetail {
  run: XdRunRow;
  products: XdProductLine[];
  customers: XdCustomerLine[];
}

export interface NewVehicle {
  regNo: string;
  type: VehicleType;
  model: string;
  capacityKg: number;
  driverName: string;
  driverPhone: string;
}

/** The message a screen should show for a failed call (rule messages come back as-is). */
export function errorMessage(e: any, fallback = 'Something went wrong. Please try again.'): string {
  return e?.error?.error?.message || e?.error?.message || e?.message || fallback;
}

export const crossDockService = {
  overview: () => unwrap(http.get<Envelope<XdOverview>>(`${base()}/overview`)),

  orders: (f: { status?: XdOrderStatus[]; distributorId?: string; cdsId?: string; search?: string } = {}) =>
    unwrap(http.get<Envelope<XdOrderRow[]>>(`${base()}/orders`, { params: { status: f.status?.join(','), distributorId: f.distributorId, cdsId: f.cdsId, search: f.search } })),

  returns: (status?: XdReturnStatus[]) => unwrap(http.get<Envelope<XdReturnRow[]>>(`${base()}/returns`, { params: { status: status?.join(',') } })),

  trips: (f: { kind?: TripKind; status?: TripStatus[] } = {}) =>
    unwrap(http.get<Envelope<XdTripRow[]>>(`${base()}/trips`, { params: { kind: f.kind, status: f.status?.join(',') } })),

  trip: (id: string) => unwrap(http.get<Envelope<XdTripDetail>>(`${base()}/trips/${encodeURIComponent(id)}`)),

  plans: (kind: 'PICKUP' | 'RETURN') => unwrap(http.get<Envelope<XdRoutePlanRow[]>>(`${base()}/plans`, { params: { kind } })),
  plan: (id: string) => unwrap(http.get<Envelope<XdRoutePlanRow>>(`${base()}/plans/${encodeURIComponent(id)}`)),
  createPickupPlans: (body: { slot: PickupRound; orderIds: string[] }) => unwrap(http.post<Envelope<XdRoutePlanRow[]>>(`${base()}/plans/pickup`, body)),
  createReturnPlan: (body: { returnIds: string[]; date: string }) => unwrap(http.post<Envelope<XdRoutePlanRow[]>>(`${base()}/plans/return`, body)),
  generatePlan: (id: string) => unwrap(http.post<Envelope<{ plan: XdRoutePlanRow; tripId: string }>>(`${base()}/plans/${encodeURIComponent(id)}/generate`)),
  cancelPlan: (id: string) => unwrap(http.post<Envelope<XdRoutePlanRow>>(`${base()}/plans/${encodeURIComponent(id)}/cancel`)),

  startTrip: (id: string) => unwrap(http.post<Envelope<XdTripRow>>(`${base()}/trips/${encodeURIComponent(id)}/start`)),

  /** `otp`: for a drop at a store, the store's OTP the driver enters. */
  completeStop: (id: string, seq: number, otp?: string) => unwrap(http.post<Envelope<XdTripRow>>(`${base()}/trips/${encodeURIComponent(id)}/stops/${seq}/complete`, { otp })),

  cancelTrip: (id: string) => unwrap(http.post<Envelope<XdTripRow>>(`${base()}/trips/${encodeURIComponent(id)}/cancel`)),

  vehicles: (slot?: TripSlot, date?: string) => unwrap(http.get<Envelope<XdVehicleRow[]>>(`${base()}/vehicles`, { params: { slot, date } })),

  addVehicle: (body: NewVehicle) => unwrap(http.post<Envelope<XdVehicle>>(`${base()}/vehicles`, body)),

  setVehicleActive: (id: string, active: boolean) => unwrap(http.patch<Envelope<XdVehicle>>(`${base()}/vehicles/${encodeURIComponent(id)}`, { active })),

  reports: () => unwrap(http.get<Envelope<{ days: XdDayCdsSummary[] }>>(`${base()}/reports`)),

  saveSettings: (settings: XdSettings) => unwrap(http.put<Envelope<XdSettings>>(`${base()}/settings`, settings)),
};

// ------------------------------------------------------------------ Cross Dock Store (one store, by code)

export interface XdRiderRow extends XdRider {
  busyRunNo: string | null;
}

export interface GrnCount {
  sku: string;
  received: number;
  damaged: number;
}

export function storeService(code: string) {
  const sb = () => `${base()}/store/${encodeURIComponent(code)}`;
  return {
    overview: () => unwrap(http.get<Envelope<XdStoreOverview>>(`${sb()}/overview`)),
    orders: (status?: XdOrderStatus[]) => unwrap(http.get<Envelope<XdOrderRow[]>>(`${sb()}/orders`, { params: { status: status?.join(',') } })),
    inbound: () => unwrap(http.get<Envelope<XdInboundTruck[]>>(`${sb()}/inbound`)),
    grn: (tripId: string) => unwrap(http.get<Envelope<XdGrnView>>(`${sb()}/inbound/${encodeURIComponent(tripId)}`)),
    confirmGrn: (tripId: string, body: { lines: GrnCount[]; note: string }) => unwrap(http.post<Envelope<XdGrnView>>(`${sb()}/inbound/${encodeURIComponent(tripId)}/grn`, body)),
    /** The driver entering the store's OTP (driver app, simulated). */
    driverOtp: (tripId: string, otp: string) => unwrap(http.post<Envelope<XdGrnView>>(`${sb()}/inbound/${encodeURIComponent(tripId)}/otp`, { otp })),
    plans: () => unwrap(http.get<Envelope<XdRoutePlanRow[]>>(`${sb()}/plans`)),
    plan: (id: string) => unwrap(http.get<Envelope<XdRoutePlanRow>>(`${sb()}/plans/${encodeURIComponent(id)}`)),
    createPlans: (body: { date: string; orderIds: string[] }) => unwrap(http.post<Envelope<XdRoutePlanRow[]>>(`${sb()}/plans`, body)),
    generatePlan: (id: string) => unwrap(http.post<Envelope<{ plan: XdRoutePlanRow; tripId: string }>>(`${sb()}/plans/${encodeURIComponent(id)}/generate`)),
    cancelPlan: (id: string) => unwrap(http.post<Envelope<XdRoutePlanRow>>(`${sb()}/plans/${encodeURIComponent(id)}/cancel`)),
    riders: () => unwrap(http.get<Envelope<XdRiderRow[]>>(`${sb()}/riders`)),
    addRider: (body: { name: string; phone: string; vehicleRegNo: string }) => unwrap(http.post<Envelope<XdRider>>(`${sb()}/riders`, body)),
    setRiderActive: (id: string, active: boolean) => unwrap(http.patch<Envelope<XdRider>>(`${sb()}/riders/${encodeURIComponent(id)}`, { active })),
    runs: () => unwrap(http.get<Envelope<XdRunRow[]>>(`${sb()}/runs`)),
    run: (id: string) => unwrap(http.get<Envelope<XdRunDetail>>(`${sb()}/runs/${encodeURIComponent(id)}`)),
    startRun: (id: string) => unwrap(http.post<Envelope<XdRunRow>>(`${sb()}/runs/${encodeURIComponent(id)}/start`)),
    cancelRun: (id: string) => unwrap(http.post<Envelope<XdRunRow>>(`${sb()}/runs/${encodeURIComponent(id)}/cancel`)),
    completeStop: (id: string, seq: number, body: { cash: number; upi: number; returned: { orderId: string; reason: string }[]; otp: string }) =>
      unwrap(http.post<Envelope<XdRunRow>>(`${sb()}/runs/${encodeURIComponent(id)}/stops/${seq}/complete`, body)),
    returns: () => unwrap(http.get<Envelope<XdReturnRow[]>>(`${sb()}/returns`)),
    cash: (date?: string) => unwrap(http.get<Envelope<{ days: string[]; day: XdCashDay }>>(`${sb()}/cash`, { params: { date } })),
    deposit: (body: { date: string; amount: number; mode: DepositMode; reference: string }) => unwrap(http.post<Envelope<XdCashDay>>(`${sb()}/deposits`, body)),
    reports: () => unwrap(http.get<Envelope<{ days: XdStoreDay[] }>>(`${sb()}/reports`)),
    saveProfile: (body: { operatorName: string; phone: string; address: string }) => unwrap(http.put<Envelope<XdCds>>(`${sb()}/profile`, body)),
  };
}
