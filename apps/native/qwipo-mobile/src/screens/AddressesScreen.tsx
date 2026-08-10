import { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Header } from '../components/Header';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ADDRESSES } from '../data/account';
import { cn } from '../ui/cn';

export function AddressesScreen({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState(ADDRESSES.find((a) => a.isDefault)?.id ?? ADDRESSES[0].id);
  return (
    <View className="flex-1 bg-background-subtle">
      <Header title="Saved Addresses" onBack={onBack} />
      <ScrollView contentContainerClassName="gap-3 p-3">
        {ADDRESSES.map((a) => {
          const on = a.id === selected;
          return (
            <Pressable
              key={a.id}
              onPress={() => setSelected(a.id)}
              className={cn('rounded-lg border p-3', on ? 'border-primary bg-primary-soft' : 'border-border bg-card')}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-semibold text-foreground">{a.title}</Text>
                {a.isDefault ? <Badge variant="info">Default</Badge> : null}
                <View className="flex-1" />
                <View className={cn('h-5 w-5 items-center justify-center rounded-full border-2', on ? 'border-primary' : 'border-border')}>
                  {on ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                </View>
              </View>
              <Text className="mt-1 text-xs text-foreground-secondary">{a.line}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View className="border-t border-border bg-card px-4 py-3">
        <Button fullWidth>+ Add new address</Button>
      </View>
    </View>
  );
}
