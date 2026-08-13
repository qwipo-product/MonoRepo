import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Button, EmptyState, ScreenHeader } from '../../components/ui';
import { cn } from '../../lib/format';
import { colors, shadows } from '../../lib/theme';
import { Search, MapPin, Navigation, Repeat, Store } from '../../lib/icons';
import { SWITCH_CUSTOMERS, NEARBY_RADIUS_M, type SwitchCustomer } from '../../data/salesperson';

export function SwitchCustomerScreen({ onBack, onSwitch }: { onBack: () => void; onSwitch: () => void }) {
  const [mobile, setMobile] = useState('');
  const [selected, setSelected] = useState<SwitchCustomer | null>(null);
  const [nearby, setNearby] = useState<SwitchCustomer[]>([]);

  const onMobile = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 10);
    setMobile(digits);
    setSelected(digits.length === 10 ? SWITCH_CUSTOMERS.find((c) => c.mobile === digits) ?? null : null);
  };
  const locate = () => setNearby(SWITCH_CUSTOMERS.filter((c) => c.distanceM <= NEARBY_RADIUS_M));

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Switch Customer" onBack={onBack} />
      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground">Retailer mobile</Text>
          <View className="h-11 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
            <Search size={16} color={colors.foregroundSecondary} />
            <TextInput value={mobile} onChangeText={onMobile} keyboardType="number-pad" placeholder="10-digit mobile number" placeholderTextColor={colors.foregroundSecondary} className="h-full flex-1 text-sm text-foreground" />
            <Text className="text-xs text-foreground-secondary">{mobile.length}/10</Text>
          </View>
          {mobile.length === 10 && !selected && <Text className="text-xs font-medium text-warning-foreground">No customer found for this number.</Text>}
        </View>

        <Button fullWidth variant="secondary" onPress={locate}>
          <Navigation size={16} color={colors.foreground} />
          <Text className="text-sm font-bold text-foreground">Locate retailers nearby ({NEARBY_RADIUS_M} m)</Text>
        </Button>

        {selected && <CustomerResult c={selected} selected onPick={() => setSelected(selected)} />}

        {nearby.length > 0 && !selected && (
          <View className="gap-2">
            <Text className="px-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">Nearby retailers</Text>
            {nearby.map((c) => (
              <CustomerResult key={c.id} c={c} selected={false} onPick={() => setSelected(c)} />
            ))}
          </View>
        )}

        {!selected && nearby.length === 0 && mobile.length < 10 && (
          <View className="pt-6">
            <EmptyState icon={<Store size={28} color={colors.foregroundSecondary} />} title="Find a retailer" description="Search a mobile number or locate shops nearby to switch." />
          </View>
        )}
      </ScrollView>

      {selected && (
        <View className="border-t border-border bg-card p-3" style={shadows.barTop}>
          <Button fullWidth onPress={onSwitch}>
            <Repeat size={16} color={colors.primaryForeground} />
            <Text className="text-sm font-bold text-primary-foreground" numberOfLines={1}>Switch to {selected.businessName}</Text>
          </Button>
        </View>
      )}
    </View>
  );
}

function CustomerResult({ c, selected, onPick }: { c: SwitchCustomer; selected: boolean; onPick: () => void }) {
  return (
    <Pressable onPress={onPick} className={cn('rounded-lg border bg-card p-3', selected ? 'border-primary bg-primary-soft' : 'border-border')} style={shadows.sm}>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="min-w-0 flex-1 text-sm font-semibold text-foreground" numberOfLines={1}>{c.businessName}</Text>
        <Text className="text-[11px] font-medium text-foreground-secondary">{c.distanceM} m</Text>
      </View>
      <Text className="mt-0.5 text-xs text-foreground-secondary">{c.ownerName} · {c.mobile}</Text>
      <View className="mt-1 flex-row items-start gap-1.5">
        <MapPin size={14} color={colors.foregroundSecondary} />
        <Text className="flex-1 text-xs text-foreground-secondary">{c.address}</Text>
      </View>
    </Pressable>
  );
}
