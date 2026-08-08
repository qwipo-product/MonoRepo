import { useState, useMemo } from 'react';
import { Icon, StatusBar } from '../components/Icons';
import {
  seller,
  products,
  brands as allBrands,
  distributors,
  distributorsList,
} from '@mockups/mock-data';

// Map a product to the distributor that carries its brand. Used to surface
// the seller name on each product card when we're browsing the brand-pool
// (cumulative across sellers) listing.
//
// distributorsList has the brand-membership info; the cart and the rest of
// the app key off the canonical name in `distributors` (which differs in
// places — e.g. "Sri Sai" vs "Shri Sai"). Resolve via id so the shared
// per-seller delivery state stays in sync with the cart.
function sellerForProduct(product: any): string {
  const target = (product.brand || '').toLowerCase();
  for (const d of distributorsList) {
    if (d.brands.some((b: any) =>
      (b.short || b.name || '').toLowerCase() === target
    )) {
      const canonical = distributors.find((x: any) => x.id === d.id);
      return canonical?.name || d.name;
    }
  }
  return seller.name;
}

const DEFAULT_FILTERS = {
  sort: 'recommended',
  stock: [],         // empty = all
  brands: [],        // empty = all
  minMargin: 0,
  schemesOnly: false,
};

// Per-option delivery details surfaced on every product card. Beat day is
// free; Tomorrow carries a fee that is shown next to the margin chip when
// selected. Numbers are illustrative; production should pull from the seller.
const DELIVERY_FEES = {
  beat: 0,
  tomorrow: 24,
} as const;

const DELIVERY_LABELS = {
  beat:     { day: 'Fri (Beat day)', mov: 500  },
  tomorrow: { day: 'Tomorrow',       mov: 2500 },
} as const;

type DeliveryKind = 'beat' | 'tomorrow';

export const filtersDefault = DEFAULT_FILTERS;

export function countActiveFilters(f) {
  let n = 0;
  if (f.sort !== 'recommended') n += 1;
  if (f.stock.length) n += 1;
  if (f.brands.length) n += 1;
  if (f.minMargin > 0) n += 1;
  if (f.schemesOnly) n += 1;
  return n;
}

