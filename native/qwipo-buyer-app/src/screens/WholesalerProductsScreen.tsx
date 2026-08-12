import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Badge, Button, Card, Chip, EmptyState, PriceLabel, QtyStepper } from '../components/ui';
import { VendorPicker } from '../components/VendorPicker';
import { AppliedFilterBar } from '../components/AppliedFilterBar';
import { FiltersSheet } from '../sheets/FiltersSheet';
import { DiscountsSheet } from '../sheets/DiscountsSheet';
import { WholesalerUnitsSheet } from '../sheets/WholesalerUnitsSheet';
import { WHOLESALER_PRODUCTS, cheapestVendorId, type WholesalerProduct } from '../data/wholesaler';
import { DEFAULT_FILTERS, applyFilters, countActiveFilters, type Filters, type AppliedFilter } from '../data/filters';
import { formatInr } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { ChevronLeft, Search, SlidersHorizontal } from '../lib/icons';

const minPrice = (p: WholesalerProduct) => Math.min(...p.vendors.map((v) => v.price));
const brandOf = (name: string) => name.split(' ')[0];
const BRAND_OPTIONS = [...new Set(WHOLESALER_PRODUCTS.map((p) => brandOf(p.name)))];

const matchesApplied = (p: WholesalerProduct, a: AppliedFilter) =>
  a.type === 'category'
    ? p.category === a.value
    : a.type === 'brand'
      ? p.brand.toLowerCase() === a.value.toLowerCase() || p.name.toLowerCase().includes(a.value.toLowerCase())
      : p.vendors.some((v) => v.name === a.value);

export function WholesalerProductsScreen({
  applied: appliedProp = [],
  onBack,
  onSearch,
  onGoToCart,
}: {
  applied?: AppliedFilter[];
  onBack: () => void;
  onSearch?: () => void;
  onGoToCart?: () => void;
}) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [vendorSel, setVendorSel] = useState<Record<string, string>>({});
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [discountsOpen, setDiscountsOpen] = useState(false);
  const [applied, setApplied] = useState<AppliedFilter[]>(appliedProp);
  useEffect(() => setApplied(appliedProp), [appliedProp]);

  const base = applied.length ? WHOLESALER_PRODUCTS.filter((p) => applied.every((a) => matchesApplied(p, a))) : WHOLESALER_PRODUCTS;
  const products = applyFilters(base, filters, { id: (p) => p.id, brand: (p) => brandOf(p.name), price: minPrice });
  const activeFilters = countActiveFilters(filters);

  const vendorFor = (p: WholesalerProduct) => {
    const id = vendorSel[p.id] ?? cheapestVendorId(p);
    return p.vendors.find((v) => v.id === id) ?? p.vendors[0];
  };

  const cartCount = Object.values(qty).reduce((n, x) => n + x, 0);
  const cartTotal = WHOLESALER_PRODUCTS.reduce((s, p) => s + vendorFor(p).price * (qty[p.id] ?? 0), 0);
  const sheetProduct = useMemo(() => (sheetId ? WHOLESALER_PRODUCTS.find((p) => p.id === sheetId) ?? null : null), [sheetId]);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3" style={shadows.sm}>
        <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-70">
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-foreground">Product List</Text>
          <Text className="text-xs text-foreground-secondary">{products.length} products · multiple vendors</Text>
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

      {products.length === 0 ? (
        <EmptyState icon="🔍" title="No products here" description="No vendors match this selection yet." />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          className="flex-1 bg-background-subtle"
          contentContainerStyle={{ padding: 12, gap: 12 }}
          renderItem={({ item: p }) => (
            <VendorProductCard
              product={p}
              vendorId={vendorSel[p.id] ?? cheapestVendorId(p)}
              onVendor={(vid) => setVendorSel((s) => ({ ...s, [p.id]: vid }))}
              qty={qty[p.id] ?? 0}
              onQty={(n) => setQty((s) => ({ ...s, [p.id]: Math.max(0, n) }))}
              onAdd={() => setSheetId(p.id)}
              onDiscounts={() => setDiscountsOpen(true)}
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
          <Button className="shrink-0 px-8" onPress={onGoToCart}>
            Go to cart
          </Button>
        </View>
      )}

      <WholesalerUnitsSheet
        product={sheetProduct}
        vendor={sheetProduct ? vendorFor(sheetProduct) : null}
        cartTotal={cartTotal}
        onAdd={(pcs) => sheetId && setQty((s) => ({ ...s, [sheetId]: (s[sheetId] ?? 0) + pcs }))}
        onContinue={() => setSheetId(null)}
        onClose={() => setSheetId(null)}
      />
      <FiltersSheet open={filterOpen} value={filters} brands={BRAND_OPTIONS} onApply={setFilters} onClose={() => setFilterOpen(false)} />
      <DiscountsSheet open={discountsOpen} onClose={() => setDiscountsOpen(false)} />
    </View>
  );
}

function VendorProductCard({
  product,
  vendorId,
  onVendor,
  qty,
  onQty,
  onAdd,
  onDiscounts,
}: {
  product: WholesalerProduct;
  vendorId: string;
  onVendor: (id: string) => void;
  qty: number;
  onQty: (n: number) => void;
  onAdd: () => void;
  onDiscounts: () => void;
}) {
  const [variant, setVariant] = useState(product.variants[0].id);
  const cheapest = cheapestVendorId(product);
  const selected = product.vendors.find((v) => v.id === vendorId) ?? product.vendors[0];

  return (
    <Card className="p-3">
      <View className="flex-row gap-3">
        <Pressable onPress={onAdd} className="h-16 w-16 items-center justify-center rounded-lg bg-muted active:opacity-80">
          <Text className="text-2xl">{product.image}</Text>
        </Pressable>
        <View className="min-w-0 flex-1">
          <Pressable onPress={onAdd}>
            <Text className="text-sm font-semibold text-foreground">{product.name}</Text>
            <Text className="text-xs text-foreground-secondary">{product.caseLabel}</Text>
          </Pressable>
          <View className="mt-1.5 flex-row flex-wrap gap-1.5">
            {product.variants.map((v) => (
              <Chip key={v.id} selected={v.id === variant} onPress={() => setVariant(v.id)} className="px-2.5 py-1">
                {v.label}
              </Chip>
            ))}
          </View>
        </View>
      </View>

      <View className="mt-3">
        <VendorPicker vendors={product.vendors} value={vendorId} onChange={onVendor} cheapestId={cheapest} />
      </View>

      <View className="mt-3 flex-row items-end justify-between gap-3">
        <View className="gap-1">
          <Badge variant="success">{selected.margin}</Badge>
          <Text className="text-sm text-success-foreground">{selected.delivery}</Text>
        </View>
        <PriceLabel price={selected.price} mrp={selected.mrp} suffix="/pc" size="lg" />
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        <Button variant="soft" className="flex-1" onPress={onDiscounts}>
          Discounts ⌄
        </Button>
        <View className="w-28">
          {qty > 0 ? (
            <QtyStepper value={qty} onChange={onQty} tone="soft" />
          ) : (
            <Button className="w-full" onPress={onAdd}>
              + Add
            </Button>
          )}
        </View>
      </View>

      {qty > 0 && (
        <View className="mt-3 flex-row items-center justify-between border-t border-border pt-2.5">
          <Text className="text-[10px] font-medium uppercase tracking-wide text-foreground-secondary">Total ({qty} pcs)</Text>
          <Text className="text-base font-bold text-foreground">{formatInr(selected.price * qty)}</Text>
        </View>
      )}
    </Card>
  );
}
