import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Input, ScreenHeader } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { cn } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { ChevronRight, Plus, MapPin, Truck } from '../lib/icons';
import { ADDRESSES, type Address } from '../data/addresses';

export function SavedAddressesScreen({
  onBack,
  selectedId,
  onSelect,
}: {
  onBack: () => void;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>(ADDRESSES);
  const [adding, setAdding] = useState(false);

  const addAddress = (a: Address) => {
    setAddresses((list) => [a, ...list]);
    onSelect(a.id);
    setAdding(false);
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Saved addresses" subtitle={`${addresses.length} delivery ${addresses.length === 1 ? 'location' : 'locations'}`} onBack={onBack} />

      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Pressable onPress={() => setAdding(true)} className="flex-row items-center gap-3 rounded-lg border border-dashed border-primary bg-primary-soft px-4 py-3">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-primary">
            <Plus size={18} color={colors.primaryForeground} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-semibold text-foreground">Add new address</Text>
            <Text className="text-xs text-foreground-secondary">Save a new delivery location</Text>
          </View>
          <ChevronRight size={18} color={colors.foregroundSecondary} />
        </Pressable>

        {addresses.map((a) => {
          const selected = a.id === selectedId;
          return (
            <View key={a.id} className={cn('rounded-lg border bg-card', selected ? 'border-primary' : 'border-border')} style={shadows.sm}>
              <View className="flex-row items-start gap-3 p-4">
                <View className="h-9 w-9 items-center justify-center rounded-md bg-muted">
                  <Text className="text-lg">{a.emoji}</Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-foreground">{a.title}</Text>
                  <Text className="mt-0.5 text-xs text-foreground-secondary">{a.locality}</Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between border-t border-border px-4 py-2.5">
                <View className="flex-row items-center gap-1.5">
                  <MapPin size={14} color={colors.foregroundSecondary} />
                  <Text className="text-xs text-foreground-secondary">{a.pincode}</Text>
                </View>
                {selected ? (
                  <View className="flex-row items-center gap-1.5 rounded-full bg-success-subtle px-2.5 py-1">
                    <Truck size={14} color={colors.successForeground} />
                    <Text className="text-xs font-medium text-success-foreground">Delivering here</Text>
                  </View>
                ) : (
                  <Pressable onPress={() => onSelect(a.id)}>
                    <Text className="text-sm font-medium text-primary">Deliver here</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <AddAddressSheet open={adding} onClose={() => setAdding(false)} onSave={addAddress} />
    </View>
  );
}

function AddAddressSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (a: Address) => void }) {
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const touched = [line1, line2, city, state, pincode].some((v) => v.trim() !== '');

  const save = () => {
    const locality = [line2.trim(), city.trim(), state.trim()].filter(Boolean).join(', ');
    onSave({ id: `addr-${line1.trim().toLowerCase().replace(/\s+/g, '-')}-${pincode.trim()}`, emoji: '📍', title: line1.trim(), locality, pincode: pincode.trim() });
    setLine1(''); setLine2(''); setCity(''); setState(''); setPincode('');
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add new address" footer={<Button fullWidth disabled={!touched} onPress={save}>Save address</Button>}>
      <View className="gap-3">
        <Input placeholder="Address line 1" value={line1} onChangeText={setLine1} />
        <Input placeholder="Address line 2 (optional)" value={line2} onChangeText={setLine2} />
        <View className="flex-row gap-3">
          <View className="flex-1"><Input placeholder="City" value={city} onChangeText={setCity} /></View>
          <View className="flex-1"><Input placeholder="State" value={state} onChangeText={setState} /></View>
        </View>
        <Input placeholder="Pincode" keyboardType="number-pad" maxLength={6} value={pincode} onChangeText={(t) => setPincode(t.replace(/\D/g, ''))} />
      </View>
    </Sheet>
  );
}
