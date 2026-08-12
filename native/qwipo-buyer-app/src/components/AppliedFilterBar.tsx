import { Pressable, ScrollView, Text, View } from 'react-native';
import { X } from '../lib/icons';
import { colors } from '../lib/theme';
import { APPLIED_LABEL, type AppliedFilter } from '../data/filters';

/* Removable chip row shown when a product list was opened from a
   category / brand / distributor selection. */
export function AppliedFilterBar({ applied, onRemove }: { applied: AppliedFilter[]; onRemove: (index: number) => void }) {
  if (applied.length === 0) return null;
  return (
    <View className="border-b border-border bg-card">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}>
        <Text className="text-xs text-foreground-secondary">Filtered by</Text>
        {applied.map((a, i) => (
          <Pressable
            key={`${a.type}-${a.value}`}
            onPress={() => onRemove(i)}
            className="flex-row items-center gap-1 rounded-full border border-primary bg-primary-soft py-1 pl-2.5 pr-2"
          >
            <Text className="text-xs font-medium text-primary/70">{APPLIED_LABEL[a.type]}:</Text>
            <Text className="text-xs font-medium text-primary">{a.value}</Text>
            <X size={14} color={colors.primary} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
