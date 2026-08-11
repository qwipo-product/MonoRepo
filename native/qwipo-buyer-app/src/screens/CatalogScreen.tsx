import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button, EmptyState } from '../components/ui';
import { ProductCard } from '../components/ProductCard';
import { AppliedFilterBar } from '../components/AppliedFilterBar';
import { FiltersSheet } from '../sheets/FiltersSheet';
import { DiscountsSheet } from '../sheets/DiscountsSheet';
import { deliveryFooter } from '../components/DeliveryFooter';
import { PRODUCTS, type Product } from '../data/products';
import { DEFAULT_FILTERS, applyFilters, countActiveFilters, type Filters, type AppliedFilter } from '../data/filters';
import { formatInr } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { ChevronLeft, Search, SlidersHorizontal } from '../lib/icons';

const brandOf = (name: string) => name.split(' ')[0];
const BRAND_OPTIONS = [...new Set(PRODUCTS.map((p) => brandOf(p.shortName)))];

const matchesApplied = (p: Product, a: AppliedFilter) =>
  a.type === 'category'
    ? p.category === a.value
    : a.type === 'brand'
      ? p.shortName.toLowerCase().startsWith(a.value.toLowerCase())
      : p.seller === a.value;

export function CatalogScreen({
  applied: appliedProp = [],
  onBack,
  onSearch,
  qty,
  onOpenSheet,
  onSetQty,
  onGoToCart,
  cartCount,
  cartTotal,
}: {
  applied?: AppliedFilter[];
  onBack?: () => void;
  onSearch?: () => void;
  qty: Record<string, number>;
  onOpenSheet: (id: string) => void;
  onSetQty: (id: string, n: number) => void;
  onGoToCart: () => void;
  cartCount: number;
  cartTotal: number;
}) {
  const [variant, setVariant] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [discountsOpen, setDiscountsOpen] = useState(false);
  const [applied, setApplied] = useState<AppliedFilter[]>(appliedProp);
  useEffect(() => setApplied(appliedProp), [appliedProp]);

  const distProducts = PRODUCTS.filter((p) => p.source === 'distributor');
  const base = applied.length ? distProducts.filter((p) => applied.every((a) => matchesApplied(p, a))) : distProducts;
  const items = applyFilters(base, filters, { id: (p) => p.id, brand: (p) => brandOf(p.shortName), price: (p) => p.price });
  const activeFilters = countActiveFilters(filters);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3" style={shadows.sm}>
        <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-70">
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-foreground">Product List</Text>
          <Text className="text-xs text-foreground-secondary">{items.length} products</Text>
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

      <AppliedFilterBar applied={applied} onRemove={(i) => setApplied((a) => a.filter((_, idx) => idx !== i))} />

      {items.length === 0 ? (
        <EmptyState icon="🔍" title="No products here" description="New products are on the way." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          className="flex-1 bg-background-subtle"
          contentContainerStyle={{ padding: 12, gap: 12 }}
          renderItem={({ item: p }) => (
            <ProductCard
              name={p.name}
              caseLabel={p.caseLabel}
              image={p.image}
              variants={p.variants}
              selectedVariant={variant[p.id] ?? p.variants[0].id}
              onSelectVariant={(id) => setVariant((v) => ({ ...v, [p.id]: id }))}
              margin={p.margin}
              price={p.price}
              mrp={p.mrp}
              qty={qty[p.id] ?? 0}
              onQty={(n) => onSetQty(p.id, n)}
              onAdd={() => onOpenSheet(p.id)}
              onDiscounts={() => setDiscountsOpen(true)}
              subtotal={p.price * (qty[p.id] ?? 0)}
              subtotalLabel={`Total (${qty[p.id] ?? 0} pcs)`}
              footer={deliveryFooter(p.seller)}
            />
          )}
        />
      )}

      {cartCount > 0 && (
        <View className="flex-row items-center justify-between gap-3 border-t border-border bg-card px-4 py-3" style={shadows.barTop}>
          <View>
            <Text className="text-[10px] uppercase tracking-wide text-foreground-secondary">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </Text>
            <Text className="text-lg font-bold text-foreground">{formatInr(cartTotal)}</Text>
            <Text className={cartTotal >= 3000 ? 'text-xs text-success-foreground' : 'text-xs text-foreground-secondary'}>
              {cartTotal >= 3000 ? 'Free delivery' : `+ ${formatInr(30)} delivery fee`}
            </Text>
          </View>
          <Button className="px-8" onPress={onGoToCart}>
            Go to cart
          </Button>
        </View>
      )}

      <FiltersSheet open={filterOpen} value={filters} brands={BRAND_OPTIONS} onApply={setFilters} onClose={() => setFilterOpen(false)} />
      <DiscountsSheet open={discountsOpen} onClose={() => setDiscountsOpen(false)} />
    </View>
  );
}
