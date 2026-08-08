import { MapPin, Check, Tag, X, ChevronRight } from 'lucide-react';
import { customer } from '../data';
import StatusBar from '../components/StatusBar';
import ScreenHeader from '../components/ScreenHeader';

function couponDiscount(coupon: any, grandTotal: number, deliveryFee: number) {
  if (!coupon) return 0;
  if (coupon.type === 'flat') return coupon.value;
  if (coupon.type === 'percent') return Math.round((grandTotal * coupon.value) / 100);
  if (coupon.type === 'free') return deliveryFee;
  return 0;
}
function couponSavingsText(coupon: any, discount: number) {
  if (coupon.type === 'free') return 'Free delivery';
  if (coupon.type === 'cashback') return `${coupon.value}% cashback to wallet`;
  return `₹${discount.toLocaleString('en-IN')}`;
}

/* Orders Summary — one bill card per seller (bms parity: JIT/VFF/Qwipo stay
   separate under "From Distributors"/"From Wholesalers"), coupon on Qwipo sellers
   only, bill details, delivery address, Place Order. */
// bms: coupons/offers show only for Qwipo Inventory (fulfilmentType QWIPO).
const isQwipoSeller = (s: any) => s.fulfilmentType === 1;

export default function OrderSummaryScreen({ cart, deliveryAddress, onBack, onPlaceOrder, onViewItems, appliedCoupon, couponSellerId, onOpenCoupons, onRemoveCoupon }: any) {
  const computeRow = (s: any) => {
    let subtotal = 0;
    let mrpSavings = 0;
    s.items.forEach((i: any) => {
      subtotal += i.price * i.quantity;
      if (i.mrp && i.mrp > i.price) mrpSavings += (i.mrp - i.price) * i.quantity;
    });
    return { ...s, subtotal, totalSavings: mrpSavings, final: subtotal };
  };

  const distributorRows = cart.sellers.filter((s: any) => (s.type || 'distributor') === 'distributor').map(computeRow);
  const wholesalerRows = cart.sellers.filter((s: any) => s.type === 'wholesaler').map(computeRow);
  const sellerData = [...distributorRows, ...wholesalerRows];

  const totalItems = sellerData.reduce((n, s) => n + s.items.reduce((a: number, i: any) => a + i.quantity, 0), 0);
  const grandTotal = sellerData.reduce((a, s) => a + s.final, 0);
  const grandSavings = sellerData.reduce((a, s) => a + s.totalSavings, 0);
  const deliveryFee = 30;
  const discount = couponDiscount(appliedCoupon, grandTotal, deliveryFee);
  const toPay = grandTotal + deliveryFee - discount;
  const addrName = deliveryAddress?.name || (customer as any).businessName;
  const addrLine = deliveryAddress
    ? `${deliveryAddress.line1}, ${deliveryAddress.line2}, ${deliveryAddress.city}, ${deliveryAddress.state} – ${deliveryAddress.pincode}`
    : `${(customer as any).address.line}, ${(customer as any).address.city}, ${(customer as any).address.state} – ${(customer as any).address.pincode}`;

  const renderSeller = (s: any) => {
    const brandCounts: Record<string, number> = {};
    s.items.forEach((i: any) => { brandCounts[i.brand] = (brandCounts[i.brand] || 0) + 1; });
    return (
      <div key={s.id} className="rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="text-sm font-semibold">{s.name}</div>
          <div className="text-right">
            <div className="text-sm">Total: <strong>₹{Math.round(s.final).toLocaleString('en-IN')}</strong></div>
            {s.totalSavings > 0 && <div className="text-xs text-emerald-700">You save ₹{Math.round(s.totalSavings).toLocaleString('en-IN')}</div>}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {Object.entries(brandCounts).map(([brand, n]) => (
            <span key={brand}>{brand} <span className="opacity-70">({n} items)</span></span>
          ))}
          <button onClick={() => onViewItems?.(s)} className="ml-auto font-medium text-primary">View items</button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Delivery by</span>
          <span className="font-medium">{s.deliveryWindows?.[0]?.day || 'Tomorrow'}</span>
        </div>

        {isQwipoSeller(s) && (
          appliedCoupon && couponSellerId === s.id ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white"><Check className="h-4 w-4" /></span>
              <span className="flex-1 text-sm">
                <span className="block font-semibold">'{appliedCoupon.code}' applied</span>
                <span className="block text-xs text-muted-foreground">You save {couponSavingsText(appliedCoupon, discount)}</span>
              </span>
              <button onClick={onRemoveCoupon} aria-label="Remove coupon" className="text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <button onClick={() => onOpenCoupons?.(s.id)} className="mt-3 flex w-full items-center gap-2 rounded-lg border border-border p-2.5 text-left">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary"><Tag className="h-4 w-4" /></span>
              <span className="flex-1 text-sm">
                <span className="block font-semibold">Qwipo Vendor Coupons</span>
                <span className="block text-xs text-muted-foreground">Offers available — tap to view &amp; apply</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader title="Orders Summary" onBack={onBack} />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {distributorRows.length > 0 && <div className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">From Distributors</div>}
        {distributorRows.map(renderSeller)}
        {wholesalerRows.length > 0 && <div className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">From Wholesalers</div>}
        {wholesalerRows.map(renderSeller)}

        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-2 text-sm font-semibold">Bill details</div>
          <Row label="Total Items" value={String(totalItems)} />
          <Row label="Grand Total" value={`₹${Math.round(grandTotal).toLocaleString('en-IN')}`} />
          {grandSavings > 0 && <Row label="You Save" value={`₹${Math.round(grandSavings).toLocaleString('en-IN')}`} good />}
          <Row label="Delivery Fee" value={`₹${deliveryFee}`} />
          {appliedCoupon && discount > 0 && <Row label={`Coupon (${appliedCoupon.code})`} value={`−₹${discount.toLocaleString('en-IN')}`} good />}
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2.5">
            <span className="text-base font-semibold">To pay</span>
            <span className="text-lg font-bold tabular-nums tracking-tight">₹{Math.round(toPay).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-2 text-sm font-semibold">Delivery address</div>
          <div className="flex gap-2">
            <MapPin className="h-5 w-5 shrink-0 text-primary" />
            <div className="text-sm">
              <div className="font-medium">{addrName}</div>
              <div className="text-xs text-muted-foreground">{addrLine}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-border bg-card p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <button onClick={onPlaceOrder} className="w-full rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]">Place Order</button>
      </div>
    </div>
  );
}

function Row({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={good ? 'text-emerald-700' : ''}>{value}</span>
    </div>
  );
}
