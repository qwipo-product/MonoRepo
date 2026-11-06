// Orders feature seed extension: extra Pending (status 9) orders whose validation errors exercise every
// Fix Order Errors field type (date, select, number with min/max, tel, pattern, unknown field, product-only
// orders, product errors without an itemId → "unknown" group, items without a row number).
import type { MockDatabase, Rng } from '../seed';
import type { DbOrder, DbValidationError } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');

export const seed = (db: MockDatabase, rng: Rng) => {
  const template = db.orders.find((o) => o.orderStatusId === 1 && !o.tripId);
  if (!template) return;
  const customers = db.customers;
  const now = new Date();
  const createdAt = new Date(now);
  createdAt.setHours(now.getHours() - 1, 12, 0, 0);
  const orderDate = new Date(now);
  orderDate.setDate(orderDate.getDate() - 1);
  const orderDateStr = `${orderDate.getFullYear()}-${pad(orderDate.getMonth() + 1)}-${pad(orderDate.getDate())} 05:30:00`;

  const clone = (customerIdx: number, ref: string, errors: DbValidationError[], minutesAgo: number): DbOrder => {
    const c = customers[customerIdx % customers.length];
    const beat = db.beats.find((b) => b.id === c.beatId);
    const items = template.items.map((it) => ({ ...it, itemId: rng.uuid() }));
    const amount = Math.round(items.reduce((s, it) => s + it.totalAmount, 0) * 100) / 100;
    const weight = Math.round(items.reduce((s, it) => s + it.weightKg * it.quantity, 0) * 100) / 100;
    const created = new Date(createdAt.getTime() - minutesAgo * 60000).toISOString();
    return {
      ...template,
      orderId: rng.uuid(),
      refOrderId: ref,
      customerId: c.id,
      customerName: c.customer_name,
      customerBusinessName: c.business_name,
      customerMobileNumber: c.mobile_number,
      address: { line: c.address.split(', ').slice(1, -1).join(', ') || c.address, locality: c.locality, city: 'Hyderabad', state: 'Telangana', country: 'INDIA', pincode: c.pincode },
      lat: Number(c.latitude),
      lng: Number(c.longitude),
      amount,
      orderWeight: weight,
      volumetricWeight: Math.round(weight * 1.08 * 100) / 100,
      orderType: 'Sales',
      salesPersonName: db.salesPersons[customerIdx % db.salesPersons.length]?.name ?? null,
      salesBeatName: beat?.name ?? null,
      beatId: beat?.id ?? null,
      createdAt: created,
      orderDate: orderDateStr,
      deliveryDate: null,
      orderStatusId: 9,
      validationErrors: errors,
      isDeliveryAddressUpdated: false,
      tripId: null,
      tripHistory: [],
      items,
      rtoReasonId: null,
      returnReason: null,
      routePlanComboId: null,
      statusBeforeOffline: null,
      source: 'import',
    };
  };

  const yr = String(now.getFullYear()).slice(2);
  const nextYr = String(now.getFullYear() + 1).slice(2);

  // A: customer & order errors only — covers every customer-level metadata type.
  const a: DbValidationError[] = [
    { group: 'customer_order', fieldName: 'customer_uniq_identifier', currentValue: '', isMandatory: true, errorMessage: 'UID is required' },
    { group: 'customer_order', fieldName: 'order_date', currentValue: '31-02-2026', isMandatory: true, errorMessage: 'Billing Date is not a valid date' },
    { group: 'customer_order', fieldName: 'customer_lat', currentValue: '-17.3384', isMandatory: true, errorMessage: 'Delivery Latitude is outside the service area' },
    { group: 'customer_order', fieldName: 'customer_long', currentValue: '', isMandatory: true, errorMessage: 'Delivery Longitude is required' },
    { group: 'customer_order', fieldName: 'customer_pincode', currentValue: '50007', isMandatory: true, errorMessage: 'Pincode must be 6 digits' },
    { group: 'customer_order', fieldName: 'order_type', currentValue: 'Unnati Plus', isMandatory: true, errorMessage: 'Order Type must be Digital or Sales' },
    { group: 'customer_order', fieldName: 'total_amount', currentValue: '-250', isMandatory: false, errorMessage: 'Net Invoice Value cannot be negative' },
    { group: 'customer_order', fieldName: 'customer_address', currentValue: '', isMandatory: true, errorMessage: 'Store Address is required' },
  ];
  // B: product errors only (the customer tab is disabled, the dialog opens on the product tab).
  const b: DbValidationError[] = [
    { group: 'product', fieldName: 'item_name', currentValue: '', isMandatory: true, errorMessage: 'Item Description is required', itemId: 'ASATTANMP5KG', rowNumber: 4 },
    { group: 'product', fieldName: 'length', currentValue: '0', isMandatory: true, errorMessage: 'Length must be greater than 0', itemId: 'ASATTANMP5KG', rowNumber: 4 },
    { group: 'product', fieldName: 'width', currentValue: '', isMandatory: true, errorMessage: 'Width is required', itemId: 'ASATTANMP5KG', rowNumber: 4 },
    { group: 'product', fieldName: 'height', currentValue: '0.05', isMandatory: true, errorMessage: 'Height must be at least 0.1', itemId: 'ASATTANMP5KG', rowNumber: 4 },
    { group: 'product', fieldName: 'unit_weight', currentValue: '0', isMandatory: true, errorMessage: 'Weight must be greater than 0', itemId: 'FB701431C' },
    { group: 'product', fieldName: 'mrp', currentValue: '0', isMandatory: true, errorMessage: 'MRP must be greater than 0', itemId: 'FB701431C' },
    { group: 'product', fieldName: 'hsn_code', currentValue: '12AB', isMandatory: false, errorMessage: 'HSN code should be numeric' },
  ];
  // C: both groups, including a tel field and the alphabetic-only beat.
  const c: DbValidationError[] = [
    { group: 'customer_order', fieldName: 'customer_mobile_number', currentValue: '959911690', isMandatory: true, errorMessage: 'Store Mobile must be a valid 10-digit number' },
    { group: 'customer_order', fieldName: 'beat', currentValue: 'Beat 1', isMandatory: false, errorMessage: 'Beat should contain alphabetic characters only' },
    { group: 'product', fieldName: 'mrp', currentValue: '0', isMandatory: true, errorMessage: 'MRP must be greater than 0', itemId: 'FB701431C', rowNumber: 5 },
  ];

  db.orders.push(
    clone(5, `INV/${yr}-${nextYr}/009871`, a, 3),
    clone(11, `INV/${yr}-${nextYr}/009874`, b, 6),
    clone(17, `INV/${yr}-${nextYr}/009880`, c, 9),
  );
  db.orders.sort((x, y) => y.createdAt.localeCompare(x.createdAt));
};
