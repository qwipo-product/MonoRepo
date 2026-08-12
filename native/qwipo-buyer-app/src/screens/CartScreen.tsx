import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, SegmentedControl, EmptyState } from '../components/ui';
import { formatInr } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { ChevronLeft, Plus, Truck } from '../lib/icons';
import { buildCart, type CartSeller } from '../data/cart';

const kg = (n: number) => `${Number(n.toFixed(2))} kg`;

export function CartScreen({
  onBack,
  onCheckout,
  onViewItems,
  onAddMore,
}: {
  onBack: () => void;
  onCheckout: () => void;
  onViewItems: (sellerId: string) => void;
  onAddMore: (sellerId: string) => void;
}) {
  const { sellers, grandTotal, totalItems, anyBelow } = useMemo(() => buildCart(), []);
  const deliveryFee = sellers.reduce((n, s) => n + s.deliveryFee, 0);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3" style={shadows.sm}>
        <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-70">
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-foreground">Cart Summary</Text>
          {sellers.length > 0 && (
            <Text className="text-xs text-foreground-secondary">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} · {sellers.length} {sellers.length === 1 ? 'seller' : 'sellers'}
            </Text>
          )}
        </View>
      </View>

      {sellers.length === 0 ? (
        <View className="flex-1 bg-background-subtle">
          <EmptyState icon="🛒" title="Your cart is empty" description="Add products to see them here." />
        </View>
      ) : (
        <>
          <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 12 }}>
            {sellers.map((s) => (
              <SellerCard key={s.id} seller={s} onViewItems={() => onViewItems(s.id)} onAddMore={() => onAddMore(s.id)} />
            ))}
          </ScrollView>

          <View className="border-t border-border bg-card px-4 py-3" style={shadows.barTop}>
            {anyBelow && <Text className="mb-2 text-center text-xs text-warning-foreground">Meet each seller's minimum order to check out.</Text>}
            <View className="flex-row items-center justify-between gap-3">
              <View>
                <Text className="text-[10px] uppercase tracking-wide text-foreground-secondary">Total Cart Value</Text>
                <Text className="text-lg font-bold text-foreground">{formatInr(grandTotal)}</Text>
                <Text className={deliveryFee > 0 ? 'text-xs text-foreground-secondary' : 'text-xs text-success-foreground'}>
                  {deliveryFee > 0 ? `+ ${formatInr(deliveryFee)} delivery fee` : 'Free delivery'}
                </Text>
              </View>
              <Button className="shrink-0 px-8" onPress={onCheckout}>
                Checkout
              </Button>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

function Progress({ pct, tone = 'warning' }: { pct: number; tone?: 'warning' }) {
  return (
    <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-warning-border">
      <View className="h-full rounded-full bg-warning" style={{ width: `${pct}%` }} />
    </View>
  );
}

function SellerCard({ seller, onViewItems, onAddMore }: { seller: CartSeller; onViewItems: () => void; onAddMore: () => void }) {
  const [win, setWin] = useState(seller.windows[0]);
  const shown = seller.items.slice(0, 3);
  const extra = seller.items.length - shown.length;

  return (
    <View className="rounded-lg border border-border bg-card p-3" style={shadows.sm}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-xs text-foreground-secondary">Buying from</Text>
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{seller.name}</Text>
          <Text className="text-xs text-foreground-secondary">{seller.items.length} {seller.items.length === 1 ? 'item' : 'items'}</Text>
        </View>
        <View className="items-end gap-1.5">
          <Text className="text-sm text-foreground">Total: <Text className="font-bold">{formatInr(seller.subtotal)}</Text></Text>
          {seller.savings > 0 && <Text className="text-xs font-medium text-success-foreground">You save {formatInr(seller.savings)}</Text>}
        </View>
      </View>

      {seller.status === 'below' && (
        <View className="mt-2.5 rounded-lg bg-warning-subtle p-2.5">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-xs font-semibold text-warning-foreground">Add {formatInr(seller.unlockRemaining)} to meet minimum order value</Text>
            <Text className="text-[11px] text-warning-foreground">{formatInr(seller.subtotal)} / {formatInr(seller.mov)}</Text>
          </View>
          <Progress pct={seller.progress} />
          <Text className="mt-1.5 text-[11px] text-foreground-secondary">Minimum order value for this supplier is {formatInr(seller.mov)}</Text>
        </View>
      )}

      {seller.belowWeight && (
        <View className="mt-2.5 rounded-lg bg-warning-subtle p-2.5">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-xs font-semibold text-warning-foreground">Add {kg(seller.weightRemaining)} to meet minimum order weight</Text>
            <Text className="text-[11px] text-warning-foreground">{kg(seller.weight)} / {kg(seller.mow)}</Text>
          </View>
          <Progress pct={seller.weightProgress} />
          <Text className="mt-1.5 text-[11px] text-foreground-secondary">Minimum order weight for this supplier is {kg(seller.mow)}</Text>
        </View>
      )}

      {!seller.blocked && (
        <View className="mt-2.5 flex-row">
          {seller.status === 'free' ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-success-subtle px-2.5 py-1">
              <Truck size={14} color={colors.successForeground} />
              <Text className="text-xs font-medium text-success-foreground">Free delivery</Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
              <Truck size={14} color={colors.foregroundSecondary} />
              <Text className="text-xs font-medium text-foreground-secondary">Delivery {formatInr(seller.deliveryFee)}</Text>
            </View>
          )}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, marginTop: 12 }}>
        {shown.map((item, i) => (
          <View key={`${item.product.id}-${i}`} className="w-16 items-center">
            <View className="h-16 w-16 items-center justify-center rounded-lg border border-border bg-card">
              <Text className="text-2xl">{item.product.image}</Text>
              {item.free && (
                <View className="absolute -top-1.5 rounded-full bg-success px-1.5 py-0.5">
                  <Text className="text-[10px] font-bold text-white">FREE</Text>
                </View>
              )}
            </View>
            <Text className="mt-1 text-[11px] text-foreground-secondary">×{item.quantity}</Text>
            <Text className="text-[11px] font-medium text-foreground">{formatInr(item.lineTotal)}</Text>
          </View>
        ))}
        {extra > 0 && (
          <Pressable onPress={onViewItems} className="h-16 w-16 items-center justify-center self-start rounded-lg border border-dashed border-primary bg-primary-soft">
            <Text className="text-xs font-semibold text-primary">+{extra} more</Text>
          </Pressable>
        )}
      </ScrollView>

      <View className="mt-3">
        <Text className="mb-1.5 text-xs text-foreground-secondary">Delivery by</Text>
        <SegmentedControl options={seller.windows.map((w) => ({ value: w, label: w }))} value={win} onChange={setWin} />
      </View>

      <View className="mt-3 flex-row gap-2">
        <Button className="flex-1" onPress={onViewItems}>
          View items
        </Button>
        <Button variant={seller.blocked ? 'warning' : 'secondary'} className="flex-1" onPress={onAddMore}>
          <Plus size={16} color={seller.blocked ? colors.white : colors.foreground} />
          <Text className={cn2(seller.blocked)}>Add more</Text>
        </Button>
      </View>
    </View>
  );
}

const cn2 = (blocked: boolean) => (blocked ? 'text-sm font-bold text-white' : 'text-sm font-bold text-foreground');
