import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, EmptyState } from '../components/ui';
import { formatInr } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { ChevronLeft, Plus, Truck, X } from '../lib/icons';
import { itemWeight, type CartSeller } from '../data/cart';

const kg = (n: number) => `${Number(n.toFixed(2))} kg`;

export function ViewItemsScreen({
  seller,
  onBack,
  onAddMore,
  onItemTap,
}: {
  seller: CartSeller;
  onBack: () => void;
  onAddMore: () => void;
  onItemTap: (productId: string) => void;
}) {
  const [items, setItems] = useState(seller.items);
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const savings = items.reduce((s, i) => s + (i.free ? 0 : Math.max(0, (i.product.mrp - i.product.price) * i.quantity)), 0);
  const met = subtotal >= seller.mov;
  const remaining = Math.max(0, seller.mov - subtotal);
  const weight = items.reduce((s, i) => s + itemWeight(i), 0);
  const weightMet = seller.mow === 0 || weight >= seller.mow;
  const weightRemaining = Math.max(0, seller.mow - weight);
  const remove = (index: number) => setItems((list) => list.filter((_, i) => i !== index));

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3" style={shadows.sm}>
        <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-70">
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <Text className="min-w-0 flex-1 text-base font-semibold text-foreground" numberOfLines={1}>View items</Text>
      </View>

      <View className="flex-row items-start justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <View className="min-w-0 flex-1">
          <Text className="text-xs text-foreground-secondary">Buying from</Text>
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{seller.name}</Text>
          <Text className="text-xs text-foreground-secondary">{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
        </View>
        <View className="items-end gap-1.5">
          <Text className="text-sm text-foreground">Total: <Text className="font-bold">{formatInr(subtotal)}</Text></Text>
          {savings > 0 && <Text className="text-xs font-medium text-success-foreground">You save {formatInr(savings)}</Text>}
          <Button size="sm" variant="secondary" onPress={onAddMore}>
            <Plus size={14} color={colors.foreground} />
            <Text className="text-xs font-bold text-foreground">Add more</Text>
          </Button>
        </View>
      </View>

      {items.length > 0 && !met && (
        <View className="flex-row items-center gap-1.5 border-b border-border bg-warning-subtle px-4 py-2">
          <Truck size={14} color={colors.warning} />
          <Text className="text-xs text-warning-foreground">Add <Text className="font-bold">{formatInr(remaining)}</Text> to reach the {formatInr(seller.mov)} minimum order value</Text>
        </View>
      )}
      {items.length > 0 && !weightMet && (
        <View className="flex-row items-center gap-1.5 border-b border-border bg-warning-subtle px-4 py-2">
          <Truck size={14} color={colors.warning} />
          <Text className="text-xs text-warning-foreground">Add <Text className="font-bold">{kg(weightRemaining)}</Text> to reach the {kg(seller.mow)} minimum order weight</Text>
        </View>
      )}

      {items.length === 0 ? (
        <EmptyState icon="🛒" title="No items left" description="Everything from this seller has been removed." />
      ) : (
        <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 12 }}>
          {items.map((item, idx) => (
            <View key={`${item.product.id}-${idx}`} className="flex-row gap-3 rounded-lg border border-border bg-card p-3" style={shadows.sm}>
              <Pressable onPress={() => remove(idx)} className="absolute right-2 top-2 z-10 h-6 w-6 items-center justify-center rounded-full bg-muted">
                <X size={14} color={colors.foregroundSecondary} />
              </Pressable>
              <Pressable onPress={() => onItemTap(item.product.id)} className="h-16 w-16 items-center justify-center rounded-lg border border-border bg-card">
                <Text className="text-2xl">{item.product.image}</Text>
                {item.free && (
                  <View className="absolute -top-1.5 rounded-full bg-success px-1.5 py-0.5">
                    <Text className="text-[10px] font-bold text-white">FREE</Text>
                  </View>
                )}
              </Pressable>
              <View className="min-w-0 flex-1">
                <Pressable onPress={() => onItemTap(item.product.id)}>
                  <Text className="pr-6 text-sm font-medium text-foreground" numberOfLines={1}>{item.product.shortName}</Text>
                </Pressable>
                <View className="mt-1 flex-row items-center gap-2">
                  {item.free ? (
                    <Text className="text-xs font-semibold text-success-foreground">Free item</Text>
                  ) : (
                    <>
                      <Text className="text-xs text-foreground-secondary line-through">{formatInr(item.product.mrp)}</Text>
                      <Text className="text-sm font-semibold text-foreground">{formatInr(item.product.price)}</Text>
                    </>
                  )}
                </View>
                <View className="mt-1.5 flex-row items-center justify-between gap-2">
                  <View className="rounded-md bg-primary-soft px-2.5 py-0.5">
                    <Text className="text-xs font-semibold text-primary">Qty ×{item.quantity}</Text>
                  </View>
                  <Button size="sm" onPress={() => onItemTap(item.product.id)}>
                    + Add
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
