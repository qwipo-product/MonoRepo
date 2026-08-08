import { Icon, StatusBar } from '../components/Icons';
import { VendorMoney, VendorRequirements } from '../components/VendorSummary';

export default function ViewItemsScreen({ seller, onBack, onAddMore, onUpdateQty, onItemTap }: any) {
  if (!seller) return null;

  const total = seller.items.reduce((n: number, i: any) => n + i.price * i.quantity, 0);

  return (
    <>
      <StatusBar />
      <div className="screen-body">
        <div className="top-bar">
          <button className="icon-btn" onClick={onBack}>
            <Icon.Back />
          </button>
          <div className="top-title">
            <h1>View Items</h1>
          </div>
        </div>

        <div className="vi-head">
          <div>
            <div className="vi-head-label">Buying from</div>
            <div className="vi-head-seller">{seller.name}</div>
            <div className="vi-head-label">Total Items: {seller.items.length}</div>
            <VendorRequirements seller={seller} />
          </div>
          <div className="vi-head-right">
            <div className="vi-head-total">
              Total: <span>₹{Math.round(total).toLocaleString('en-IN')}</span>
            </div>
            <VendorMoney seller={seller} />
            <button className="cart-v2-pill" onClick={onAddMore}>
              <Icon.Plus /> Add More
            </button>
          </div>
        </div>

        <div className="vi-list">
          {seller.items.map((item: any, idx: number) => (
            <div key={item.productId + idx} className="vi-item">
              <button
                className="vi-item-delete"
                onClick={() => onUpdateQty?.(seller.id, idx, 0)}
                aria-label={`Remove ${item.name}`}
              >
                <Icon.Close size={14} />
              </button>
              <button
                className="vi-item-img"
                style={{ background: item.bgColor || '#f3f4f6' }}
                onClick={() => onItemTap?.(item)}
                aria-label={`Edit ${item.name}`}
              >
                <span>{item.image}</span>
              </button>
              <div className="vi-item-info">
                <div className="vi-item-name" onClick={() => onItemTap?.(item)}>
                  {item.name}
                </div>
                <div className="vi-item-price-row">
                  <span className="vi-item-mrp">MRP ₹{item.mrp.toFixed(2)}</span>
                  <span className="vi-item-price">₹{item.price.toFixed(2)}</span>
                </div>
                <button className="vi-item-qty-badge" onClick={() => onItemTap?.(item)}>
                  {item.quantity}
                </button>
              </div>
            </div>
          ))}

          {seller.items.length === 0 && (
            <div className="reorder-empty">
              <div className="reorder-empty-emoji">🛒</div>
              <div className="reorder-empty-title">No items left</div>
              <div className="reorder-empty-sub">Everything from this seller has been removed.</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
