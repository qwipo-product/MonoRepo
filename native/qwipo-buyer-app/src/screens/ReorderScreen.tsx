import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { EmptyState } from '../components/ui';
import { ProductCard } from '../components/ProductCard';
import { FiltersSheet } from '../sheets/FiltersSheet';
import { DiscountsSheet } from '../sheets/DiscountsSheet';
import { deliveryFooter } from '../components/DeliveryFooter';
import { REORDER_ITEMS } from '../data/reorder';
import { DEFAULT_FILTERS, applyFilters, countActiveFilters, type Filters } from '../data/filters';
import { colors, shadows } from '../lib/theme';
import { Search, SlidersHorizontal, RotateCcw } from '../lib/icons';

const brandOf = (name: string) => name.split(' ')[0];
const BRAND_OPTIONS = [...new Set(REORDER_ITEMS.map((r) => brandOf(r.product.shortName)))];

export function ReorderScreen({
  qty,
  onOpenSheet,
  onSetQty,
  onSearch,
}: {
  qty: Record<string, number>;
  onOpenSheet: (id: string) => void;
  onSetQty: (id: string, n: number) => void;
  onSearch?: () => void;
}) {
  const [variant, setVariant] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [discountsOpen, setDiscountsOpen] = useState(false);

  const items = applyFilters(REORDER_ITEMS, filters, {
    id: (r) => r.product.id,
    brand: (r) => brandOf(r.product.shortName),
    price: (r) => r.product.price,
  });
  const activeFilters = countActiveFilters(filters);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3" style={shadows.sm}>
        <View className="h-9 w-9 items-center justify-center rounded-md bg-primary-soft">
          <RotateCcw size={18} color={colors.primary} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-foreground">Reorder</Text>
          <Text className="text-xs text-foreground-secondary">{items.length} items you buy often</Text>
        </View>
        <Pressable onPress={onSearch} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-70">
          <Search size={18} color={colors.foreground} />
        </Pressable>
        <Pressable onPress={() => setFilterOpen(true)} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-70">
          <SlidersHorizontal size={18} color={colors.foreground} />
          {activeFilters > 0 && (
            <View className="absolute -right-1 -top-1 h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1">
              <Text className="text-[10px] font-semibold text-primary-foreground">{activeFilters}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {items.length === 0 ? (
        <EmptyState icon="📋" title="No previous orders" description="Items you've ordered before will appear here to reorder in one tap." />
      ) : (
        <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 12 }}>
          {items.map((r) => (
            <View key={r.product.id} className="gap-1.5">
              <View className="flex-row items-center justify-between px-1">
                <Text className="text-xs text-foreground-secondary">Last ordered {r.lastOrdered}</Text>
                <Text className="text-xs text-foreground-secondary">{r.timesOrdered}× before</Text>
              </View>
              <ProductCard
                name={r.product.name}
                caseLabel={r.product.caseLabel}
                image={r.product.image}
                variants={r.product.variants}
                selectedVariant={variant[r.product.id] ?? r.product.variants[0].id}
                onSelectVariant={(id) => setVariant((v) => ({ ...v, [r.product.id]: id }))}
                seller={r.product.seller}
                delivery={r.product.delivery}
                margin={r.product.margin}
                price={r.product.price}
                mrp={r.product.mrp}
                qty={qty[r.product.id] ?? 0}
                onQty={(n) => onSetQty(r.product.id, n)}
                onAdd={() => onOpenSheet(r.product.id)}
                onDiscounts={() => setDiscountsOpen(true)}
                subtotal={r.product.price * (qty[r.product.id] ?? 0)}
                subtotalLabel={`Total (${qty[r.product.id] ?? 0} pcs)`}
                footer={deliveryFooter(r.product.seller)}
              />
            </View>
          ))}
        </ScrollView>
      )}

      <FiltersSheet open={filterOpen} value={filters} brands={BRAND_OPTIONS} onApply={setFilters} onClose={() => setFilterOpen(false)} />
      <DiscountsSheet open={discountsOpen} onClose={() => setDiscountsOpen(false)} />
    </View>
  );
}
