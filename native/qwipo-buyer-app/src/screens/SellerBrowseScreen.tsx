import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { ScreenHeader, SearchField, SegmentedControl } from '../components/ui';
import { colors, shadows } from '../lib/theme';
import { img } from '../lib/images';
import { ChevronRight, BadgeCheck } from '../lib/icons';
import type { ScreenId } from '../nav/screenIndex';
import type { Navigate } from '../nav/nav';
import type { HomeCategory, HomeBrand, Distributor } from '../data/home';

export type BrowseTab = 'categories' | 'brands' | 'sellers';
const TAB_LABEL: Record<BrowseTab, string> = { categories: 'Categories', brands: 'Brands', sellers: 'Sellers' };
const PLACEHOLDER: Record<BrowseTab, string> = { categories: 'Search categories', brands: 'Search brands', sellers: 'Search sellers' };

export function SellerBrowseScreen({
  title,
  subtitle,
  tabs,
  categories,
  brands,
  sellers = [],
  productListId = 'listing',
  selfId,
  initialTab,
  onBack,
  onNavigate,
}: {
  title: string;
  subtitle: string;
  tabs: BrowseTab[];
  categories: HomeCategory[];
  brands: HomeBrand[];
  sellers?: Distributor[];
  productListId?: ScreenId;
  selfId: ScreenId;
  initialTab?: BrowseTab;
  onBack: () => void;
  onNavigate: Navigate;
}) {
  const [tab, setTab] = useState<BrowseTab>(initialTab && tabs.includes(initialTab) ? initialTab : tabs[0]);
  useEffect(() => {
    setTab(initialTab && tabs.includes(initialTab) ? initialTab : tabs[0]);
  }, [initialTab]);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const catList = useMemo(() => (q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories), [q, categories]);
  const brandList = useMemo(() => (q ? brands.filter((b) => b.name.toLowerCase().includes(q)) : brands), [q, brands]);
  const sellerList = useMemo(() => (q ? sellers.filter((d) => d.name.toLowerCase().includes(q)) : sellers), [q, sellers]);
  const empty = (tab === 'categories' ? catList : tab === 'brands' ? brandList : sellerList).length === 0;

  return (
    <View className="flex-1 bg-background">
      <View className="border-b border-border bg-card" style={shadows.sm}>
        <ScreenHeader title={title} subtitle={subtitle} onBack={onBack} />
        <View className="px-4 pt-3">
          <SegmentedControl<BrowseTab> options={tabs.map((t) => ({ value: t, label: TAB_LABEL[t] }))} value={tab} onChange={setTab} />
        </View>
        <View className="px-4 pb-3 pt-3">
          <SearchField value={query} onChangeText={setQuery} placeholder={PLACEHOLDER[tab]} />
        </View>
      </View>

      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16 }}>
        {empty ? (
          <Text className="py-12 text-center text-sm text-foreground-secondary">No {tab} match “{query}”.</Text>
        ) : tab === 'categories' ? (
          <View className="flex-row flex-wrap gap-3">
            {catList.map((c) => (
              <Pressable key={c.id} onPress={() => onNavigate(productListId, { applied: [{ type: 'category', value: c.name }], backTo: selfId })} className="w-[47%] gap-2">
                <View className="aspect-[2/1] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                  {img(c.image) ? <Image source={img(c.image)} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text className="text-2xl">📦</Text>}
                </View>
                <Text className="text-center text-sm font-medium text-foreground" numberOfLines={1}>{c.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : tab === 'brands' ? (
          <View className="flex-row flex-wrap gap-3">
            {brandList.map((b) => (
              <Pressable key={b.id} onPress={() => onNavigate(productListId, { applied: [{ type: 'brand', value: b.name }], backTo: selfId })} className="w-[21%] items-center gap-1.5">
                <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
                  {img(b.logo) ? <Image source={img(b.logo)} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text className="text-base font-bold text-foreground">{b.name.charAt(0)}</Text>}
                </View>
                <Text className="w-full text-center text-xs text-foreground" numberOfLines={1}>{b.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View className="gap-3">
            {sellerList.map((d) => (
              <View key={d.id} className="overflow-hidden rounded-lg border border-border bg-card" style={shadows.sm}>
                <Pressable onPress={() => onNavigate('storefront', { backTo: selfId, distributor: d })} className="flex-row items-center gap-3 p-3">
                  <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                    {img(d.logo) ? <Image source={img(d.logo)} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text className="text-lg">🏭</Text>}
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{d.name}</Text>
                    <View className="mt-0.5 flex-row items-center gap-1">
                      <BadgeCheck size={14} color={colors.successForeground} />
                      <Text className="text-xs text-success-foreground">Verified seller</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-foreground-secondary">{brands.length} brands</Text>
                  <ChevronRight size={20} color={colors.foregroundSecondary} />
                </Pressable>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 12, paddingVertical: 10 }} className="border-t border-border">
                  {brands.slice(0, 6).map((b) => (
                    <View key={b.id} className="h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
                      {img(b.logo) ? <Image source={img(b.logo)} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text className="text-xs font-bold text-foreground">{b.name.charAt(0)}</Text>}
                    </View>
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
