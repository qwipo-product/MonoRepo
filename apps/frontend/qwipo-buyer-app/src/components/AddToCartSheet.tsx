import { useState } from 'react';
import { Icon } from './Icons';
import { SheetHeader, useSheetSwipe } from './SheetBase';

// Drop the packaging descriptor so sizes read "1 Ltr" / "500 ml", not
// "1 Ltr Pouch" / "500 ml Pouch".
const stripPack = (s: string) =>
  s.replace(/\s+(Pouch|Jar|Tin|Box|Packet|Bottle|Sachet|Carton|Bag|Tube|Pack)s?$/i, '');

const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
  </svg>
);

export default function AddToCartSheet({ product, initialVariant, sellerOptions, onClose, onConfirm, hidePrice }: any) {
  const { dragHandlers, sheetStyle } = useSheetSwipe(onClose);
  const [variantId, setVariantId] = useState(initialVariant?.id || product.variants[0].id);
  const [packQuantities, setPackQuantities] = useState({ pc: 0, set: 0, case: 0 });
  const [sellerId, setSellerId] = useState(sellerOptions?.[0]?.id);

  const variant = product.variants.find((v) => v.id === variantId);

  // Order tiers: a single piece, a half-case "set", and a full case. The set
  // tier only appears when it's a distinct size between 1 and the full case
  // (the middle row that used to be computed but never rendered).
  const setPcs = Math.floor(variant.casePcs / 2) || 1;
  const tiers = [
    { key: 'pc', n: 1 },
    ...(setPcs > 1 && setPcs < variant.casePcs ? [{ key: 'set', n: setPcs }] : []),
    ...(variant.casePcs > 1 ? [{ key: 'case', n: variant.casePcs }] : []),
  ];

  const totalPcs = tiers.reduce((sum, t) => sum + packQuantities[t.key] * t.n, 0);
  const totalValue = tiers.reduce(
    (sum, t) => sum + packQuantities[t.key] * t.n * variant.sellingPrice,
    0
  );

  const updateQty = (key, delta) => {
    setPackQuantities((p) => ({
      ...p,
      [key]: Math.max(0, p[key] + delta),
    }));
  };

  const handleConfirm = () => {
    if (totalPcs === 0) {
      onClose();
      return;
    }
    onConfirm(product, variant, totalPcs);
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <SheetHeader
          icon={<CartIcon />}
          title="Add to Cart"
          subtitle="Please select the quantity to add to your cart"
          onClose={onClose}
          dragHandlers={dragHandlers}
        />

        <div className="sheet-body">
          {/* Product info */}
          <div className="sheet-product">
            <div className="sheet-product-img" style={{ background: product.bgColor }}>
              {product.images?.[0] ? (
                <img src={product.images[0]} alt="" />
              ) : (
                product.image
              )}
            </div>
            <div className="sheet-product-info">
              <div className="sheet-product-name">{product.name}</div>
              <div className="variant-pills u-mt-8">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    className={`variant-pill ${v.id === variantId ? 'active' : ''}`}
                    onClick={() => setVariantId(v.id)}
                  >
                    {stripPack(v.size)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MRP / SP / Margin — shown in both the Products and the
              View Items → Add to Cart flows so pricing stays consistent. */}
          {!hidePrice && (
            <div className="sheet-pricing">
              <div className="sheet-pricing-cell">
                <span className="sheet-pricing-label">MRP</span>
                <span className="sheet-pricing-mrp">₹{variant.mrp}</span>
              </div>
              <div className="sheet-pricing-cell">
                <span className="sheet-pricing-label">SP</span>
                <span className="sheet-pricing-sp">₹{variant.sellingPrice}</span>
              </div>
              <span className="margin-badge">{variant.margin}% Margin</span>
            </div>
          )}

          {/* Seller selector — same chips as the product-listing card.
              Hidden on the View Items sheet (hidePrice). */}
          {!hidePrice && sellerOptions?.length > 0 && (
            <div className="seller-options u-mb-12">
              {sellerOptions.map((s) => {
                const isActive = s.id === sellerId;
                return (
                  <button
                    key={s.id}
                    className={`seller-option ${isActive ? 'active' : ''}`}
                    onClick={() => setSellerId(s.id)}
                  >
                    <div className="seller-option-price">₹{s.price.toLocaleString('en-IN')}</div>
                    <div className="seller-option-name">{s.name}</div>
                    <div className="seller-option-fee">
                      <Icon.PackageOpen /> Fee: ₹{isActive ? 2 : 1}/kg
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Pack options — one row per tier (piece / set / case). Each shows
              the per-piece price and the pack total, plus its own qty stepper. */}
          <div className="sheet-pack-options">
            {tiers.map((t) => {
              const qty = packQuantities[t.key];
              const unit = variant.sellingPrice;
              return (
                <div key={t.key} className={`pack-option ${qty > 0 ? 'selected' : ''}`}>
                  <div className="pack-icon">📦</div>
                  <div className="pack-info">
                    <div className="pack-label">1 X {t.n}</div>
                    <div className="pack-detail">
                      {t.n} Pc{t.n > 1 ? 's' : ''}
                    </div>
                  </div>
                  {!hidePrice && (
                    <div className="pack-prices">
                      <div className="pack-unit">
                        ₹{unit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="pack-total">
                        ₹{(unit * t.n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  )}
                  <div className="pack-action">
                    {qty > 0 ? (
                      <div className="pack-mini-qty">
                        <button onClick={() => updateQty(t.key, -1)}>
                          <Icon.Minus />
                        </button>
                        <span>{qty}</span>
                        <button onClick={() => updateQty(t.key, 1)}>
                          <Icon.Plus />
                        </button>
                      </div>
                    ) : (
                      <button className="pack-add-btn" onClick={() => updateQty(t.key, 1)}>
                        <Icon.Plus /> Add
                      </button>
                    )}
                    {qty > 0 && (
                      <div className="pack-qty-caption">
                        {qty * t.n} Pc{qty * t.n > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="sheet-footer">
          <div className="sheet-footer-info">
            <div className="sheet-footer-label">Total Cart Value:</div>
            <div className="sheet-footer-value">₹{totalValue.toLocaleString('en-IN')}</div>
          </div>
          <button className="sheet-continue" onClick={handleConfirm}>
            {totalPcs === 0 ? 'Close' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
