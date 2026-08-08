import { Icon } from './Icons';

// Per-vendor money/requirement summary shown in the Cart Summary card and on
// the View Items screen. Kept in one place so both stay in sync.
//
// MOV is value-based here (₹). A vendor can instead carry a weight minimum
// (minOrderWeight, in kg) — when present it takes over and the remaining is
// shown in kg. Falls back to a wholesaler default so pooled "Qwipo" still
// shows a requirement.
const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function requirement(min: number | null, current: number) {
  if (min == null) return null;
  const remaining = Math.max(0, min - current);
  return { min, remaining, met: remaining === 0 };
}

export function computeVendorSummary(seller: any) {
  let subtotal = 0;
  let savings = 0;
  let weight = 0;
  seller.items.forEach((i: any) => {
    subtotal += i.price * i.quantity;
    if (i.mrp && i.mrp > i.price) savings += (i.mrp - i.price) * i.quantity;
    if (i.weight) weight += i.weight * i.quantity;
  });

  const mov =
    seller.mov ??
    seller.deliveryWindows?.find((w: any) => w.mov)?.mov ??
    (seller.type === 'wholesaler' ? 3000 : null);

  // A vendor can enforce value (MOV), weight, or BOTH — each is tracked
  // independently and shown while unmet.
  const value = requirement(mov, subtotal);
  const wt = requirement(seller.minOrderWeight ?? null, weight);

  const allMet = (value ? value.met : true) && (wt ? wt.met : true);
  const deliveryFee = allMet ? 0 : 30;

  return { subtotal, savings, value, weight: wt, allMet, deliveryFee };
}

// Savings + delivery, stacked under the "Total" in a vendor card header.
export function VendorMoney({ seller }: any) {
  const { savings, deliveryFee } = computeVendorSummary(seller);
  return (
    <div className="vendor-money">
      {savings > 0 && <span className="vendor-money-save">You save {fmt(savings)}</span>}
      <span className={deliveryFee > 0 ? 'vendor-money-fee' : 'vendor-money-free'}>
        {deliveryFee > 0 ? `Delivery ${fmt(deliveryFee)}` : 'Free Delivery'}
      </span>
    </div>
  );
}

// Min. order value/weight + remaining, under "Total Items" in a vendor card
// header. Shows only unmet requirements (value and weight can both appear).
export function VendorRequirements({ seller }: any) {
  const { value, weight } = computeVendorSummary(seller);
  if ((!value || value.met) && (!weight || weight.met)) return null;
  return (
    <div className="vendor-req">
      {value && !value.met && (
        <div className="vendor-req-row">
          <span className="vendor-req-label">Min. value {fmt(value.min)}</span>
          <span className="vendor-req-remain">Add {fmt(value.remaining)} more</span>
        </div>
      )}
      {weight && !weight.met && (
        <div className="vendor-req-row">
          <span className="vendor-req-label">Min. weight {weight.min} kg</span>
          <span className="vendor-req-remain">Add {weight.remaining} kg more</span>
        </div>
      )}
    </div>
  );
}

export default function VendorSummary({ seller, className = '' }: any) {
  const { savings, value, weight, deliveryFee } = computeVendorSummary(seller);

  return (
    <div className={`vendor-summary ${className}`}>
      <div className="vendor-summary-row">
        <span className="vendor-summary-label">Savings</span>
        <span className="vendor-summary-save">You save {fmt(savings)}</span>
      </div>
      <div className="vendor-summary-row">
        <span className="vendor-summary-label">Delivery</span>
        <span className={deliveryFee > 0 ? 'vendor-summary-fee' : 'vendor-summary-free'}>
          {deliveryFee > 0 ? fmt(deliveryFee) : 'Free Delivery'}
        </span>
      </div>

      {/* Each requirement shows only while unmet — value and weight can both
          appear for a vendor that enforces both. */}
      {value && !value.met && (
        <div className="vendor-summary-mov short">
          <div className="vendor-summary-mov-req">
            <Icon.Truck />
            Min. order value {fmt(value.min)}
          </div>
          <div className="vendor-summary-mov-remain">
            Add {fmt(value.remaining)} more to place this order
          </div>
        </div>
      )}
      {weight && !weight.met && (
        <div className="vendor-summary-mov short">
          <div className="vendor-summary-mov-req">
            <Icon.Truck />
            Min. order weight {weight.min} kg
          </div>
          <div className="vendor-summary-mov-remain">
            Add {weight.remaining} kg more to place this order
          </div>
        </div>
      )}
    </div>
  );
}
