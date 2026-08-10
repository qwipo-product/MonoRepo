import { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { Header } from '../components/Header';
import { ProductCard } from '../ui/ProductCard';
import { Button } from '../ui/Button';
import { formatInr } from '../ui/PriceLabel';
import { PRODUCTS } from '../data/products';

export function ProductListScreen({
  qty,
  onQty,
  onOpenSheet,
  onBack,
  onGoToCart,
  cartCount,
  cartTotal,
}: {
  qty: Record<string, number>;
  onQty: (id: string, n: number) => void;
  onOpenSheet: (id: string) => void;
  onBack: () => void;
  onGoToCart: () => void;
  cartCount: number;
  cartTotal: number;
}) {
  const [variant, setVariant] = useState<Record<string, string>>({});
  return (
    <View className="flex-1 bg-background-subtle">
      <Header
        title="Product List"
        subtitle={`${PRODUCTS.length} products`}
        onBack={onBack}
        right={
          <View className="flex-row gap-2">
            <Pressable className="h-9 w-9 items-center justify-center rounded-md bg-muted">
              <Search size={18} color="#1f2024" />
            </Pressable>
            <Pressable className="h-9 w-9 items-center justify-center rounded-md bg-muted">
              <SlidersHorizontal size={18} color="#1f2024" />
            </Pressable>
          </View>
        }
      />
      <ScrollView contentContainerClassName="gap-3 p-3">
        {PRODUCTS.map((p) => (
          <ProductCard
            key={p.id}
            name={p.name}
            caseLabel={p.caseLabel}
            image={p.image}
            variants={p.variants}
            selectedVariant={variant[p.id] ?? p.variants[0].id}
            onSelectVariant={(id) => setVariant((v) => ({ ...v, [p.id]: id }))}
            seller={p.seller}
            source={p.source}
            delivery={p.delivery}
            margin={p.margin}
            price={p.price}
            mrp={p.mrp}
            qty={qty[p.id] ?? 0}
            onQty={(n) => onQty(p.id, n)}
            onAdd={() => onOpenSheet(p.id)}
          />
        ))}
      </ScrollView>

      {cartCount > 0 ? (
        <View className="flex-row items-center justify-between border-t border-border bg-card px-4 py-3">
          <View>
            <Text className="text-[10px] uppercase tracking-wide text-foreground-secondary">{cartCount} items</Text>
            <Text className="text-lg font-bold text-foreground">{formatInr(cartTotal)}</Text>
          </View>
          <View className="w-40">
            <Button onPress={onGoToCart}>Go to cart</Button>
          </View>
        </View>
      ) : null}
    </View>
  );
}
