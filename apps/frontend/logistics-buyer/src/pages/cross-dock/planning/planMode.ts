// The three planning flows that follow the LBNP Delivery Planning pattern (route plans → Generate Trip):
//   pickup   Service Centre: distributors → Cross Dock Stores
//   return   Service Centre: Cross Dock Stores → distributors
//   delivery Cross Dock Store: store → retailers, by rider
import { crossDockService, storeService } from '../../../api/services/crossDock.service';
import type { XdRoutePlanRow } from '../../../types/crossDock';

export type PlanMode = 'pickup' | 'return' | 'delivery';

export const MODE = {
  pickup: {
    title: 'Pickup Planning',
    subtitle: 'Plan pickups from distributors to Cross Dock Stores, then generate the trips',
    createTitle: 'Create Pickup Route',
    detailsTitle: 'Pickup Route Details',
    base: '/service-centre/pickup-planning',
    tripsBase: '/service-centre/trips',
    planned: { title: 'Planned Pickups', sub: 'Routes with a vehicle assigned, waiting for Generate Trip' },
    done: { title: 'Trips Created', sub: 'Routes already turned into pickup trips' },
    unit: 'order',
  },
  return: {
    title: 'Return Planning',
    subtitle: 'Plan return trips that collect from Cross Dock Stores and hand back to distributors',
    createTitle: 'Create Return Route',
    detailsTitle: 'Return Route Details',
    base: '/service-centre/return-planning',
    tripsBase: '/service-centre/trips',
    planned: { title: 'Planned Returns', sub: 'Routes with a vehicle assigned, waiting for Generate Trip' },
    done: { title: 'Trips Created', sub: 'Routes already turned into return trips' },
    unit: 'return',
  },
  delivery: {
    title: 'Delivery Planning',
    subtitle: 'Plan two-wheeler delivery routes from the store, then generate the riders’ trips',
    createTitle: 'Create Delivery Route',
    detailsTitle: 'Delivery Route Details',
    base: '/cross-dock/delivery-planning',
    tripsBase: '/cross-dock/trips',
    planned: { title: 'Planned Deliveries', sub: 'Routes with a rider assigned, waiting for Generate Trip' },
    done: { title: 'Trips Created', sub: 'Routes already handed to riders' },
    unit: 'order',
  },
} as const;

/** Plan endpoints for the mode (Service Centre service or the signed-in store's service). */
export function planApi(mode: PlanMode, store: ReturnType<typeof storeService>) {
  if (mode === 'delivery') {
    return { list: store.plans, get: store.plan, generate: store.generatePlan, cancel: store.cancelPlan };
  }
  const kind = mode === 'pickup' ? 'PICKUP' : 'RETURN';
  return {
    list: () => crossDockService.plans(kind),
    get: crossDockService.plan,
    generate: crossDockService.generatePlan,
    cancel: crossDockService.cancelPlan,
  };
}

export const resourceLabel = (p: XdRoutePlanRow) =>
  p.kind === 'DELIVERY' ? p.riderName ?? 'Rider' : `${p.vehicleRegNo ?? 'Vehicle'}${p.driverName ? ` · ${p.driverName}` : ''}`;
