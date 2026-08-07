import { useState } from 'react';
import { Icon } from './Icons';
import { SheetHeader, useSheetSwipe } from './SheetBase';

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

  const totalPcs =
    packQuantities.pc +
    packQuantities.set * Math.floor(variant.casePcs / 2 || 1) +
    packQuantities.case * variant.casePcs;

  const totalValue =
    packQuantities.pc * variant.sellingPrice +
    packQuantities.set * variant.sellingPrice * Math.floor(variant.casePcs / 2 || 1) +
    packQuantities.case * variant.casePrice;

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
              {product.image}
            </div>
            <div className="sheet-product-info">
              <div className="sheet-product-name">{product.name}</div>
              <div className="variant-pills" style={{ marginTop: '8px' }}>
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    className={`variant-pill ${v.id === variantId ? 'active' : ''}`}
                    onClick={() => setVariantId(v.id)}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Seller selector — same chips as the product-listing card.
              Hidden on the View Items sheet (hidePrice). */}
          {!hidePrice && sellerOptions?.length > 0 && (
            <div className="seller-options" style={{ marginBottom: '12px' }}>
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

          {/* Pack options */}
          <div className="sheet-pack-options">
            <div className={`pack-option ${packQuantities.pc > 0 ? 'selected' : ''}`}>
              <div className="pack-icon">📦</div>
              <div className="pack-info">
                <div className="pack-label">1 X 1</div>
                <div className="pack-detail">
                  1 Pc{!hidePrice && <> · <strong>₹{variant.sellingPrice}</strong></>}
                </div>
              </div>
              {packQuantities.pc > 0 ? (
                <div className="pack-mini-qty">
                  <button onClick={() => updateQty('pc', -1)}>
                    <Icon.Minus />
                  </button>
                  <span>{packQuantities.pc}</span>
                  <button onClick={() => updateQty('pc', 1)}>
                    <Icon.Plus />
                  </button>
                </div>
              ) : (
                <button className="pack-add-btn" onClick={() => updateQty('pc', 1)}>
                  <Icon.Plus /> Add
                </button>
              )}
            </div>

            {variant.casePcs > 1 && (
              <div className={`pack-option ${packQuantities.case > 0 ? 'selected' : ''}`}>
                <div className="pack-icon">📦</div>
                <div className="pack-info">
                  <div className="pack-label">1 X {variant.casePcs}</div>
                  <div className="pack-detail">
                    1 Case{!hidePrice && <> · <strong>₹{variant.casePrice.toLocaleString('en-IN')}</strong></>}
                  </div>
                </div>
                {packQuantities.case > 0 ? (
                  <div className="pack-mini-qty">
                    <button onClick={() => updateQty('case', -1)}>
                      <Icon.Minus />
                    </button>
                    <span>{packQuantities.case}</span>
                    <button onClick={() => updateQty('case', 1)}>
                      <Icon.Plus />
                    </button>
                  </div>
                ) : (
                  <button className="pack-add-btn" onClick={() => updateQty('case', 1)}>
                    <Icon.Plus /> Add
                  </button>
                )}
              </div>
            )}

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
