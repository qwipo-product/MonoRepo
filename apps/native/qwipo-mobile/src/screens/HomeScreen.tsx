import { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, User, MapPin, ChevronDown, Search } from 'lucide-react-native';
import { lightTheme } from '../theme/tokens';
import { cn } from '../ui/cn';
import { DISTRIBUTORS, CATEGORIES, BRANDS } from '../data/home';
import type { Navigate } from '../nav';

const c = lightTheme.color;

export function HomeScreen({ onNavigate }: { onNavigate: Navigate }) {
  const [tab, setTab] = useState<'distributors' | 'wholesalers'>('distributors');
  const browse = () => onNavigate(tab === 'wholesalers' ? 'wholesalers' : 'distributors');

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background-subtle">
      {/* header */}
      <View className="bg-card px-4 pb-3 pt-2">
        <View className="flex-row items-center">
          <Text className="text-xl font-bold text-primary">qwipo</Text>
          <View className="flex-1" />
          <IconButton onPress={() => onNavigate('notifications')}>
            <Bell size={20} color={c.text.primary} />
          </IconButton>
          <View className="w-2" />
          <IconButton onPress={() => onNavigate('account')}>
            <User size={20} color={c.text.primary} />
          </IconButton>
        </View>

        <Pressable className="mt-3 flex-row items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-2.5 active:opacity-90">
          <MapPin size={16} color={c.brand.primary} />
          <Text className="text-sm text-primary">Deliver to</Text>
          <Text className="flex-1 text-sm font-medium text-foreground" numberOfLines={1}>
            Sri Venkateswara Kirana Store
          </Text>
          <ChevronDown size={16} color={c.text.secondary} />
        </Pressable>

        <Pressable
          onPress={() => onNavigate('search')}
          className="mt-2 h-11 flex-row items-center gap-2 rounded-lg border border-border bg-card px-3 active:opacity-90"
        >
          <Search size={18} color={c.brand.primary} />
          <Text className="text-sm text-foreground-secondary">Search for Products</Text>
        </Pressable>

        <View className="mt-3 flex-row gap-1 rounded-lg bg-muted p-1">
          {(['distributors', 'wholesalers'] as const).map((t) => {
            const on = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                className={cn('flex-1 items-center rounded-md py-2', on && 'bg-card')}
              >
                <Text className={cn('text-sm font-medium', on ? 'text-foreground' : 'text-foreground-secondary')}>
                  {t === 'distributors' ? 'Authorised distributors' : 'Wholesalers'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-6" showsVerticalScrollIndicator={false}>
        {/* hero banner */}
        <View className="px-4 pt-4">
          <Pressable onPress={() => onNavigate('listing')} className="h-36 justify-end rounded-xl bg-primary p-4 active:opacity-90">
            <Text className="text-lg font-bold text-primary-foreground">Fresh stock, best margins</Text>
            <Text className="mt-0.5 text-xs text-primary-foreground">Order today · delivered on your beat day</Text>
          </Pressable>
        </View>

        <Section title="Distributors" onSeeAll={browse}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-4">
            {DISTRIBUTORS.map((d) => (
              <Pressable key={d.id} onPress={() => onNavigate('storefront')} className="w-28">
                <View className="h-28 w-28 items-center justify-center rounded-lg border border-border bg-card">
                  <Text className="text-lg font-bold text-primary">{d.short}</Text>
                </View>
                <Text className="mt-1.5 text-sm font-medium text-foreground" numberOfLines={1}>
                  {d.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Section>

        <Section title="Categories" onSeeAll={browse}>
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

        <Section title="All Brands" onSeeAll={browse}>
          <View className="flex-row flex-wrap gap-3 px-4">
            {BRANDS.map((b) => (
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
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function IconButton({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} className="h-10 w-10 items-center justify-center rounded-lg border border-border bg-card active:opacity-80">
      {children}
    </Pressable>
  );
}

function Section({ title, onSeeAll, children }: { title: string; onSeeAll?: () => void; children: React.ReactNode }) {
  return (
    <View className="mt-6 gap-3">
      <View className="flex-row items-center justify-between px-4">
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll}>
            <Text className="text-sm font-medium text-primary">See all</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}
