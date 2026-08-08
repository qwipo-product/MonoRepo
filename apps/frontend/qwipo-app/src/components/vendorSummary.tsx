import { Truck } from 'lucide-react';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function requirement(min: number | null, current: number) {
  if (min == null) return null;
  const remaining = Math.max(0, min - current);
  return { min, remaining, met: remaining === 0 };
}

/* Per-vendor money + MOV requirement. Kept in one place so the cart card and
   View Items stay in sync. Parity port of qwipo-buyer-app's VendorSummary. */
export function computeVendorSummary(seller: any) {
  let subtotal = 0;
  let savings = 0;
  let weight = 0;
  seller.items.forEach((i: any) => {
    subtotal += i.price * i.quantity;
    if (i.mrp && i.mrp > i.price) savings += (i.mrp - i.price) * i.quantity;
    if (i.weight) weight += i.weight * i.quantity;
  });
  const mov = seller.mov ?? seller.deliveryWindows?.find((w: any) => w.mov)?.mov ?? (seller.type === 'wholesaler' ? 3000 : null);
  const value = requirement(mov, subtotal);
  const wt = requirement(seller.minOrderWeight ?? null, weight);
  const allMet = (value ? value.met : true) && (wt ? wt.met : true);
  return { subtotal, savings, value, weight: wt, allMet, deliveryFee: allMet ? 0 : 30 };
}

export function VendorMoney({ seller }: any) {
  const { savings, deliveryFee } = computeVendorSummary(seller);
  return (
    <div className="mt-1 flex flex-col items-end gap-0.5 text-xs">
      {savings > 0 && <span className="text-emerald-700">You save {fmt(savings)}</span>}
      <span className={deliveryFee > 0 ? 'text-amber-700' : 'text-emerald-700'}>
        {deliveryFee > 0 ? `Delivery ${fmt(deliveryFee)}` : 'Free Delivery'}
      </span>
    </div>
  );
}

export function VendorRequirements({ seller }: any) {
  const { value, weight } = computeVendorSummary(seller);
  if ((!value || value.met) && (!weight || weight.met)) return null;
  return (
    <div className="mt-1.5 space-y-1 rounded-lg bg-amber-50 p-2 text-xs">
      {value && !value.met && (
        <div className="flex items-center gap-1.5 text-amber-800">
          <Truck className="h-3.5 w-3.5" /> Min. value {fmt(value.min)} — <strong>Add {fmt(value.remaining)} more</strong>
        </div>
      )}
      {weight && !weight.met && (
        <div className="flex items-center gap-1.5 text-amber-800">
          <Truck className="h-3.5 w-3.5" /> Min. weight {weight.min} kg — <strong>Add {weight.remaining} kg more</strong>
        </div>
      )}
    </div>
  );
}
