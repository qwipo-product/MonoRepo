import { useState } from 'react';
import { Text, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Button, Chip } from '../components/ui';
import { PackTierRow } from '../components/PackTierRow';
import { formatInr } from '../lib/format';
import { colors } from '../lib/theme';
import { ShoppingCart } from '../lib/icons';
import { packTiers, type Product } from '../data/products';

/* Distributor selling-units sheet: product header + variant pills, MRP/SP/Margin
   bar, one row per pack tier with its own Add, and a total-cart footer. */
export function AddToCartSheet({
  product,
  cartTotal,
  onAdd,
  onContinue,
  onClose,
}: {
  product: Product | null;
  cartTotal: number;
  onAdd: (pcs: number) => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  const [variant, setVariant] = useState('');
  if (!product) return <Sheet open={false} onClose={onClose} />;
  const tiers = packTiers(product.caseSize);
  const activeVariant = variant || product.variants[0].id;

  return (
    <Sheet
      open={!!product}
      onClose={onClose}
      icon={<ShoppingCart size={18} color={colors.primary} />}
      title="Add to Cart"
      subtitle="Please select the quantity to add to your cart"
      footer={
        <View className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-[10px] font-medium uppercase tracking-wide text-foreground-secondary">Total cart value</Text>
            <Text className="text-lg font-bold text-foreground">{formatInr(cartTotal)}</Text>
          </View>
          <Button className="shrink-0 px-8" onPress={onContinue}>
            Continue
          </Button>
        </View>
      }
    >
      <View className="flex-row items-center gap-3">
        <View className="h-16 w-16 items-center justify-center rounded-lg bg-card" style={{ borderWidth: 2, borderColor: 'rgba(217,119,6,0.7)' }}>
          <Text className="text-2xl">{product.image}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-foreground">{product.shortName}</Text>
          <View className="mt-1.5 flex-row flex-wrap gap-2">
            {product.variants.map((v) => (
              <Chip key={v.id} selected={v.id === activeVariant} onPress={() => setVariant(v.id)} className="px-2.5 py-1">
                {v.label}
              </Chip>
            ))}
          </View>
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-5 rounded-lg bg-muted p-3">
        <View>
          <Text className="text-[10px] font-medium uppercase tracking-wide text-foreground-secondary">MRP</Text>
          <Text className="text-sm font-medium text-foreground-secondary line-through">{formatInr(product.mrp)}</Text>
        </View>
        <View>
          <Text className="text-[10px] font-medium uppercase tracking-wide text-foreground-secondary">SP</Text>
          <Text className="text-sm font-semibold text-foreground">{formatInr(product.price)}</Text>
        </View>
        <Text className="ml-auto text-sm font-semibold text-success-foreground">{product.margin}</Text>
      </View>

      <View className="mt-4 gap-2.5">
        {tiers.map((t) => (
          <PackTierRow key={t.id} label={t.label} pcs={t.pcs} unitPrice={product.price} onDelta={onAdd} />
        ))}
      </View>
    </Sheet>
  );
}
