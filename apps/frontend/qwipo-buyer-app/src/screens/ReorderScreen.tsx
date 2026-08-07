import { useState } from 'react';
import { Icon, StatusBar } from '../components/Icons';
import BottomNav from '../components/BottomNav';
import { reorderHistory, products } from '@mockups/mock-data';

// Two wholesaler price options per SKU, same deterministic-offset pattern as
// WholesalerProductListScreen so numbers stay stable across re-renders.
const SELLERS = [
  { id: 'seller1', name: 'Seller 1' },
  { id: 'seller2', name: 'Seller 2' },
];

function pricesForProduct(productId: string, basePrice: number) {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) hash = (hash * 31 + productId.charCodeAt(i)) >>> 0;
  return SELLERS.map((s, i) => {
    const offset = ((hash >> (i * 3)) & 0xf) - 7;
    const price = Math.max(Math.round(basePrice + offset), 1);
    return { seller: s, price };
  });
}

const stripPack = (s: string) =>
  s.replace(/\s+(Pouch|Jar|Tin|Box|Packet|Bottle|Sachet|Carton|Bag|Tube)s?$/i, '');

export default function ReorderScreen({
  cartCount,
  onNavigate,
  onOpenSheet,
  onOpenImageSheet,
  onOpenDiscounts,
  onGoToCart,
  cartTotal = 0,
}: any) {
  const [tab, setTab] = useState('wholesaler');
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});
  const [selectedSeller, setSelectedSeller] = useState<Record<string, string>>({});

  const visibleHistory = reorderHistory.filter((h) => h.sellerType === tab);

  return (
    <>
      <StatusBar />
      <div className="screen-body">
        {/* Sticky cluster: header + pill tabs stay pinned while content scrolls. */}
        <div className="dl-sticky-top">
          <div className="top-bar">
            <div className="top-title">
              <h1>Reorder</h1>
              <p>{tab === 'wholesaler' ? 'Wholesalers' : 'Distributors'}</p>
            </div>
            <button className="icon-btn">
              <Icon.Search />
            </button>
          </div>

          {/* Pill toggle tabs — Wholesalers / Distributors */}
          <div className="toggle-tabs">
            <button
              className={`toggle-tab ${tab === 'wholesaler' ? 'active' : ''}`}
              onClick={() => setTab('wholesaler')}
            >
              Wholesalers
            </button>
            <button
              className={`toggle-tab ${tab === 'distributor' ? 'active' : ''}`}
              onClick={() => setTab('distributor')}
            >
              Distributors
            </button>
          </div>
        </div>

        {tab === 'distributor' ? (
          <ReorderComingSoon />
        ) : (
          <div className="product-list" style={{ paddingTop: 12 }}>
            {visibleHistory.map((h) => {
              const product = products.find((p) => p.id === h.productId);
              if (!product) return null;

              const activeVarId = selectedVariant[product.id] || h.variantId || product.variants[0].id;
              const variant =
                product.variants.find((v) => v.id === activeVarId) || product.variants[0];
              const prices = pricesForProduct(product.id, variant.sellingPrice);
              const activeSellerId = selectedSeller[product.id] || prices[0].seller.id;
              const activePrice = prices.find((p) => p.seller.id === activeSellerId)!;
              const sizeTitle = stripPack(variant.size).replace(/\b\w/g, (c) => c.toUpperCase());

              return (
                <div key={product.id + variant.id} className="product-card">
                  <div className="product-card-top">
                    <div className="product-info">
                      <div className="product-name">
                        {product.name} - {sizeTitle} Packet X {variant.casePcs} Nos
                      </div>
                      <div className="product-subline">
                        <span>Case: {variant.casePcs} pc</span>
                      </div>
                    </div>
                    <button
                      className="product-img"
                      onClick={() => onOpenImageSheet?.(product)}
                      aria-label={`View images for ${product.name}`}
                    >
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} />
                      ) : (
                        <span style={{ fontSize: 30 }}>{product.image}</span>
                      )}
                    </button>
                  </div>

                  {/* Variants (pack size) */}
                  <div className="variant-pills">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        className={`variant-pill ${v.id === activeVarId ? 'active' : ''}`}
                        onClick={() =>
                          setSelectedVariant({ ...selectedVariant, [product.id]: v.id })
                        }
                      >
                        {stripPack(v.size)}
                      </button>
                    ))}
                  </div>

                  {/* Seller price options */}
                  <div className="seller-options">
                    {prices.map((pr) => {
                      const isActive = pr.seller.id === activeSellerId;
                      return (
                        <button
                          key={pr.seller.id}
                          className={`seller-option ${isActive ? 'active' : ''}`}
                          onClick={() =>
                            setSelectedSeller({ ...selectedSeller, [product.id]: pr.seller.id })
                          }
                        >
                          <div className="seller-option-price">
                            ₹{pr.price.toLocaleString('en-IN')}
                          </div>
                          <div className="seller-option-name">{pr.seller.name}</div>
                          <div className="seller-option-fee">
                            <Icon.Truck /> Free Delivery
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Pricing */}
                  <div className="product-price-row">
                    <div className="margin-badge">{variant.margin}% Margin</div>
                    <div className="price-block">
                      <div className="price-mrp-row">
                        MRP <span className="price-mrp">₹ {variant.mrp}</span>
                      </div>
                      <div className="price-main">
                        <span className="price-current">₹ {activePrice.price}</span>
                        <span className="price-unit">/pc</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="product-actions">
                    <button
                      className="discounts-btn-filled"
                      onClick={() => onOpenDiscounts?.(product, variant)}
                    >
                      Discounts <Icon.ChevronDown />
                    </button>
                    <button className="add-btn compact" onClick={() => onOpenSheet?.(product, variant)}>
                      <Icon.Plus /> Add
                    </button>
                  </div>

                  <div className="reorder-delivery-line">
                    <Icon.Truck size={14} /> Delivery by Tomorrow
                  </div>
                </div>
              );
            })}

            {visibleHistory.length === 0 && (
              <div className="reorder-empty">
                <div className="reorder-empty-emoji">📋</div>
                <div className="reorder-empty-title">No previous orders</div>
                <div className="reorder-empty-sub">
                  Items you've previously ordered from wholesalers will appear here.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {tab === 'wholesaler' && cartTotal > 0 && (
        <div className="cart-strip">
          <div className="cart-strip-info">
            <div className="cart-strip-label">Total Cart Value:</div>
            <div className="cart-strip-value">
              ₹{cartTotal.toLocaleString('en-IN')} <Icon.Truck size={13} /> + ₹12 Fees
            </div>
          </div>
          <button className="cart-strip-btn" onClick={onGoToCart}>
            <Icon.Cart />
            Cart
          </button>
        </div>
      )}

      <BottomNav active="listing" cartCount={cartCount} onNavigate={onNavigate} />
    </>
  );
}

