import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, QtyStepper } from './ui';
import { formatInr } from '../lib/format';

/* One pack-tier row inside a selling-units sheet. "+ Add" swaps to a stepper;
   each change reports the piece delta to the cart via onDelta. */
export function PackTierRow({
  label,
  pcs,
  unitPrice,
  onDelta,
}: {
  label: string;
  pcs: number;
  unitPrice: number;
  onDelta: (deltaPcs: number) => void;
}) {
  const [packs, setPacks] = useState(0);
  const set = (next: number) => {
    onDelta((next - packs) * pcs);
    setPacks(next);
  };
  return (
    <View className="flex-row items-center gap-3 rounded-lg border border-border p-3">
      <View className="h-9 w-9 items-center justify-center rounded-md bg-muted">
        <Text className="text-base">📦</Text>
      </View>
      <View className="min-w-0">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        <Text className="text-xs text-foreground-secondary">
          {pcs} {pcs === 1 ? 'Pc' : 'Pcs'}
          {packs > 0 && <Text className="font-medium text-foreground"> · {packs * pcs} pcs</Text>}
        </Text>
      </View>
      <View className="ml-auto items-end">
        <Text className="text-xs text-foreground-secondary">{formatInr(unitPrice)}</Text>
        <Text className="text-sm font-bold text-foreground">{formatInr(unitPrice * pcs)}</Text>
      </View>
      <View className="w-28">
        {packs > 0 ? (
          <QtyStepper value={packs} onChange={set} min={0} tone="soft" />
        ) : (
          <Button size="sm" className="w-full" onPress={() => set(1)}>
            + Add
          </Button>
        )}
      </View>
    </View>
  );
}
