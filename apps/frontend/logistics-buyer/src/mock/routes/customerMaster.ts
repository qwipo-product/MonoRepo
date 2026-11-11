// Mock endpoints for the customer master (`{buyerUrl}/buyer-customer-master/*`) over db().customers.
// Spec: docs/specs/02-create-order-customer-master.md §3, §4.3 (customer search), §5.2, §6.6.
//
//   GET    /buyer-customer-master/?buyerId&page&limit[&search][&status][&source=system|manual] → { data, total, page, limit }
//   GET    /buyer-customer-master/search?query=&buyerId=   → Customer[] (Modify Delivery Address modal)
//   PUT    /buyer-customer-master/:id?buyerId=             → { ordersUpdated, skippedOrderStatuses, customer }
//   DELETE /buyer-customer-master/:id?buyerId=             → { deleted: true }
//
// Location sync: updating a customer's lat/lng/address is pushed to that customer's orders that are not yet
// planned (Ready for Planning, Pending). Orders in any other status are skipped and their status labels are
// returned in `skippedOrderStatuses` (always an array — the client throws if it is missing).
// Demo: a latitude outside ±90 (the dialog has no range check) → 400 → "Failed to update customer."
import { db, nowIso, persist } from '../db';
import { MockError, route } from '../server';
import type { DbCustomer } from '../types';

const BUYER = 'logistics-buyer-svc';

const SYNCABLE_STATUSES = [1, 9];
const STATUS_LABELS: Record<number, string> = {
  1: 'Ready for Planning', 2: 'In Planning', 3: 'Trip Assigned', 4: 'In Transit', 5: 'Delivered', 6: 'Partial Return',
  8: 'Returned', 9: 'Pending', 10: 'Cancelled', 11: 'Discarded', 12: 'Offline Delivery',
};
const LOCATION_ERROR_FIELDS = ['customer_lat', 'customer_long', 'latitude', 'longitude'];

/** API row shape (the extra domain fields of DbCustomer are not part of the response). */
function toApi(c: DbCustomer) {
  return {
    id: c.id,
    customer_unique_id: c.customer_unique_id,
    buyer_id: c.buyer_id,
    mobile_number: c.mobile_number,
    business_name: c.business_name,
    customer_name: c.customer_name,
    latitude: c.latitude,
    longitude: c.longitude,
    address: c.address,
    status: c.status,
    created_at: c.created_at,
    updated_at: c.updated_at,
    created_by: c.created_by,
    updated_by: c.updated_by,
    is_bulk_order: c.is_bulk_order,
  };
}

// [deviation] deletes are soft (status "Deleted") because DbCustomer doubles as the customer entity that
// orders/trips reference by id in the mock; deleted rows are hidden from every customer-master endpoint.
const isDeleted = (c: DbCustomer) => c.status === 'Deleted' || !!(c as any).deleted_at;
const visible = () => db().customers.filter((c) => !isDeleted(c));

function requireBuyer(q: Record<string, string>) {
  if (!q.buyerId) throw new MockError(400, 'buyerId is required');
}

route('GET', BUYER, '/buyer-customer-master/search', (req) => {
  requireBuyer(req.query);
  const q = String(req.query.query || '').trim().toLowerCase();
  if (q.length < 2) return [];
  const digits = q.replace(/\D/g, '');
  return visible()
    .filter((c) =>
      (c.customer_name || '').toLowerCase().includes(q) ||
      (c.business_name || '').toLowerCase().includes(q) ||
      (digits.length >= 2 && (c.mobile_number || '').includes(digits)))
    .slice(0, 20)
    .map(toApi);
});

route('GET', BUYER, '/buyer-customer-master/', (req) => {
  requireBuyer(req.query);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 25));
  const search = String(req.query.search || '').trim().toLowerCase();
  const source = String(req.query.source || '');
  const status = String(req.query.status || '');

  let rows = visible();
  if (search) {
    rows = rows.filter((c) =>
      [c.customer_name, c.business_name, c.mobile_number, c.customer_unique_id].some((v) => (v || '').toLowerCase().includes(search)));
  }
  // source=system covers rows maintained by integrations (system / connector); manual = edited in this screen
  if (source === 'system') rows = rows.filter((c) => c.updated_by !== 'manual');
  else if (source === 'manual') rows = rows.filter((c) => c.updated_by === 'manual');
  if (status) rows = rows.filter((c) => (c.status || '').toLowerCase() === status.toLowerCase());

  rows = [...rows].sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '') || (a.business_name || '').localeCompare(b.business_name || ''));
  return { data: rows.slice((page - 1) * limit, page * limit).map(toApi), total: rows.length, page, limit };
});

route('PUT', BUYER, '/buyer-customer-master/:id', (req) => {
  requireBuyer(req.query);
  const d = db();
  const c = d.customers.find((x) => x.id === req.params.id && !isDeleted(x));
  if (!c) throw new MockError(404, 'Customer not found');
  const b = req.body || {};
  const latStr = String(b.latitude ?? '').trim();
  const lngStr = String(b.longitude ?? '').trim();
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (!latStr || !lngStr || isNaN(lat) || isNaN(lng)) throw new MockError(400, 'Valid latitude and longitude are required');
  if (lat < -90 || lat > 90) throw new MockError(400, 'Latitude must be between -90 and 90');
  if (lng < -180 || lng > 180) throw new MockError(400, 'Longitude must be between -180 and 180');

  c.latitude = latStr;
  c.longitude = lngStr;
  const addressChanged = typeof b.address === 'string';
  if (addressChanged) c.address = b.address;
  if (typeof b.is_bulk_order === 'boolean') c.is_bulk_order = b.is_bulk_order;
  c.updated_by = 'manual';
  c.updated_at = nowIso();

  let ordersUpdated = 0;
  const skipped: string[] = [];
  d.orders
    .filter((o) => o.customerId === c.id)
    .forEach((o) => {
      if (SYNCABLE_STATUSES.includes(Number(o.orderStatusId))) {
        o.lat = lat;
        o.lng = lng;
        if (addressChanged) o.address = { ...o.address, line: b.address };
        // a corrected master location also resolves the order's lat/long import errors
        if (o.validationErrors?.length) {
          o.validationErrors = o.validationErrors.filter((e) => !LOCATION_ERROR_FIELDS.includes(e.fieldName));
          if (!o.validationErrors.length && Number(o.orderStatusId) === 9) o.orderStatusId = 1;
        }
        ordersUpdated++;
      } else {
        const label = STATUS_LABELS[Number(o.orderStatusId)] || String(o.orderStatusId);
        if (!skipped.includes(label)) skipped.push(label);
      }
    });
  persist();
  return { ordersUpdated, skippedOrderStatuses: skipped, customer: toApi(c) };
});

route('DELETE', BUYER, '/buyer-customer-master/:id', (req) => {
  requireBuyer(req.query);
  const c = db().customers.find((x) => x.id === req.params.id && !isDeleted(x));
  if (!c) throw new MockError(404, 'Customer not found');
  c.status = 'Deleted';
  (c as any).deleted_at = nowIso();
  persist();
  return { deleted: true, id: c.id };
});
