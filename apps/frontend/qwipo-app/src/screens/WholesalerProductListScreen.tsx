import { useState, useMemo } from 'react';
import { Search, Truck, Package } from 'lucide-react';
import { useAvailable } from '../data/availability';
import StatusBar from '../components/StatusBar';
import ScreenHeader from '../components/ScreenHeader';
import ShopProductCard from '../components/ShopProductCard';
import CartStrip from '../components/CartStrip';

/* Wholesaler products — each product shows its ACTUAL owning wholesaler
   (Qwipo / JIT Vendor / VFF / …). Seller association comes straight from the
   product's sellerId, so a distributor's product can never surface here under a
   wrong seller. */
export default function WholesalerProductListScreen({ category, cartItems = {}, cartTotal = 0, onBack, onOpenSheet, onOpenImageSheet, onOpenDiscounts, onGoToCart, onOpenSearch }: any) {
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});
  const cat = category || { name: 'Cooking Oils & Ghee' };
  const { products: availableProducts, sellers } = useAvailable();
  const sellerById = useMemo(() => Object.fromEntries(sellers.map((s: any) => [s.id, s])), [sellers]);
  const list = useMemo(() => availableProducts.filter((p: any) => p.sellerType === 'wholesaler').slice(0, 10), [availableProducts]);
  const getQty = (pid: string, vid: string) => cartItems[`${pid}_${vid}`] || 0;

  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader
          title={cat.name}
          subtitle={`${list.length} products`}
          onBack={onBack}
          right={
            <button onClick={onOpenSearch} aria-label="Search" className="grid h-10 w-10 place-items-center rounded-lg bg-muted transition-colors hover:bg-muted/70 active:scale-95">
              <Search className="h-5 w-5" />
            </button>
          }
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {list.map((product: any) => {
          const activeVarId = selectedVariant[product.id] || product.variants[0].id;
          const variant = product.variants.find((v: any) => v.id === activeVarId);
          const seller = sellerById[product.sellerId];
          const deliveryDay = seller?.deliveryWindows?.[0]?.day || 'Tomorrow';
          const qty = getQty(product.id, variant.id);
          // Real owning seller — the only seller this product is sold by.
          const sellerOpts = [{ id: product.sellerId, name: product.sellerName, price: variant.sellingPrice }];

          return (
            <ShopProductCard
              key={product.id}
              product={product}
              variant={variant}
              activeVarId={activeVarId}
              onSelectVariant={(vid) => setSelectedVariant({ ...selectedVariant, [product.id]: vid })}
              qty={qty}
              onAdd={() => onOpenSheet?.(product, variant, sellerOpts)}
              onUpdateQty={() => onOpenSheet?.(product, variant, sellerOpts)}
              onImage={() => onOpenImageSheet?.(product)}
              onDiscounts={() => onOpenDiscounts?.(product, variant)}
              middle={
                <div className="mt-2 flex items-center justify-between rounded-lg border border-border bg-gray-50 p-2">
                  <div className="min-w-0">
                    <div className="text-[11px] text-muted-foreground">Sold by</div>
                    <div className="truncate text-sm font-medium">{product.sellerName}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground"><Package className="h-3 w-3" /> Fee: ₹1/kg</div>
                </div>
              }
              footer={
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" /> Delivery by {deliveryDay}
                </div>
              }
            />
          );
        })}

        {list.length === 0 && (
          <div className="pt-16 text-center">
            <div className="text-4xl">🛒</div>
            <div className="mt-2 text-base font-semibold">No wholesaler products here</div>
            <div className="mt-1 text-sm text-muted-foreground">Try a different delivery location or category.</div>
          </div>
        )}
      </div>

      <CartStrip total={cartTotal} onGoToCart={onGoToCart} />
    </div>
  );
}
