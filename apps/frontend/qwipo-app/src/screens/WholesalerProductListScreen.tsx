import { useState, useMemo } from 'react';
import { Search, Truck } from 'lucide-react';
import { products } from '../data';
import StatusBar from '../components/StatusBar';
import ScreenHeader from '../components/ScreenHeader';
import ShopProductCard from '../components/ShopProductCard';
import CartStrip from '../components/CartStrip';

const WHOLESALERS = [
  { id: 'wh1', name: 'Omkar Enterprises', delivery: 'Today by 8 PM' },
  { id: 'wh2', name: 'Sri Sai Krishna Traders', delivery: 'Tomorrow by 11 AM' },
  { id: 'wh3', name: 'KVS Wholesale Mart', delivery: 'Tomorrow by 4 PM' },
  { id: 'wh4', name: 'Ramesh Trading Co.', delivery: 'Today by 9 PM' },
];

function pricesForProduct(productId: string, basePrice: number) {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) hash = (hash * 31 + productId.charCodeAt(i)) >>> 0;
  return WHOLESALERS.map((w, i) => {
    const offset = ((hash >> (i * 3)) & 0xf) - 7;
    return { seller: w, price: Math.max(Math.round(basePrice + offset), 1) };
  });
}

export default function WholesalerProductListScreen({ category, cartItems = {}, cartTotal = 0, onBack, onOpenSheet, onOpenImageSheet, onOpenDiscounts, onGoToCart, onOpenSearch }: any) {
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});
  const [selectedSeller, setSelectedSeller] = useState<Record<string, string>>({});
  const cat = category || { name: 'Cooking Oils & Ghee' };
  const list = useMemo(() => (products as any[]).slice(0, 10), []);
  const getQty = (pid: string, vid: string) => cartItems[`${pid}_${vid}`] || 0;

  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader
          title={cat.name}
          subtitle={`Multi-seller · ${list.length} products`}
          onBack={onBack}
          right={
            <button onClick={onOpenSearch} aria-label="Search" className="grid h-10 w-10 place-items-center rounded-lg bg-muted transition-colors hover:bg-muted/70 active:scale-95">
              <Search className="h-5 w-5" />
            </button>
          }
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {list.map((product) => {
          const activeVarId = selectedVariant[product.id] || product.variants[0].id;
          const variant = product.variants.find((v: any) => v.id === activeVarId);
          const prices = pricesForProduct(product.id, variant.sellingPrice);
          const activeSellerId = selectedSeller[product.id] || prices[0].seller.id;
          const activePrice = prices.find((p) => p.seller.id === activeSellerId)!;
          const qty = getQty(product.id, variant.id);
          const sellerOpts = prices.slice(0, 2).map((pr) => ({ id: pr.seller.id, name: pr.seller.name, price: pr.price }));

          return (
            <ShopProductCard
              key={product.id}
              product={product}
              variant={variant}
              activeVarId={activeVarId}
              onSelectVariant={(vid) => setSelectedVariant({ ...selectedVariant, [product.id]: vid })}
              priceOverride={activePrice.price}
              qty={qty}
              onAdd={() => onOpenSheet?.(product, variant, sellerOpts)}
              onUpdateQty={() => onOpenSheet?.(product, variant, sellerOpts)}
              onImage={() => onOpenImageSheet?.(product)}
              onDiscounts={() => onOpenDiscounts?.(product, variant)}
              middle={
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {prices.slice(0, 2).map((pr) => {
                    const on = pr.seller.id === activeSellerId;
                    return (
                      <button key={pr.seller.id} onClick={() => setSelectedSeller({ ...selectedSeller, [product.id]: pr.seller.id })} className={`rounded-lg border p-2 text-left ${on ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <div className="text-sm font-semibold">₹{pr.price.toLocaleString('en-IN')}</div>
                        <div className="text-xs text-muted-foreground">{pr.seller.name}</div>
                      </button>
                    );
                  })}
                </div>
              }
              footer={
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" /> Delivery by {activePrice.seller.delivery.replace(/\s+by\s+.*$/i, '')}
                </div>
              }
            />
          );
        })}
      </div>

      <CartStrip total={cartTotal} onGoToCart={onGoToCart} />
    </div>
  );
}
