// Mock endpoints for the Orders list (/orders) and Order details (/order-details) screens.
// Spec: docs/specs/01-orders.md §3 (data model) + docs/specs/02-create-order-customer-master.md §4.
// Owned routes (BUILD_GUIDE endpoint ownership):
//   POST   /orders/search                 list + readyForPlanningStats KPIs
//   PUT    /orders/order_updates/bulk     cancel (statusId 10) / Move to RFP (statusId 1)
//   DELETE /orders/:orderId               delete a Pending order
//   GET    /orders/:orderId/errors        Fix Order Errors dialog load
//   PATCH  /orders/:orderId/fix-errors    Fix Order Errors dialog save (all resolved → status 9 → 1)
//   POST   /orders/search-by-invoice      Modify Delivery Address step 1
//   PUT    /orders/update-delivery-address  Modify Delivery Address submit
//   POST   /orders/map-locations          map view
//   PUT    /orders/offline-delivery       map popup actions
//   GET    /orders/order_details/:orderId  order details
//   GET    /orders/is_return_order/:orderId
import { route, MockError, RawResponse } from '../server';
import { db, persist } from '../db';
import { ensureCdsTrips, isSentToCds } from '../extensions/cds';
import type { DbOrder, DbTrip, DbValidationError } from '../types';

const BUYER = 'logistics-buyer-svc';

const money = (n: unknown) => (Number(n) || 0).toFixed(2);
const round2 = (n: number) => Math.round(n * 100) / 100;

const findOrder = (orderId: string): DbOrder | undefined => db().orders.find((o) => o.orderId === orderId);
const tripOf = (o: DbOrder): DbTrip | undefined => (o.tripId ? db().trips.find((t) => t.logisticsOrderId === o.tripId) : undefined);

/** Trip (logistics order) status → ONDC order-state string carried on order rows (`LogisticOndcOrderState`). */
function logisticOrderState(trip: DbTrip | undefined): string | null {
  if (!trip) return null;
  switch (trip.status) {
    case 1: return 'Created';
    case 2: return 'In-progress';
    case 3: return 'Completed';
    case 4: return 'Cancelled';
    case 5: return 'In-progress';
    default: return 'None';
  }
}

