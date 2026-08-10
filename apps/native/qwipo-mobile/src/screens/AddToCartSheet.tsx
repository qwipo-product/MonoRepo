import { useState } from 'react';
import { View, Text } from 'react-native';
import { Sheet } from '../ui/Sheet';
import { Chip } from '../ui/Chip';
import { Button } from '../ui/Button';
import { QtyStepper } from '../ui/QtyStepper';
import { formatInr } from '../ui/PriceLabel';
import { packTiers, type Product } from '../data/products';

/* Selling-units sheet — pick a pack tier + number of packs, then add / continue.
   Rendered with key={product.id} so state resets per product. */
export function AddToCartSheet({
  product,
  onClose,
  onAdd,
  onContinue,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (pcs: number) => void;
  onContinue: () => void;
}) {
  const tiers = packTiers(product.caseSize);
  const [tierId, setTierId] = useState(tiers[0].id);
  const [packs, setPacks] = useState(1);

  const tier = tiers.find((t) => t.id === tierId) ?? tiers[0];
  const pcs = tier.pcs * packs;
  const total = product.price * pcs;

  return (
    <Sheet
      open
      onClose={onClose}
      title={product.shortName}
      subtitle={product.caseLabel}
      footer={
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button variant="secondary" onPress={() => { onAdd(pcs); onClose(); }}>
              Add {pcs} pc
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={() => { onAdd(pcs); onContinue(); }}>Continue</Button>
          </View>
        </View>
      }
    >
      <Text className="text-[10px] font-semibold uppercase tracking-wide text-foreground-secondary">Selling unit</Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {tiers.map((t) => (
          <Chip key={t.id} selected={t.id === tierId} onPress={() => setTierId(t.id)}>
            {t.label}
          </Chip>
        ))}
      </View>

      <View className="mt-4 flex-row items-center justify-between">
        <Text className="text-sm font-medium text-foreground">Packs</Text>
        <QtyStepper value={packs} onChange={(n) => setPacks(Math.max(1, n))} min={1} />
      </View>

      <View className="mt-4 flex-row items-center justify-between rounded-lg bg-background-subtle p-3">
        <Text className="text-sm text-foreground-secondary">{pcs} pieces</Text>
        <Text className="text-lg font-bold text-foreground">{formatInr(total)}</Text>
      </View>
    </Sheet>
  );
}
