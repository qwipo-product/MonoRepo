import { Text, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/ui';
import { formatInr } from '../lib/format';
import { colors } from '../lib/theme';
import { ShoppingBag } from '../lib/icons';
import type { CartItem, CartSeller } from '../data/cart';

/* Order Summary · View Items — read-only line list for one seller's order. */
export function OrderItemsSheet({ open, seller, onClose }: { open: boolean; seller: CartSeller | null; onClose: () => void }) {
  if (!seller) return <Sheet open={false} onClose={onClose} />;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      icon={<ShoppingBag size={18} color={colors.primary} />}
      title={seller.name}
      subtitle={`${seller.items.length} ${seller.items.length === 1 ? 'item' : 'items'} in this order`}
      footer={
        <View className="flex-row items-center gap-3">
          <View>
            <Text className="text-[10px] font-medium uppercase tracking-wide text-foreground-secondary">Order total</Text>
            <Text className="text-lg font-bold text-foreground">{formatInr(seller.subtotal)}</Text>
          </View>
          <Button className="flex-1" onPress={onClose}>
            Close
          </Button>
        </View>
      }
    >
      <View className="gap-2.5">
        {seller.items.map((item, idx) => (
          <ItemRow key={`${item.product.id}-${idx}`} item={item} />
        ))}
      </View>
    </Sheet>
  );
}

function ItemRow({ item }: { item: CartItem }) {
  const { product, quantity, lineTotal, free } = item;
  return (
    <View className="flex-row gap-3 rounded-lg border border-border p-3">
      <View className="h-16 w-16 items-center justify-center rounded-lg border border-border bg-card">
        <Text className="text-2xl">{product.image}</Text>
        {free && (
          <View className="absolute -top-1.5 rounded-full bg-success px-1.5 py-0.5">
            <Text className="text-[10px] font-bold text-white">FREE</Text>
          </View>
        )}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{product.shortName}</Text>
        {free ? (
          <Text className="mt-1 text-xs font-semibold text-success-foreground">Free item</Text>
        ) : (
          <View className="mt-1 flex-row items-center gap-2">
            <Text className="text-xs text-foreground-secondary">MRP <Text className="line-through">{formatInr(product.mrp)}</Text></Text>
            <Text className="text-sm font-semibold text-foreground">{formatInr(product.price)}</Text>
          </View>
        )}
        <View className="mt-2 flex-row items-center justify-between border-t border-border pt-2">
          <View className="rounded-md bg-primary-soft px-2 py-0.5">
            <Text className="text-xs font-semibold text-primary">Qty ×{quantity}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[10px] uppercase tracking-wide text-foreground-secondary">Total</Text>
            <Text className="text-sm font-bold text-foreground">{formatInr(lineTotal)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
