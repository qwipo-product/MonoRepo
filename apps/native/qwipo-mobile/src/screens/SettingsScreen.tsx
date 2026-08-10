import { useState } from 'react';
import { ScrollView, View, Text, Pressable, Switch } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Header } from '../components/Header';
import { Card } from '../ui/Card';
import type { Navigate } from '../nav';

function ToggleRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center gap-3 px-3 py-2.5">
      <View className="flex-1">
        <Text className="text-sm font-medium text-foreground">{label}</Text>
        <Text className="text-xs text-foreground-secondary">{sub}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: '#2563eb', false: '#d1d5db' }} thumbColor="#ffffff" />
    </View>
  );
}

export function SettingsScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: Navigate }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [offers, setOffers] = useState(true);

  return (
    <View className="flex-1 bg-background-subtle">
      <Header title="Settings" onBack={onBack} />
      <ScrollView contentContainerClassName="gap-4 p-3">
        <Card className="py-1">
          <ToggleRow label="Dark mode" sub="Switch the app theme" value={dark} onChange={(v) => setColorScheme(v ? 'dark' : 'light')} />
        </Card>

        <Card className="py-1">
          <ToggleRow label="Order updates" sub="Delivery and packing alerts" value={orderUpdates} onChange={setOrderUpdates} />
          <View className="mx-3 border-t border-border" />
          <ToggleRow label="Offers & promotions" sub="Coupons and deals" value={offers} onChange={setOffers} />
        </Card>

        <Card>
          <Pressable onPress={() => onNavigate('language')} className="flex-row items-center gap-3 px-4 py-3">
            <Text className="flex-1 text-sm font-medium text-foreground">Language</Text>
            <Text className="text-sm text-foreground-secondary">English</Text>
            <ChevronRight size={18} color="#717182" />
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}
