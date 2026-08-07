import { useState, useRef, useEffect } from 'react';
import { Icon } from './Icons';
import { SheetHeader, useSheetSwipe } from './SheetBase';

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export default function ProductImageSheet({ product, onClose, onAddClick }: any) {
  const { dragHandlers, sheetStyle } = useSheetSwipe(onClose);
  const [activeIdx, setActiveIdx] = useState(0);
  const railRef = useRef(null);

  const images = product.images || [];
  const hasImages = images.length > 0;

  // Auto-scroll thumbnail rail when active index changes
  useEffect(() => {
    const el = railRef.current?.children?.[activeIdx];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeIdx]);

  const startPrice = product.variants[0]?.sellingPrice;
  const startMrp = product.variants[0]?.mrp;
  const savings = startMrp - startPrice;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet sheet-tall-92"
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <SheetHeader
          icon={<ImageIcon />}
          title={product.name}
          subtitle={`${product.brand} · ${product.variants.length} pack sizes`}
          onClose={onClose}
          dragHandlers={dragHandlers}
        />

        <div className="sheet-body pad-0">
          {/* Main image carousel */}
          <div className="pis-main">
            {hasImages ? (
              <img
                src={images[activeIdx]}
                alt={product.name}
                className="pis-main-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.dataset.fallback = '1';
                }}
              />
            ) : (
              <div className="emoji-fallback-xl">{product.image}</div>
            )}

            {/* Image counter */}
            {hasImages && images.length > 1 && (
              <div className="pis-counter">
                {activeIdx + 1} / {images.length}
              </div>
            )}

            {/* Brand chip on image */}
            <div className="pis-brand-chip">{product.brand}</div>
          </div>

          {/* Thumbnail rail */}
          {hasImages && images.length > 1 && (
            <div ref={railRef} className="pis-rail">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`pis-thumb ${activeIdx === idx ? 'active' : ''}`}
                  style={{ background: product.bgColor }}
                >
                  <img
                    src={img}
                    alt={`thumb-${idx}`}
                    className="pis-thumb-img"
                    onError={(e) => (e.currentTarget.style.opacity = '0.3')}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Product details */}
          <div className="pis-details">
            <div className="pis-meta-row">
              <span className="product-meta-pill">{product.manufacturer}</span>
              <span className="pis-hsn">
                HSN {product.hsn} · GST {product.gst}%
              </span>
            </div>

            {/* Price banner */}
            <div className="pis-price-banner">
              <div className="pis-price-col">
                <div className="pis-price-label">Starting from</div>
                <div className="pis-price-row">
                  <span className="pis-price">₹{startPrice}</span>
                  <span className="pis-mrp">₹{startMrp}</span>
                </div>
              </div>
              <div className="pis-save">Save ₹{savings}</div>
            </div>

            {/* Specs grid */}
            <div className="pis-specs">
              <SpecCell label="Manufacturer" value={product.manufacturer} />
              <SpecCell label="Country" value={product.countryOfOrigin} />
              <SpecCell label="HSN Code" value={product.hsn} />
              <SpecCell label="GST" value={`${product.gst}%`} />
              <SpecCell label="Variants" value={`${product.variants.length} sizes`} />
              <SpecCell label="Category" value={product.category.replace('-', ' ')} />
            </div>

            {/* Available pack sizes */}
            <div className="pis-packs">
              <div className="pis-packs-title">Available Pack Sizes</div>
              <div className="pis-packs-list">
                {product.variants.map((v) => (
                  <div key={v.id} className="pis-pack-row">
                    <div>
                      <span className="pis-pack-size">{v.size}</span>
                      <span className="pis-pack-case">· {v.casePack}</span>
                    </div>
                    <div className="pis-pack-right">
                      <span className="pis-pack-price">₹{v.sellingPrice}</span>
                      <span className="pis-pack-margin">{v.margin}% margin</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="sheet-footer">
          <div className="sheet-footer-info">
            <div className="sheet-footer-label">Starting at</div>
            <div className="sheet-footer-value">₹{startPrice}/pc</div>
          </div>
          <button className="sheet-continue" onClick={() => onAddClick(product)}>
            Add to cart →
          </button>
        </div>
      </div>
    </div>
  );
}

function SpecCell({ label, value }: any) {
  return (
    <div className="pis-speccell">
      <div className="pis-speccell-label">{label}</div>
      <div className="pis-speccell-value">{value}</div>
    </div>
  );
}
