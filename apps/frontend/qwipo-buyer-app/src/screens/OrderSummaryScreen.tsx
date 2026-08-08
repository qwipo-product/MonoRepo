import { Icon, StatusBar } from '../components/Icons';
import { userProfile } from '@mockups/mock-data';

// Immediate off applied to the bill for a coupon. Cashback lands in the wallet
// later, so it isn't subtracted from To pay here.
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

export default function OrderSummaryScreen({
  cart,
  onBack,
  onPlaceOrder,
  onViewItems,
  appliedCoupon,
  couponSellerId,
  onOpenCoupons,
  onRemoveCoupon,
}: any) {
  const computeRow = (s: any) => {
    let subtotal = 0;
    let savings = 0;
    s.items.forEach((i: any) => {
      const it = i.price * i.quantity;
      subtotal += it;
      if (i.extraDiscount) savings += it * i.extraDiscount;
      if (i.flatOff) savings += i.flatOff;
    });
    return { ...s, subtotal, savings, final: subtotal - savings };
  };

  // Distributors stay as their own vendor cards; every wholesaler order is
  // pooled under a single "Qwipo" vendor (same as the cart summary), so Qwipo
  // shows up as one vendor rather than a card per wholesaler.
  const distributorRows = cart.sellers
    .filter((s: any) => (s.type || 'distributor') === 'distributor')
    .map(computeRow);

  const wholesalers = cart.sellers.filter((s: any) => s.type === 'wholesaler');
  const qwipoRow = wholesalers.length
    ? computeRow({
        id: 'qwipo-sellers',
        name: 'Qwipo',
        type: 'wholesaler',
        deliveryWindows: [{ day: 'Tomorrow' }],
        items: wholesalers.flatMap((w: any) => w.items),
      })
    : null;

  const sellerData = [...distributorRows, ...(qwipoRow ? [qwipoRow] : [])];

  const totalItems = sellerData.reduce(
    (n, s) => n + s.items.reduce((a, i) => a + i.quantity, 0),
    0
  );
  const grandTotal = sellerData.reduce((a, s) => a + s.final, 0);
  const deliveryFee = 30;
  const discount = couponDiscount(appliedCoupon, grandTotal, deliveryFee);
  const toPay = grandTotal + deliveryFee - discount;

  return (
    <>
      <StatusBar />
      <div className="screen-body">
        <div className="top-bar">
          <button className="icon-btn" onClick={onBack}>
            <Icon.Back />
          </button>
          <div className="top-title">
            <h1>Orders Summary</h1>
          </div>
        </div>

        <div className="order-summary">
          {sellerData.map((s) => {
            const brandCounts: Record<string, number> = {};
            s.items.forEach((i) => {
              brandCounts[i.brand] = (brandCounts[i.brand] || 0) + 1;
            });

            return (
              <div key={s.id} className="os-card">
                <div className="os-card-head">
                  <div className="os-seller">{s.name}</div>
                  <div className="os-total">
                    Total: <strong>₹{Math.round(s.final).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
                <div className="os-brands">
                  {Object.entries(brandCounts).map(([brand, n]) => (
                    <span key={brand} className="os-brand-row">
                      <span className="os-brand-name">{brand}</span>
                      <span className="os-brand-count">({n} items)</span>
                    </span>
                  ))}
                  <button className="os-view-items" onClick={() => onViewItems?.(s)}>
                    View items
                  </button>
                </div>
                <div className="os-delivery">
                  <span className="os-delivery-label">Delivery by</span>
                  <span className="os-delivery-value">{s.deliveryWindows?.[0]?.day || 'Tomorrow'}</span>
                </div>

                {/* Coupons live under the Qwipo vendor only — sits below
                    the delivery row. */}
                {s.id === 'qwipo-sellers' && (
                  appliedCoupon && couponSellerId === s.id ? (
                  <div className="os-coupon os-coupon-applied">
                    <span className="os-coupon-icon applied">
                      <Icon.Check />
                    </span>
                    <span className="os-coupon-text">
                      <span className="os-coupon-title">‘{appliedCoupon.code}’ applied</span>
                      <span className="os-coupon-sub">
                        You save {couponSavingsText(appliedCoupon, discount)}
                      </span>
                    </span>
                    <button
                      className="os-coupon-remove"
                      onClick={onRemoveCoupon}
                      aria-label="Remove coupon"
                    >
                      <Icon.Close size={16} />
                    </button>
                  </div>
                ) : (
                  <button className="os-coupon os-coupon-cta" onClick={() => onOpenCoupons?.(s.id)}>
                    <span className="os-coupon-icon">
                      <Icon.Tag />
                    </span>
                    <span className="os-coupon-text">
                      <span className="os-coupon-title">Qwipo Vendor Coupons</span>
                      <span className="os-coupon-sub">Offers available — tap to view &amp; apply</span>
                    </span>
                    <Icon.ChevronRight />
                  </button>
                  )
                )}
              </div>
            );
          })}

          {/* Bill details */}
          <div className="os-bill">
            <div className="os-bill-head">Bill details</div>
            <div className="os-bill-row">
              <span>Total Items</span>
              <span>{totalItems}</span>
            </div>
            <div className="os-bill-row">
              <span>Grand Total</span>
              <span>₹{Math.round(grandTotal).toLocaleString('en-IN')}</span>
            </div>
            <div className="os-bill-row">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee}</span>
            </div>
            {appliedCoupon && discount > 0 && (
              <div className="os-bill-row discount">
                <span>Coupon ({appliedCoupon.code})</span>
                <span>−₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="os-bill-row bold">
              <span>To pay:</span>
              <span>₹{Math.round(toPay).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Delivery address */}
          <div className="os-address">
            <div className="os-address-head">Delivery address</div>
            <div className="os-address-row">
              <div className="os-address-icon">
                <Icon.MapPin />
              </div>
              <div className="os-address-text">
                <div className="os-address-name">{userProfile.businessName}</div>
                <div className="os-address-line">
                  Shop 14, Lit Box Complex, Rai Durg, Hitech City, Hyderabad, Telangana – 500032
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="os-footer">
        <button className="os-place-btn" onClick={onPlaceOrder}>
          Place Order
        </button>
      </div>
    </>
  );
}
