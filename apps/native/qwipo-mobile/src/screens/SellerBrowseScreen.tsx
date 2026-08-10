import { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { ChevronRight, BadgeCheck } from 'lucide-react-native';
import { Header } from '../components/Header';
import { cn } from '../ui/cn';
import type { Navigate } from '../nav';
import type { Category, Brand, Distributor } from '../data/home';

export type BrowseTab = 'categories' | 'brands' | 'sellers';
const LABEL: Record<BrowseTab, string> = { categories: 'Categories', brands: 'Brands', sellers: 'Sellers' };

export function SellerBrowseScreen({
  title,
  subtitle,
  tabs,
  categories,
  brands,
  sellers = [],
  onBack,
  onNavigate,
}: {
  title: string;
  subtitle: string;
  tabs: BrowseTab[];
  categories: Category[];
  brands: Brand[];
  sellers?: Distributor[];
  onBack: () => void;
  onNavigate: Navigate;
}) {
  const [tab, setTab] = useState<BrowseTab>(tabs[0]);
  return (
    <View className="flex-1 bg-background-subtle">
      <Header title={title} subtitle={subtitle} onBack={onBack} />
      <View className="bg-card px-4 pb-3">
        <View className="flex-row gap-1 rounded-lg bg-muted p-1">
          {tabs.map((t) => {
            const on = t === tab;
            return (
              <Pressable key={t} onPress={() => setTab(t)} className={cn('flex-1 items-center rounded-md py-2', on && 'bg-card')}>
                <Text className={cn('text-sm font-medium', on ? 'text-foreground' : 'text-foreground-secondary')}>{LABEL[t]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerClassName="p-4">
        {tab === 'categories' ? (
          <View className="flex-row flex-wrap gap-3">
            {categories.map((cat) => (
              <Pressable key={cat.id} onPress={() => onNavigate('listing')} className="w-[72px] items-center">
                <View className="h-16 w-16 items-center justify-center rounded-lg bg-muted">
                  <Text className="text-3xl">{cat.emoji}</Text>
                </View>
                <Text className="mt-1 text-center text-[11px] text-foreground" numberOfLines={2}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : tab === 'brands' ? (
          <View className="flex-row flex-wrap gap-3">
            {brands.map((b) => (
              <Pressable key={b.id} onPress={() => onNavigate('listing')} className="w-[64px] items-center">
                <View className="h-14 w-14 items-center justify-center rounded-full border border-border bg-card">
                  <Text className="text-base font-bold text-foreground-secondary">{b.name.slice(0, 2)}</Text>
                </View>
                <Text className="mt-1 text-center text-[11px] text-foreground" numberOfLines={1}>
                  {b.name}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View className="gap-3">
            {sellers.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => onNavigate('storefront')}
                className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <View className="h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <Text className="text-sm font-bold text-primary">{d.short}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{d.title}</Text>
                  <View className="mt-0.5 flex-row items-center gap-1">
                    <BadgeCheck size={13} color="#047857" />
                    <Text className="text-xs text-success-foreground">Verified seller</Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#717182" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