function ReorderComingSoon() {
  return (
    <div className="reorder-coming-soon">
      <ComingSoonIllustration />
      <div className="reorder-empty-title">Reorder from distributors is coming soon</div>
      <div className="reorder-empty-sub">Please come back later.</div>
    </div>
  );
}

function ComingSoonIllustration() {
  return (
    <svg
      className="coming-soon-illustration"
      viewBox="0 0 220 190"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="110" cy="176" rx="70" ry="8" fill="#F3E8FF" />
      <path d="M40 78 L40 60 Q40 44 60 44 L160 44 Q180 44 180 60 L180 78 Z" fill="#D8B4FE" />
      <rect x="40" y="78" width="140" height="14" fill="#A855F7" />
      <rect x="46" y="92" width="128" height="76" fill="#C084FC" />
      <path d="M110 44 L100 20 L130 20 L120 44 Z" fill="#7E22CE" />
      <rect x="106" y="16" width="10" height="8" fill="#FAFAFA" />
      <rect x="46" y="92" width="40" height="76" fill="#E9D5FF" opacity="0.5" />
      <rect x="94" y="126" width="32" height="42" fill="#ffffff" />
      <rect x="52" y="98" width="30" height="24" fill="#1F2937" />
      <rect x="52" y="98" width="30" height="24" fill="none" stroke="#4B5563" strokeWidth="1" />
      <text x="67" y="114" fontSize="8" fill="#ffffff" textAnchor="middle" fontWeight="700">SOON</text>
      <rect x="138" y="98" width="30" height="24" fill="#1F2937" />
      <text x="153" y="114" fontSize="8" fill="#ffffff" textAnchor="middle" fontWeight="700">SOON</text>
      <path d="M46 92 L52 78 L82 78 L82 92 Z" fill="#F3E8FF" />
      <path d="M138 92 L138 78 L168 78 L174 92 Z" fill="#F3E8FF" />
      <g stroke="#3F2D6B" strokeWidth="0" />
      <circle cx="24" cy="60" r="16" fill="#1F2937" opacity="0.85" />
      <circle cx="196" cy="72" r="14" fill="#1F2937" opacity="0.85" />
      <path d="M8 128 Q20 100 24 60" stroke="#374151" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M212 132 Q200 100 196 72" stroke="#374151" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="18" cy="140" rx="20" ry="4" fill="#F3E8FF" />
      <ellipse cx="206" cy="144" rx="18" ry="4" fill="#F3E8FF" />
      <path d="M18 40 Q26 30 20 22" stroke="#D1D5DB" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M30 46 Q38 36 32 28" stroke="#D1D5DB" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