/** "YYYY-MM-DD HH:mm:ss" (local) → ISO. */
function localToIso(s: string | null | undefined): string | null {
  if (!s) return null;
  const d = new Date(String(s).replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** Raw `/orders/search` row (spec 01 §3.1 / live-api-shapes). */
function toSearchRow(o: DbOrder) {
  const trip = tripOf(o);
  return {
    orderId: o.orderId,
    refOrderId: o.refOrderId,
    customerBusinessName: o.customerBusinessName,
    customerMobileNumber: o.customerMobileNumber,
    amount: money(o.amount),
    orderWeight: money(o.orderWeight),
    orderType: o.orderType,
    salesPersonName: o.salesPersonName,
    salesBeatName: o.salesBeatName,
    createdAt: o.createdAt,
    orderStatusId: String(o.orderStatusId),
    volumetricWeight: money(o.volumetricWeight),
    validationErrorCount: String(o.orderStatusId === 9 ? (o.validationErrors || []).length : 0),
    isDeliveryAddressUpdated: !!o.isDeliveryAddressUpdated,
    // "cds" = the seller confirmed it as CDS; it is listed only while CDS Order Routing is off (see below).
    deliveryMode: o.deliveryMode ?? null,
    logisticOrderId: trip ? trip.orderId : null,
    logisticOrderRowId: trip ? trip.logisticsOrderId : null,
    tripId: trip ? trip.logisticsOrderId : null,
    logisticOrderStatus: logisticOrderState(trip),
    deliveryDate: o.deliveryDate,
    orderdate: o.orderDate,
    orderItems: (o.items || []).map((it) => ({ orderId: o.orderId, itemId: it.itemId, itemName: it.itemName, quantity: String(it.quantity) })),
    returnItems: (o.items || [])
      .filter((it) => (it.returnedQuantity || 0) > 0)
      .map((it) => ({ orderId: o.orderId, itemId: it.itemId, itemName: it.itemName, returnedQuantity: String(it.returnedQuantity) })),
  };
}

const ymd = (s: string) => String(s || '').slice(0, 10);
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : v === undefined || v === null || v === '' ? [] : [v]);

// ---------------------------------------------------------------- list
route('POST', BUYER, '/orders/search', (req) => {
  const b = req.body || {};
  const d = db();
  const buyerIds = arr(b.buyerId).map(String);
  const statusIds = arr(b.statusId).map(Number).filter((x) => !isNaN(x) && x !== 0);
  const ids = arr(b.id).map(String);
  const names = arr(b.customerName).map((x) => String(x).toLowerCase());
  const mobiles = arr(b.customerMobile).map(String);
  const startDate = b.startDate ? ymd(b.startDate) : '';
  const endDate = b.endDate ? ymd(b.endDate) : '';
  // The backend trims the search text (a whitespace-only search behaves like no search).
  const q = String(b.searchText ?? '').trim().toLowerCase();

  if (ensureCdsTrips(d)) persist();
  // CDS orders already sent to the CDS service center are not LBNP's to plan, so the Orders page (and its KPIs) skip
  // them (Settings → Delivery → CDS Order Routing).
  const all = d.orders.filter((o) => (!buyerIds.length || buyerIds.includes(o.buyerId)) && !isSentToCds(o));

  let rows = all.filter((o) => {
    if (statusIds.length && !statusIds.includes(o.orderStatusId)) return false;
    if (ids.length && !ids.includes(o.orderId)) return false;
    if (names.length && !names.some((n) => o.customerBusinessName.toLowerCase().includes(n) || (o.customerName || '').toLowerCase().includes(n))) return false;
    if (mobiles.length && !mobiles.includes(o.customerMobileNumber)) return false;
    const od = ymd(o.orderDate);
    if (startDate && od < startDate) return false;
    if (endDate && od > endDate) return false;
    if (q) {
      const hay = [o.refOrderId, o.customerBusinessName, o.customerName, o.customerMobileNumber].map((x) => String(x || '').toLowerCase());
      if (!hay.some((h) => h.includes(q))) return false;
    }
    return true;
  });
  rows = rows.slice().sort((a, c) => String(c.createdAt || '').localeCompare(String(a.createdAt || '')));

  const pageSize = Math.max(1, Number(b.pageSize) || 25);
  const pageNumber = Math.max(1, Number(b.pageNumber) || 1);
  const page = rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

  // KPI cards always describe Ready-for-Planning totals, whatever filters are active.
  const rfp = all.filter((o) => o.orderStatusId === 1);
  const readyForPlanningStats = {
    customerCount: new Set(rfp.map((o) => o.customerId || o.customerMobileNumber)).size,
    orderCount: rfp.length,
    totalVolumetricWeight: round2(rfp.reduce((s, o) => s + (Number(o.volumetricWeight) || 0), 0)),
  };

  return { orders: page.map(toSearchRow), count: rows.length, readyForPlanningStats };
});

// ---------------------------------------------------------------- bulk status update (cancel / Move to RFP)
route('PUT', BUYER, '/orders/order_updates/bulk', (req) => {
  const list = Array.isArray(req.body) ? req.body : [];
  if (!list.length) throw new MockError(400, 'No order updates provided', { success: false, error: { code: 400, message: 'No order updates provided' } });
  const d = db();
  const missing = list.filter((u: any) => !d.orders.some((o) => o.orderId === u?.orderId));
  if (missing.length) {
    const message = `Order not found: ${missing.map((m: any) => m?.orderId).join(', ')}`;
    throw new MockError(404, message, { success: false, error: { code: 404, message } });
  }
  const updated: any[] = [];
  list.forEach((u: any) => {
    const o = d.orders.find((x) => x.orderId === u.orderId)!;
    const attrs = u.updateAttributes || {};
    if (attrs.statusId !== undefined && attrs.statusId !== null) {
      const next = Number(attrs.statusId);
      if (next === 1 && (o.orderStatusId === 8 || o.orderStatusId === 6)) {
        // Back to Ready for Planning for re-delivery: clear the old return bookkeeping.
        o.rtoReasonId = null;
        o.returnReason = null;
        o.items.forEach((it) => { it.returnedQuantity = 0; it.deliveredQuantity = 0; });
      }
      if (next === 10) o.routePlanComboId = null;
      o.orderStatusId = next;
    }
    updated.push({ orderId: o.orderId, statusId: o.orderStatusId });
  });
  persist();
  return { updatedCount: updated.length, orders: updated };
});

// ---------------------------------------------------------------- delete (Pending only)
route('DELETE', BUYER, '/orders/:orderId', (req) => {
  const d = db();
  const idx = d.orders.findIndex((o) => o.orderId === req.params.orderId);
  if (idx < 0) throw new MockError(404, 'Order not found', { success: false, error: { code: 404, message: 'Order not found' } });
  const o = d.orders[idx];
  if (o.orderStatusId !== 9) {
    // Envelope succeeds but the inner result says no (the UI reads response.data.success).
    return { success: false, message: 'Only orders in Pending status can be deleted.' };
  }
  d.orders.splice(idx, 1);
  persist();
  return { success: true, message: 'Order deleted successfully', orderId: o.orderId, refOrderId: o.refOrderId };
});

// ---------------------------------------------------------------- validation errors
function groupErrors(o: DbOrder) {
  const errs = o.orderStatusId === 9 ? o.validationErrors || [] : [];
  const strip = (e: DbValidationError) => {
    const { group: _g, ...rest } = e;
    return rest;
  };
  const customer = errs.filter((e) => e.group === 'customer_order').map(strip);
  const product = errs.filter((e) => e.group === 'product').map(strip);
  return {
    orderId: o.orderId,
    refOrderId: o.refOrderId,
    totalErrors: customer.length + product.length,
    groups: {
      customer_order: { count: customer.length, errors: customer },
      product: { count: product.length, errors: product },
    },
  };
}

route('GET', BUYER, '/orders/:orderId/errors', (req) => {
  const o = findOrder(req.params.orderId);
  if (!o) throw new MockError(404, 'Order not found', { success: false, error: { code: 404, message: 'Order not found' } });
  return groupErrors(o);
});

/** Server-side re-validation of a fixed value. Returns an error message, or null when the value is valid. */
function validateFix(fieldName: string, raw: unknown): string | null {
  const v = raw === null || raw === undefined ? '' : String(raw).trim();
  const num = Number(v);
  const isNum = v !== '' && !isNaN(num);
  switch (fieldName) {
    case 'customer_mobile_number':
      return /^[6-9]\d{9}$/.test(v) ? null : 'Store Mobile must be a valid 10-digit number';
    case 'customer_pincode':
    case 'pincode':
      return /^\d{6}$/.test(v) ? null : 'Pincode must be 6 digits';
    case 'customer_lat':
    case 'latitude':
      return isNum && num >= -90 && num <= 90 ? null : 'Invalid latitude';
    case 'customer_long':
    case 'longitude':
      return isNum && num >= -180 && num <= 180 ? null : 'Invalid longitude';
    case 'total_amount':
      return isNum && num >= 0 ? null : 'Net Invoice Value must be a positive number';
    case 'order_type':
      return v === 'Digital' || v === 'Sales' ? null : 'Order Type must be Digital or Sales';
    case 'beat':
      return /^[a-zA-Z\s]+$/.test(v) ? null : 'Beat should contain alphabetic characters only';
    case 'order_date': {
      const d = new Date(v.replace(' ', 'T'));
      if (!v || isNaN(d.getTime())) return 'Billing Date is invalid';
      return d.getTime() > Date.now() ? 'Billing Date cannot be in the future' : null;
    }
    case 'qty':
      return isNum && num >= 1 ? null : 'Quantity must be ≥ 1';
    case 'unit_weight':
      return isNum && num >= 0.001 ? null : 'Weight must be greater than 0';
    case 'mrp':
      return isNum && num >= 0.01 ? null : 'MRP must be greater than 0';
    case 'length':
    case 'width':
    case 'height':
      return isNum && num >= 0.1 ? null : `${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)} must be at least 0.1`;
    default:
      return v ? null : `${fieldName} is required`;
  }
}

/** Applies a resolved customer/order-level fix onto the order record. */
function applyFix(o: DbOrder, fieldName: string, value: string) {
  switch (fieldName) {
    case 'customer_mobile_number': o.customerMobileNumber = value; break;
    case 'customer_name': o.customerBusinessName = value; break;
    case 'customer_address': o.address = { ...o.address, line: value }; break;
    case 'customer_pincode':
    case 'pincode': o.address = { ...o.address, pincode: value }; break;
    case 'customer_lat':
    case 'latitude': o.lat = Number(value); break;
    case 'customer_long':
    case 'longitude': o.lng = Number(value); break;
    case 'ref_order_id': o.refOrderId = value; break;
    case 'order_type': o.orderType = value === 'Sales' ? 'Sales' : 'Digital'; break;
    case 'beat': o.salesBeatName = value; break;
    case 'total_amount': o.amount = Number(value); break;
    case 'order_date': o.orderDate = value.length === 10 ? `${value} 00:00:00` : value; break;
    default: break;
  }
}

route('PATCH', BUYER, '/orders/:orderId/fix-errors', (req) => {
  const o = findOrder(req.params.orderId);
  if (!o) throw new MockError(404, 'Order not found', { success: false, error: { code: 404, message: 'Order not found' } });
  const updates: any[] = Array.isArray(req.body?.updates) ? req.body.updates : [];
  if (!updates.length) throw new MockError(400, 'No updates provided', { success: false, error: { code: 400, message: 'No updates provided' } });
  const before = (o.validationErrors || []).length;
  let errorsFixed = 0;
  updates.forEach((u) => {
    const fieldName = String(u?.fieldName || '');
    const itemId = u?.itemId;
    const err = (o.validationErrors || []).find((e) =>
      e.fieldName === fieldName && (e.group === 'product' ? String(e.itemId ?? 'unknown') === String(itemId ?? 'unknown') : itemId === undefined || itemId === null),
    );
    if (!err) return;
    const value = u.newValue === null || u.newValue === undefined ? '' : String(u.newValue);
    const problem = validateFix(fieldName, value);
    if (problem) {
      // Still invalid: keep the error, remember what was submitted.
      err.currentValue = value;
      err.errorMessage = problem;
      return;
    }
    if (err.group === 'customer_order') applyFix(o, fieldName, value);
    o.validationErrors = o.validationErrors.filter((e) => e !== err);
    errorsFixed++;
  });
  const remainingErrors = o.validationErrors.length;
  const allErrorsResolved = remainingErrors === 0;
  if (allErrorsResolved && o.orderStatusId === 9) o.orderStatusId = 1; // Pending → Ready for Planning
  persist();
  return {
    allErrorsResolved,
    message: allErrorsResolved
      ? `All ${before} error(s) fixed. Order ${o.refOrderId} is now Ready for Planning.`
      : `${errorsFixed} of ${before} errors fixed`,
    errorsFixed,
    remainingErrors,
  };
});

// ---------------------------------------------------------------- modify delivery address
route('POST', BUYER, '/orders/search-by-invoice', (req) => {
  const invoices: string[] = Array.isArray(req.body?.invoiceNumbers) ? req.body.invoiceNumbers.map(String) : [];
  const buyerId = req.body?.buyerId;
  const d = db();
  // Only Ready-for-Planning orders can have their delivery customer changed; exact (case-sensitive) match.
  return d.orders
    .filter((o) => (!buyerId || o.buyerId === buyerId) && o.orderStatusId === 1 && !isSentToCds(o) && invoices.includes(o.refOrderId))
    .map((o) => ({
      order_id: o.orderId,
      ref_order_id: o.refOrderId,
      customer_business_name: o.customerBusinessName,
      customer_name: o.customerName,
      customer_mobile_number: o.customerMobileNumber,
      amount: money(o.amount),
      order_weight: money(o.orderWeight),
      is_delivery_address_updated: !!o.isDeliveryAddressUpdated,
    }));
});

route('PUT', BUYER, '/orders/update-delivery-address', (req) => {
  const b = req.body || {};
  const d = db();
  const orderIds: string[] = Array.isArray(b.orderIds) ? b.orderIds.map(String) : [];
  if (!orderIds.length) throw new MockError(400, 'No orders selected', { success: false, error: { code: 400, message: 'No orders selected' } });
  const customer = d.customers.find((c) => c.id === b.targetCustomerMasterId);
  if (!customer) throw new MockError(404, 'Target customer not found', { success: false, error: { code: 404, message: 'Target customer not found' } });
  const orders = orderIds.map((id) => d.orders.find((o) => o.orderId === id));
  if (orders.some((o) => !o)) throw new MockError(404, 'One or more orders were not found', { success: false, error: { code: 404, message: 'One or more orders were not found' } });
  const notRfp = (orders as DbOrder[]).filter((o) => o.orderStatusId !== 1);
  if (notRfp.length) {
    const message = `Only orders in Ready for Planning status can be modified (${notRfp.map((o) => o.refOrderId).join(', ')}).`;
    throw new MockError(400, message, { success: false, error: { code: 400, message } });
  }
  const beat = d.beats.find((x) => x.id === customer.beatId);
  (orders as DbOrder[]).forEach((o) => {
    o.customerId = customer.id;
    o.customerName = customer.customer_name;
    o.customerBusinessName = customer.business_name;
    o.customerMobileNumber = customer.mobile_number;
    o.address = {
      line: customer.address.split(', ').slice(1, -1).join(', ') || customer.address,
      locality: customer.locality,
      city: customer.city || 'Hyderabad',
      state: customer.state || 'Telangana',
      country: 'INDIA',
      pincode: customer.pincode,
    };
    o.lat = Number(customer.latitude);
    o.lng = Number(customer.longitude);
    if (beat) {
      o.beatId = beat.id;
      o.salesBeatName = beat.name;
    }
    o.isDeliveryAddressUpdated = true;
  });
  persist();
  return new RawResponse({
    success: true,
    message: 'Delivery address updated successfully',
    data: { updatedCount: orders.length, targetCustomer: { name: customer.business_name || customer.customer_name, mobile: customer.mobile_number } },
  });
});

// ---------------------------------------------------------------- map
function addressLine(o: DbOrder) {
  const a = o.address || ({} as DbOrder['address']);
  return [a.line, a.locality, a.city, a.pincode].filter(Boolean).join(', ');
}

route('POST', BUYER, '/orders/map-locations', (req) => {
  const buyerId = req.body?.buyerId;
  const d = db();
  const relevant = d.orders.filter((o) => (!buyerId || o.buyerId === buyerId) && (o.orderStatusId === 1 || o.orderStatusId === 12) && !isSentToCds(o));
  // One location per customer + coordinates + delivery mode. A customer with both online and offline orders
  // therefore yields two locations that share a mobile number (the UI's first-match lookup collides — as built).
  const groups = new Map<string, DbOrder[]>();
  relevant.forEach((o) => {
    const mode = o.orderStatusId === 12 ? 'offline' : 'online';
    const key = `${o.customerId}|${o.lat}|${o.lng}|${mode}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(o);
  });
  const locations = Array.from(groups.values()).map((os) => {
    const first = os[0];
    const status = first.orderStatusId === 12 ? 'offline' : 'online';
    const valid = (n: unknown) => n !== null && n !== undefined && !isNaN(Number(n)) && String(n) !== '';
    return {
      lat: valid(first.lat) ? Number(first.lat).toFixed(7) : '',
      long: valid(first.lng) ? Number(first.lng).toFixed(7) : '',
      status,
      customerBusinessName: first.customerBusinessName,
      customerMobileNumber: first.customerMobileNumber,
      customerAddress: addressLine(first),
      orderCount: os.length,
      totalAmount: round2(os.reduce((s, o) => s + (Number(o.amount) || 0), 0)),
      totalVolumetricWeight: round2(os.reduce((s, o) => s + (Number(o.volumetricWeight) || 0), 0)),
      orders: os.map((o) => ({
        orderId: o.orderId,
        refOrderId: o.refOrderId,
        statusId: o.orderStatusId,
        orderType: o.orderType,
        salesPersonName: o.salesPersonName,
        salesBeatName: o.salesBeatName,
        amount: money(o.amount),
      })),
    };
  });
  const stats = {
    totalLocations: locations.length,
    totalOrders: relevant.length,
    totalAmount: round2(relevant.reduce((s, o) => s + (Number(o.amount) || 0), 0)),
    onlineLocations: locations.filter((l) => l.status === 'online').length,
    offlineLocations: locations.filter((l) => l.status === 'offline').length,
  };
  return { stats, locations };
});

route('PUT', BUYER, '/orders/offline-delivery', (req) => {
  const b = req.body || {};
  const action = String(b.action || '');
  const orderIds: string[] = Array.isArray(b.orderIds) ? b.orderIds.map(String) : [];
  if (!['mark_offline', 'mark_delivered', 'revert'].includes(action)) {
    return new RawResponse({ success: false, error: { code: 400, message: `Invalid action "${action}"` } });
  }
  if (!orderIds.length) return new RawResponse({ success: false, error: { code: 400, message: 'No orders provided' } });
  const d = db();
  const orders = orderIds.map((id) => d.orders.find((o) => o.orderId === id)).filter(Boolean) as DbOrder[];
  if (orders.length !== orderIds.length) return new RawResponse({ success: false, error: { code: 404, message: 'One or more orders were not found' } });
  const expected = action === 'mark_offline' ? 1 : 12;
  const bad = orders.filter((o) => o.orderStatusId !== expected);
  if (bad.length) {
    const message = action === 'mark_offline'
      ? 'Only Ready for Planning orders can be marked as offline delivery'
      : 'Only Offline Delivery orders can be updated with this action';
    return new RawResponse({ success: false, error: { code: 400, message } });
  }
  orders.forEach((o) => {
    if (action === 'mark_offline') {
      o.statusBeforeOffline = o.orderStatusId;
      o.orderStatusId = 12;
    } else if (action === 'mark_delivered') {
      o.orderStatusId = 5;
      o.items.forEach((it) => { it.deliveredQuantity = it.quantity; it.returnedQuantity = 0; });
      o.deliveryDate = new Date().toISOString();
    } else {
      o.orderStatusId = o.statusBeforeOffline ?? 1;
      o.statusBeforeOffline = null;
    }
  });
  persist();
  return { updatedCount: orders.length, action, orderIds };
});

// ---------------------------------------------------------------- order details
route('GET', BUYER, '/orders/order_details/:orderId', (req) => {
  const o = findOrder(req.params.orderId);
  if (!o) throw new MockError(404, 'Order not found', { success: false, error: { code: 404, message: 'Order not found' } });
  const trip = tripOf(o);
  const statusOnTrip = trip && [3, 4, 5, 6, 8].includes(o.orderStatusId);
  const deliverySchedule = statusOnTrip
    ? {
        date: trip!.pickupSlotStart || o.deliveryDate || '',
        pickupSlotStart: trip!.pickupSlotStart || '',
        estimatedTimeToDelivery: trip!.estimatedTimeToDelivery || '',
        deliveryExecutive: trip!.agentName ? `${trip!.agentName}${trip!.vehicleRegNumber ? ` (${trip!.vehicleRegNumber})` : ''}` : '',
        tripNumber: trip!.orderId || '',
        logisticsOrderId: trip!.logisticsOrderId,
        providerId: trip!.providerId,
        transactionId: trip!.transactionId,
      }
    : { date: '', pickupSlotStart: '', estimatedTimeToDelivery: '', deliveryExecutive: '', tripNumber: '', logisticsOrderId: null, providerId: null, transactionId: null };
  const a = o.address || ({} as DbOrder['address']);
  return {
    id: o.refOrderId,
    orderId: o.orderId,
    orderDate: localToIso(o.orderDate),
    statusId: o.orderStatusId,
    beatName: o.salesBeatName,
    customer: {
      businessName: o.customerBusinessName,
      contactNumber: o.customerMobileNumber,
      address: [a.line, a.locality].filter(Boolean).join(', '),
      city: a.city,
      state: a.state,
      country: a.country,
      pincode: a.pincode,
    },
    deliverySchedule,
    summary: {
      totalAmount: Number(o.amount) || 0,
      totalItems: (o.items || []).length,
      weight: Number(o.orderWeight) || 0,
      volume: Number(o.volumetricWeight) || 0,
      collectionDetails: '',
    },
    products: (o.items || []).map((it) => ({
      name: it.itemName,
      imageUrl: it.imageUrl,
      mrp: it.mrp,
      sellingPrice: it.sellingPrice,
      quantity: it.quantity,
      total: it.totalAmount,
    })),
  };
});

route('GET', BUYER, '/orders/is_return_order/:orderId', (req) => {
  const o = findOrder(req.params.orderId);
  if (!o) throw new MockError(404, 'Order not found', { success: false, error: { code: 404, message: 'Order not found' } });
  return { isReturnOrder: o.orderStatusId === 8 || o.orderStatusId === 6 };
});
