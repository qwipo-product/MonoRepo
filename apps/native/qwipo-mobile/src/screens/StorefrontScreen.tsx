import { ScrollView, View, Text, Pressable } from 'react-native';
import { Search } from 'lucide-react-native';
import { Header } from '../components/Header';
import { Button } from '../ui/Button';
import { CATEGORIES, BRANDS } from '../data/home';
import type { Navigate } from '../nav';
import type { ReactNode } from 'react';

const STORE = { name: 'Sri Sai Krishna Traders', initials: 'SSKT', mov: '₹5,000', delivery: 'Tomorrow' };
const TRANSLUCENT = 'rgba(255, 255, 255, 0.14)';

export function StorefrontScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: Navigate }) {
  return (
    <View className="flex-1 bg-background">
      <Header
        title="Authorised Distributor"
        onBack={onBack}
        right={
          <Pressable onPress={() => onNavigate('search')} className="h-9 w-9 items-center justify-center rounded-md bg-muted">
            <Search size={18} color="#1f2024" />
          </Pressable>
        }
      />
      <ScrollView contentContainerClassName="pb-6">
        {/* hero */}
        <View className="bg-primary px-4 pb-4 pt-4">
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-lg bg-card">
              <Text className="text-sm font-bold text-primary">{STORE.initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-primary-foreground">{STORE.name}</Text>
              <View className="mt-1 self-start rounded-full px-2 py-0.5" style={{ backgroundColor: TRANSLUCENT }}>
                <Text className="text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Authorised</Text>
              </View>
            </View>
          </View>
          <View className="mt-3 flex-row overflow-hidden rounded-lg" style={{ backgroundColor: TRANSLUCENT }}>
            <View className="flex-1 items-center py-2.5">
              <Text className="text-[11px] text-primary-foreground">Minimum Order</Text>
              <Text className="mt-0.5 text-sm font-bold text-primary-foreground">{STORE.mov}</Text>
            </View>
            <View className="w-px bg-white/20" />
            <View className="flex-1 items-center py-2.5">
              <Text className="text-[11px] text-primary-foreground">Delivery by</Text>
              <Text className="mt-0.5 text-sm font-bold text-primary-foreground">{STORE.delivery}</Text>
            </View>
          </View>
        </View>

        <View className="p-4">
          <Button variant="secondary" fullWidth onPress={() => onNavigate('listing')}>
            View all products
          </Button>
        </View>

        <Section title="Shop by category">
          <View className="flex-row flex-wrap gap-3 px-4">
            {CATEGORIES.map((cat) => (
              <Pressable key={cat.id} onPress={() => onNavigate('listing')} className="w-[70px] items-center">
                <View className="h-16 w-16 items-center justify-center rounded-lg bg-muted">
                  <Text className="text-3xl">{cat.emoji}</Text>
                </View>
                <Text className="mt-1 text-center text-[11px] text-foreground" numberOfLines={2}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="Top brands">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-4 px-4">
            {BRANDS.map((b) => (
              <Pressable key={b.id} onPress={() => onNavigate('listing')} className="w-16 items-center">
                <View className="h-16 w-16 items-center justify-center rounded-full border border-border bg-card">
                  <Text className="text-base font-bold text-foreground-secondary">{b.name.slice(0, 2)}</Text>
                </View>
                <Text className="mt-1 text-center text-[11px] text-foreground" numberOfLines={1}>
                  {b.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-6 gap-3">
      <Text className="px-4 text-base font-semibold text-foreground">{title}</Text>
      {children}
    </View>
  );
}
