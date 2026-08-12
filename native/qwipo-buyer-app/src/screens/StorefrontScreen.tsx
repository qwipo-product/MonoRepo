import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '../components/ui';
import { formatInr } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { img } from '../lib/images';
import { ChevronLeft, Search, Check, ArrowRight } from '../lib/icons';
import type { Navigate } from '../nav/nav';
import type { AppliedFilter } from '../data/filters';
import { DIST_CATEGORIES, BRANDS, type Distributor } from '../data/home';
import { PRODUCTS } from '../data/products';
import { deliveryFor, dayLabel } from '../data/delivery';

/* Authorised Distributor storefront — brand hero (MOV + delivery), shop-by-
   category grid, top-brands rail. Category / brand taps open the Product List
   scoped to THIS distributor. */
export function StorefrontScreen({
  distributor,
  onBack,
  onNavigate,
}: {
  distributor: Distributor;
  onBack: () => void;
  onNavigate: Navigate;
}) {
  const dist = deliveryFor(distributor.name);
  const myProducts = PRODUCTS.filter((p) => p.source === 'distributor' && p.seller === distributor.name);
  const myCategories = DIST_CATEGORIES.filter((c) => myProducts.some((p) => p.category === c.name));
  const myBrands = BRANDS.filter((b) => myProducts.some((p) => p.shortName.toLowerCase().startsWith(b.name.toLowerCase())));

  const openList = (extra?: AppliedFilter) =>
    onNavigate('listing', {
      applied: extra ? [{ type: 'distributor', value: distributor.name }, extra] : [{ type: 'distributor', value: distributor.name }],
      backTo: 'storefront',
    });

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3" style={shadows.sm}>
        <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-70">
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <Text className="min-w-0 flex-1 text-base font-semibold text-foreground" numberOfLines={1}>
          Authorised Distributor
        </Text>
        <Pressable onPress={() => onNavigate('global-search')} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-70">
          <Search size={18} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 bg-background">
        {/* hero */}
        <View className="bg-primary px-4 pb-4 pt-4">
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-lg bg-white">
              <Text className="text-sm font-bold text-primary">{distributor.short}</Text>
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-base font-bold text-primary-foreground" numberOfLines={1}>
                  {distributor.name}
                </Text>
                <Check size={16} color={colors.white} />
              </View>
              <View className="mt-1 self-start rounded-full bg-success/30 px-2 py-0.5">
                <Text className="text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Authorised</Text>
              </View>
            </View>
          </View>

          <View className="mt-3 flex-row overflow-hidden rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            {dist.options.map((o, i) => (
              <View key={i} className="flex-1 items-center px-3 py-2.5" style={i > 0 ? { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' } : undefined}>
                <Text className="text-[11px] text-primary-foreground/70">Delivery by</Text>
                <Text className="mt-0.5 text-sm font-bold text-primary-foreground">{dayLabel(o)}</Text>
                <Text className="mt-1 text-[11px] font-medium text-primary-foreground/80">
                  {o.mov != null ? `Min. order ${formatInr(o.mov)}` : 'No minimum'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-6 p-4">
          <Button variant="secondary" fullWidth onPress={() => openList()}>
            <Text className="text-sm font-bold text-foreground">View all products</Text>
            <ArrowRight size={16} color={colors.foreground} />
          </Button>

          {myCategories.length > 0 && (
            <View className="gap-3">
              <Text className="text-base font-semibold text-foreground">Shop by category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {myCategories.map((c) => {
                  const src = img(c.image);
                  return (
                    <Pressable key={c.id} onPress={() => openList({ type: 'category', value: c.name })} className="w-28 items-center gap-1.5">
                      <View className="aspect-[2/1] w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
                        {src ? <Image source={src} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text className="text-2xl">📦</Text>}
                      </View>
                      <Text className="w-full text-center text-xs text-foreground" numberOfLines={1}>
                        {c.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {myBrands.length > 0 && (
            <View className="gap-3">
              <Text className="text-base font-semibold text-foreground">Top brands</Text>
              <View className="flex-row flex-wrap gap-3">
                {myBrands.map((b) => {
                  const src = img(b.logo);
                  return (
                    <Pressable key={b.id} onPress={() => openList({ type: 'brand', value: b.name })} className="w-[21%] items-center gap-1.5">
                      <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
                        {src ? <Image source={src} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text className="text-base font-bold text-foreground">{b.name.charAt(0)}</Text>}
                      </View>
                      <Text className="w-full text-center text-xs text-foreground" numberOfLines={1}>
                        {b.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
