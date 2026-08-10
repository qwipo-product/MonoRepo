import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Package, Bell, Building2, MapPin, CreditCard, Landmark, Settings, Phone, FileText, LogOut, ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import { BUSINESS } from '../data/account';
import type { Navigate, Screen } from '../nav';

type Item = { icon: LucideIcon; label: string; to: Screen };
const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Orders',
    items: [
      { icon: Package, label: 'My Orders', to: 'my-orders' },
      { icon: Bell, label: 'Notifications', to: 'notifications' },
    ],
  },
  {
    title: 'Business',
    items: [
      { icon: Building2, label: 'Business Details', to: 'business-details' },
      { icon: MapPin, label: 'Saved Addresses', to: 'addresses' },
      { icon: CreditCard, label: 'Payments', to: 'payments' },
      { icon: Landmark, label: 'Credit Partners', to: 'credit' },
    ],
  },
  {
    title: 'More',
    items: [
      { icon: Settings, label: 'Settings', to: 'settings' },
      { icon: Phone, label: 'Contact Us', to: 'contact' },
      { icon: FileText, label: 'Terms & Conditions', to: 'terms' },
    ],
  },
];

export function AccountScreen({ onNavigate, onSignOut }: { onNavigate: Navigate; onSignOut: () => void }) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background-subtle">
      <ScrollView contentContainerClassName="pb-8">
        <View className="flex-row items-center gap-3 bg-card px-4 py-4">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
            <Text className="text-lg font-bold text-primary">{BUSINESS.name.slice(0, 2)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">{BUSINESS.name}</Text>
            <Text className="text-xs text-foreground-secondary">{BUSINESS.phone}</Text>
          </View>
        </View>

        {GROUPS.map((g) => (
          <View key={g.title} className="mt-4">
            <Text className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-foreground-secondary">{g.title}</Text>
            <View className="mx-3 overflow-hidden rounded-lg border border-border bg-card">
              {g.items.map((it, i) => (
                <Pressable
                  key={it.label}
                  onPress={() => onNavigate(it.to)}
                  className={'flex-row items-center gap-3 px-4 py-3 active:bg-muted ' + (i > 0 ? 'border-t border-border' : '')}
                >
                  <it.icon size={18} color="#2563eb" />
                  <Text className="flex-1 text-sm font-medium text-foreground">{it.label}</Text>
                  <ChevronRight size={18} color="#717182" />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View className="mx-3 mt-6">
          <Pressable
            onPress={onSignOut}
            className="flex-row items-center justify-center gap-2 rounded-lg border border-error-border bg-error-subtle py-3 active:opacity-90"
          >
            <LogOut size={18} color="#b91c1c" />
            <Text className="text-sm font-bold text-error-foreground">Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