export default function ProductListing({
  category,
  cartItems,
  cartTotal,
  filters,
  deliveryBySeller,
  onUpdateDelivery,
  onBack,
  onOpenSheet,
  onOpenImageSheet,
  onOpenDiscounts,
  onOpenFilters,
  onGoToCart,
  onUpdateQty,
  onOpenSearch,
  onNavigateBreadcrumb,
}: any) {
  const [selectedVariant, setSelectedVariant] = useState<any>({});
  const [pageDeliveryIdx, setPageDeliveryIdx] = useState(0);

  const activeFilters = filters || DEFAULT_FILTERS;

  const stockLabel = {
    available: 'In Stock',
    limited: 'Limited',
    out: 'Out of Stock',
  };

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      if (!category) return true;
      if (category.brandNames) return category.brandNames.includes(p.brand);
      if (category.isBrand) return p.brand === category.name;
      return p.category === category.id;
    });
    // No fallback when the category has zero matches — surface an empty
    // state instead. The previous behaviour leaked the entire catalog
    // into any empty category (oils showed up under Atta, etc.).

    // Apply filter sheet selections
    if (activeFilters.brands.length) {
      list = list.filter((p) => activeFilters.brands.includes(p.brand));
    }
    if (activeFilters.stock.length) {
      list = list.filter((p) => {
        const v0 = p.variants[0];
        return activeFilters.stock.includes(v0.stock);
      });
    }
    if (activeFilters.minMargin > 0) {
      list = list.filter((p) =>
        p.variants.some((v) => v.margin >= activeFilters.minMargin)
      );
    }
    if (activeFilters.schemesOnly) {
      list = list.filter((p) => p.variants.some((v) => v.scheme));
    }

    // Sort
    const sorted = [...list];
    if (activeFilters.sort === 'price_asc') {
      sorted.sort((a, b) => a.variants[0].sellingPrice - b.variants[0].sellingPrice);
    } else if (activeFilters.sort === 'price_desc') {
      sorted.sort((a, b) => b.variants[0].sellingPrice - a.variants[0].sellingPrice);
    } else if (activeFilters.sort === 'margin_desc') {
      // Sort by the variant currently shown in the card (= first variant)
      // so the visible margin ordering matches the sort direction.
      sorted.sort((a, b) => b.variants[0].margin - a.variants[0].margin);
    }

    return sorted;
  }, [category, activeFilters]);

  const getCartQty = (productId, variantId) =>
    cartItems[`${productId}_${variantId}`] || 0;

  const activeCount = countActiveFilters(activeFilters);

  return (
    <>
      <StatusBar />
      <div className="screen-body">
        {/* Sticky cluster: top-bar + breadcrumb stay pinned while the product
            list scrolls beneath. */}
        <div className="dl-sticky-top">
          <div className="top-bar">
            <button className="icon-btn" onClick={onBack}>
              <Icon.Back />
            </button>
            <div className="top-title">
              <h1>{category?.name || 'Catalog'}</h1>
              <p>{filteredProducts.length} products</p>
            </div>
            <button className="icon-btn" onClick={onOpenSearch} aria-label="Search">
              <Icon.Search />
            </button>
            <button
              className="icon-btn filter-trigger"
              onClick={onOpenFilters}
              aria-label="Open filters"
            >
              <Icon.Sliders />
              {activeCount > 0 && <span className="filter-trigger-badge">{activeCount}</span>}
            </button>
          </div>

          {Array.isArray(category?.breadcrumb) && category.breadcrumb.length > 0 && (
            <div className="breadcrumb">
              {category.breadcrumb.map((b: any, i: number) => {
                const isLast = i === category.breadcrumb.length - 1;
                return (
                  <span key={`${b.label}-${i}`} className="inline-icon">
                    {isLast ? (
                      <span className="crumb last">{b.label}</span>
                    ) : (
                      <button
                        className="crumb"
                        onClick={() => onNavigateBreadcrumb?.(b.goTo)}
                      >
                        {b.label}
                      </button>
                    )}
                    {!isLast && <span className="crumb-sep">›</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Page-level delivery pills — shown once for the whole seller
            instead of repeating a delivery radio row on every card. */}
        {Array.isArray(category?.deliveryWindows) && category.deliveryWindows.length > 0 && (
          <div className="dl-delivery-box">
            <div className="dl-delivery-label">Delivery by</div>
            <div className="dl-delivery-row">
              {category.deliveryWindows.map((w: any, i: number) => (
                <button
                  key={i}
                  className={`dl-delivery-pill selectable ${i === pageDeliveryIdx ? 'active' : ''}`}
                  onClick={() => setPageDeliveryIdx(i)}
                >
                  <div className="dl-delivery-day">{w.day}</div>
                  <div className="dl-delivery-mov">MOV: ₹{w.mov.toLocaleString('en-IN')}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product list */}
        <div className="product-list">
          {filteredProducts.map((product) => {
            const activeVarId =
              selectedVariant[product.id] || product.variants[0].id;
            const variant = product.variants.find((v) => v.id === activeVarId);
            const cartQty = getCartQty(product.id, variant.id);
            const sellerName = sellerForProduct(product);
            // Per-product delivery eligibility; omitted = both options.
            const productOpts: readonly DeliveryKind[] =
              product.deliveryOptions && product.deliveryOptions.length > 0
                ? product.deliveryOptions
                : (['beat', 'tomorrow'] as const);
            const sellerChoice = deliveryBySeller?.[sellerName] as DeliveryKind | undefined;
            // Fall back to the first available option when the seller-level
            // pick isn't offered for this SKU (e.g. perishables on Tomorrow only).
            const sellerDelivery: DeliveryKind =
              sellerChoice && productOpts.includes(sellerChoice)
                ? sellerChoice
                : (productOpts.includes('beat') ? 'beat' : productOpts[0]);

            // Strip packaging suffix (Pouch / Jar / Tin / Box / Bottle / etc.)
            // from the variant size so the pill and the title show just the
            // quantity ("1 Ltr" / "500 ml") until the buyer asks otherwise.
            const stripPack = (s: string) =>
              s.replace(/\s+(Pouch|Jar|Tin|Box|Packet|Bottle|Sachet|Carton|Bag|Tube)s?$/i, '');
            const sizeClean = stripPack(variant.size);
            const sizeTitle = sizeClean.replace(/\b\w/g, (c) => c.toUpperCase());

            return (
              <div key={product.id} className="product-card">
                <div className="product-card-top">
                  <div className="product-info">
                    {/* Seller name sits above the product name. Hidden when
                        the listing was entered from a specific seller's
                        storefront — redundant in that single-seller context. */}
                    {!category?.fromStorefront && (
                      <div className="product-seller">{sellerName}</div>
                    )}
                    <div className="product-name">
                      {product.name} - {sizeTitle} Packet X {variant.casePcs} Nos
                    </div>
                    <div className="product-subline">
                      <span>Case: {variant.casePcs} pcs</span>
                    </div>
                  </div>
                  <button
                    className="product-img"
                    onClick={() => onOpenImageSheet(product)}
                    aria-label={`View images for ${product.name}`}
                  >
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.innerHTML = `<span style="font-size:30px">${product.image}</span>`;
                        }}
                      />
                    ) : (
                      <span className="emoji-fallback">{product.image}</span>
                    )}
                  </button>
                </div>

                {/* Variants */}
                <div className="variant-pills">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      className={`variant-pill ${v.id === activeVarId ? 'active' : ''}`}
                      onClick={() =>
                        setSelectedVariant({
                          ...selectedVariant,
                          [product.id]: v.id,
                        })
                      }
                    >
                      {stripPack(v.size)}
                    </button>
                  ))}
                </div>

                {/* Pricing — margin chip + delivery note stacked on the left,
                    MRP + price stacked on the right. Free Delivery sits here
                    (and would surface a delivery fee in the future) so the
                    card footer can stay tight to the radio row. */}
                <div className="product-price-row">
                  <div className="margin-col">
                    <div className="margin-badge">{variant.margin}% Margin</div>
                    {!category?.deliveryWindows && (
                      <div className="product-delivery-fee-inline">
                        <Icon.Truck />
                        {DELIVERY_FEES[sellerDelivery] === 0
                          ? 'Free Delivery'
                          : `+ ₹${DELIVERY_FEES[sellerDelivery]} Delivery`}
                      </div>
                    )}
                  </div>
                  <div className="price-block">
                    <div className="price-mrp-row">
                      MRP <span className="price-mrp">₹ {variant.mrp}</span>
                    </div>
                    <div className="price-main">
                      <span className="price-current">
                        ₹ {variant.sellingPrice}
                      </span>
                      <span className="price-unit">/pc</span>
                    </div>
                  </div>
                </div>

                {/* Actions — compact Discounts + Add */}
                <div className="product-actions">
                  <button
                    className="discounts-btn-filled"
                    onClick={() => onOpenDiscounts(product, variant)}
                  >
                    Discounts <Icon.ChevronDown />
                  </button>

                  {cartQty > 0 ? (
                    <div className="qty-control compact">
                      <button
                        className="qty-btn"
                        onClick={() => onUpdateQty(product, variant, cartQty - 1)}
                      >
                        <Icon.Minus />
                      </button>
                      <div className="qty-value">{cartQty}</div>
                      <button
                        className="qty-btn"
                        onClick={() => onUpdateQty(product, variant, cartQty + 1)}
                      >
                        <Icon.Plus />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="add-btn compact"
                      onClick={() => onOpenSheet(product, variant)}
                      disabled={variant.stock === 'out'}
                    >
                      <Icon.Plus /> Add
                    </button>
                  )}
                </div>

                {cartQty > 0 && (
                  <div className="product-line-total">
                    ₹{(variant.sellingPrice * cartQty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                )}

                {/* Delivery options — radio selection per seller. Friday
                    (beat day) is the default and leads; switching here mirrors
                    to every other product from the same seller and to the
                    cart. Delivery fee is shown once at the bottom — always
                    free today; placeholder for the future when a fee may
                    apply. Hidden when a page-level delivery box (single
                    seller context) already covers this. */}
                {!category?.deliveryWindows && (
                  <div
                    className="product-delivery"
                    role="radiogroup"
                    aria-label="Delivery option"
                  >
                    {productOpts.map((kind) => {
                      const opt = DELIVERY_LABELS[kind];
                      const active = sellerDelivery === kind;
                      return (
                        <button
                          key={kind}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          className={`product-delivery-option ${active ? 'active' : ''}`}
                          onClick={() => onUpdateDelivery?.(sellerName, kind)}
                        >
                          <span className="product-delivery-radio" aria-hidden="true" />
                          <span className="product-delivery-text">
                            <span className="product-delivery-day">{opt.day}</span>
                            <span className="product-delivery-meta">
                              MOV: <strong>₹{opt.mov.toLocaleString('en-IN')}</strong>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="reorder-empty">
              <div className="reorder-empty-emoji">🔍</div>
              <div className="reorder-empty-title">No matches</div>
              <div className="reorder-empty-sub">
                Try removing some filters to see more products.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky cart strip */}
      {cartTotal > 0 && (
        <div className="cart-strip">
          <div className="cart-strip-info">
            <div className="cart-strip-label">Total Cart Value:</div>
            <div className="cart-strip-value">₹{cartTotal.toLocaleString('en-IN')}</div>
          </div>
          <button className="cart-strip-btn" onClick={onGoToCart}>
            <Icon.Cart />
            Cart
          </button>
        </div>
      )}
    </>
  );
}

// Re-export brands for FiltersSheet to use
export const availableBrands = allBrands;
