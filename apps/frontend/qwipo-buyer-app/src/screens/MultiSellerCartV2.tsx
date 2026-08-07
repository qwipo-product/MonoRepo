import { useState } from 'react';
import { Icon, StatusBar } from '../components/Icons';

// Cart Summary — reference-matched layout: per-seller card with a thumbnail
// rail, "Add More"/"View items" actions, and a radio-selectable "Delivery by"
// row sourced from each seller's own deliveryWindows (falls back to a
// generic Beat/Tomorrow pair when a seller doesn't define any). Wholesalers
// are pooled into a single "Qwipo Sellers" block, locked to one delivery day.

const FALLBACK_WINDOWS = [
  { day: 'Fri (Beat day)' },
  { day: 'Tomorrow' },
];

export default function MultiSellerCartV2({ cart, onBack, onCheckout, onAddMore, onViewItems }: any) {
  const [deliveryIndexBySeller, setDeliveryIndexBySeller] = useState<Record<string, number>>({});

  const distributors = cart.sellers.filter((s: any) => (s.type || 'distributor') === 'distributor');
  const wholesalers = cart.sellers.filter((s: any) => s.type === 'wholesaler');

  const computeSeller = (seller: any) => {
    let subtotal = 0;
    seller.items.forEach((item: any) => {
      subtotal += item.price * item.quantity;
    });
    return { ...seller, subtotal };
  };

  const distributorRows = distributors.map(computeSeller);

  let wholesalerRow: any = null;
  if (wholesalers.length) {
    const allItems = wholesalers.flatMap((w: any) => w.items);
    const subtotal = allItems.reduce((n: number, i: any) => n + i.price * i.quantity, 0);
    wholesalerRow = {
      id: 'qwipo-sellers',
      name: 'Qwipo Sellers',
      type: 'wholesaler',
      items: allItems,
      subtotal,
      deliveryWindows: [{ day: 'Saturday' }],
    };
  }

  const allRows = [...distributorRows, ...(wholesalerRow ? [wholesalerRow] : [])];
  const grandTotal = allRows.reduce((n, r) => n + r.subtotal, 0);

  return (
    <>
      <StatusBar />
      <div className="screen-body cart-v2">
        <div className="cart-v2-topbar">
          <button className="icon-btn" onClick={onBack} aria-label="Back">
            <Icon.Back />
          </button>
          <h1>Cart Summary</h1>
        </div>

        <div className="cart-v2-screen">
          {distributorRows.length > 0 && (
            <div className="cart-v2-divider">
              <span>From Distributors</span>
            </div>
          )}
          {distributorRows.map((s: any) => (
            <SellerCardV2
              key={s.id}
              seller={s}
              activeIndex={deliveryIndexBySeller[s.id] || 0}
              onPickDelivery={(idx: number) =>
                setDeliveryIndexBySeller((prev) => ({ ...prev, [s.id]: idx }))
              }
              onAddMore={() => onAddMore?.(s)}
              onViewItems={() => onViewItems?.(s)}
            />
          ))}

          {wholesalerRow && (
            <div className="cart-v2-divider">
              <span>From Wholesalers</span>
            </div>
          )}
          {wholesalerRow && (
            <SellerCardV2
              seller={wholesalerRow}
              activeIndex={0}
              onAddMore={() => onAddMore?.(wholesalerRow)}
              onViewItems={() => onViewItems?.(wholesalerRow)}
            />
          )}
        </div>
      </div>

      <div className="cart-v2-footer">
        <div className="cart-v2-footer-left">
          <div className="cart-v2-footer-label">Total Cart Value:</div>
          <div className="cart-v2-footer-total">
            ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <button className="cart-v2-checkout" onClick={onCheckout}>Checkout</button>
      </div>
    </>
  );
}

function SellerCardV2({ seller, activeIndex, onPickDelivery, onAddMore, onViewItems }: any) {
  const isWholesaler = seller.type === 'wholesaler';
  const windows: { day: string }[] = seller.deliveryWindows?.length
    ? seller.deliveryWindows
    : FALLBACK_WINDOWS;

  // Build a flat product rail. Any item carrying free pieces gets an extra
  // synthetic "FREE" card after it so the buyer sees the scheme delivery at
  // a glance.
  type RailItem = {
    key: string;
    image: string;
    bgColor?: string;
    quantity: number;
    price: number;
    isFree?: boolean;
  };
  const rail: RailItem[] = [];
  seller.items.forEach((item: any, idx: number) => {
    rail.push({
      key: `${item.productId}-${idx}`,
      image: item.image,
      bgColor: item.bgColor,
      quantity: item.quantity,
      price: item.price * item.quantity,
    });
    if (item.freeQty && item.freeQty > 0) {
      rail.push({
        key: `${item.productId}-${idx}-free`,
        image: item.image,
        bgColor: item.bgColor,
        quantity: item.freeQty,
        price: 0,
        isFree: true,
      });
    }
  });

  return (
    <div className="cart-v2-card">
      <div className="cart-v2-card-head">
        <div className="cart-v2-card-headl">
          <div className="cart-v2-card-meta">Buying from</div>
          <div className="cart-v2-card-name">{seller.name}</div>
          <div className="cart-v2-card-meta">Total Items: {seller.items.length}</div>
        </div>
        <div className="cart-v2-card-headr">
          <div className="cart-v2-card-total">
            Total: <span>₹{Math.round(seller.subtotal).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="cart-v2-card-actions">
        <button className="cart-v2-pill" onClick={onAddMore}>
          <Icon.Plus /> Add More
        </button>
        <button className="cart-v2-pill" onClick={onViewItems}>
          View items
        </button>
      </div>

      <div className="cart-v2-rail">
        {rail.map((it) => (
          <div key={it.key} className="cart-v2-rail-item">
            <div className="cart-v2-rail-img" style={{ background: it.bgColor || '#f3f4f6' }}>
              <span>{it.image}</span>
              {it.isFree && <div className="cart-v2-rail-free">FREE</div>}
            </div>
            <div className="cart-v2-rail-qty">({it.quantity})</div>
            <div className="cart-v2-rail-price">₹ {it.price}</div>
          </div>
        ))}
      </div>

      <div className="cart-v2-delivery">
        <div className="cart-v2-delivery-left">
          <div className="cart-v2-delivery-label">Delivery by</div>
          <div className="cart-v2-delivery-radios" role="radiogroup">
            {windows.map((w, i) => {
              const active = isWholesaler ? true : i === activeIndex;
              return (
                <button
                  key={w.day}
                  role="radio"
                  aria-checked={active}
                  className={`cart-v2-radio ${active ? 'active' : ''}`}
                  onClick={() => !isWholesaler && onPickDelivery?.(i)}
                  disabled={isWholesaler}
                >
                  <span className="cart-v2-radio-dot" aria-hidden="true" />
                  {w.day}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
