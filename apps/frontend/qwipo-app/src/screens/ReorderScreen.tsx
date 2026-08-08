import { useState } from 'react';
import { Search, Truck, Clock } from 'lucide-react';
import { reorderHistory, products } from '../data';
import ScreenHeader from '../components/ScreenHeader';
import ToggleTabs from '../components/ToggleTabs';
import ShopProductCard from '../components/ShopProductCard';
import CartStrip from '../components/CartStrip';

const SELLERS = [{ id: 'seller1', name: 'Seller 1' }, { id: 'seller2', name: 'Seller 2' }];

// Deterministic per-SKU seller prices so numbers stay stable across renders.
function pricesForProduct(productId: string, basePrice: number) {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) hash = (hash * 31 + productId.charCodeAt(i)) >>> 0;
  return SELLERS.map((s, i) => {
    const offset = ((hash >> (i * 3)) & 0xf) - 7;
    return { seller: s, price: Math.max(Math.round(basePrice + offset), 1) };
  });
}

export default function ReorderScreen({ cartItems = {}, cartTotal = 0, onOpenSheet, onUpdateQty, onOpenImageSheet, onOpenDiscounts, onGoToCart }: any) {
  const [tab, setTab] = useState('wholesaler');
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});
  const [selectedSeller, setSelectedSeller] = useState<Record<string, string>>({});
  const visible = (reorderHistory as any[]).filter((h) => h.sellerType === tab);
  const getQty = (pid: string, vid: string) => cartItems[`${pid}_${vid}`] || 0;

  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card pb-3 shadow-sm">
        <ScreenHeader
          title="Reorder"
          subtitle={tab === 'wholesaler' ? 'Wholesalers' : 'Distributors'}
          right={
            <button aria-label="Search" className="grid h-10 w-10 place-items-center rounded-lg bg-muted">
              <Search className="h-5 w-5" />
            </button>
          }
        />
        <ToggleTabs
          tabs={[{ key: 'wholesaler', label: 'Wholesalers' }, { key: 'distributor', label: 'Distributors' }]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'distributor' ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <Clock className="h-16 w-16 text-muted-foreground" />
          <div className="mt-4 text-base font-semibold">Reorder from distributors is coming soon</div>
          <div className="mt-1 text-sm text-muted-foreground">Please come back later.</div>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {visible.map((h) => {
            const product = (products as any[]).find((p) => p.id === h.productId);
            if (!product) return null;
            const activeVarId = selectedVariant[product.id] || h.variantId || product.variants[0].id;
            const variant = product.variants.find((v: any) => v.id === activeVarId) || product.variants[0];
            const prices = pricesForProduct(product.id, variant.sellingPrice);
            const activeSellerId = selectedSeller[product.id] || prices[0].seller.id;
            const activePrice = prices.find((p) => p.seller.id === activeSellerId)!;
            const qty = getQty(product.id, variant.id);

            return (
              <ShopProductCard
                key={product.id + variant.id}
                product={product}
                variant={variant}
                activeVarId={activeVarId}
                onSelectVariant={(vid) => setSelectedVariant({ ...selectedVariant, [product.id]: vid })}
                priceOverride={activePrice.price}
                qty={qty}
                onAdd={() => onOpenSheet?.(product, variant, activePrice.price)}
                onUpdateQty={(n) => onUpdateQty(product, variant, n, activePrice.price)}
                onImage={() => onOpenImageSheet?.(product)}
                onDiscounts={() => onOpenDiscounts?.(product, variant)}
                middle={
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {prices.map((pr) => {
                      const on = pr.seller.id === activeSellerId;
                      return (
                        <button
                          key={pr.seller.id}
                          onClick={() => setSelectedSeller({ ...selectedSeller, [product.id]: pr.seller.id })}
                          className={`rounded-lg border p-2 text-left ${on ? 'border-primary bg-primary/5' : 'border-border'}`}
                        >
                          <div className="text-sm font-semibold">₹{pr.price.toLocaleString('en-IN')}</div>
                          <div className="text-xs text-muted-foreground">{pr.seller.name}</div>
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-700"><Truck className="h-3 w-3" /> Free Delivery</div>
                        </button>
                      );
                    })}
                  </div>
                }
                footer={<div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Truck className="h-3.5 w-3.5" /> Delivery by Tomorrow</div>}
              />
            );
          })}

          {visible.length === 0 && (
            <div className="pt-16 text-center">
              <div className="text-4xl">📋</div>
              <div className="mt-2 text-base font-semibold">No previous orders</div>
              <div className="mt-1 text-sm text-muted-foreground">Items you've previously ordered from wholesalers will appear here.</div>
            </div>
          )}
        </div>
      )}

      {tab === 'wholesaler' && <CartStrip total={cartTotal} onGoToCart={onGoToCart} />}
    </div>
  );
}
