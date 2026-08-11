import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import type { Navigate } from '../nav/nav';
import { cn } from '../lib/format';
import { colors } from '../lib/theme';
import { img } from '../lib/images';
import { QwipoWordmark } from '../components/BrandMark';
import { Bell, User, MapPin, ChevronDown, Search, ArrowRight } from '../lib/icons';
import {
  DISTRIBUTORS,
  DIST_CATEGORIES,
  BRANDS,
  WHOLESALER_CATEGORIES,
  WHOLESALER_L1,
  WHOLESALER_OFFERS,
  HERO_BANNERS,
  type Distributor,
  type HomeCategory,
  type HomeOffer,
} from '../data/home';

// Emoji stand-ins for category art (real PNGs are a Phase-6 asset pass).
const CAT_EMOJI: Record<string, string> = {
  'Cooking Oils & Ghee': '🛢️',
  'Rice & Rice Products': '🍚',
  'Atta, Flours & Sooji': '🌾',
  'Dals & Pulses': '🫘',
  'Masala & Seasoning': '🌶️',
  'Snacks & Namkeen': '🍜',
  Beverages: '☕',
  'Dairy & Cheese': '🧀',
  'Sugar & Spices': '🧂',
  'Dry Fruits': '🥜',
  Groceries: '🛒',
  FMCG: '🧴',
};

export function HomeScreen({
  deliveryLabel = 'Sri Venkateswara Kirana Store',
  availability = 'both',
  onNavigate,
}: {
  deliveryLabel?: string;
  availability?: 'both' | 'distributors' | 'wholesalers';
  onNavigate: Navigate;
  salesperson?: boolean;
}) {
  const [tab, setTab] = useState<'distributors' | 'wholesalers'>('distributors');
  const distAvailable = availability !== 'wholesalers';
  const wholeAvailable = availability !== 'distributors';
  const effectiveTab = !distAvailable ? 'wholesalers' : !wholeAvailable ? 'distributors' : tab;

  return (
    <View className="flex-1 bg-background">
      {/* header */}
      <View className="bg-card shadow-sm">
        <View className="flex-row items-center gap-3 px-4 pt-3">
          <QwipoWordmark height={24} />
          <View className="flex-1 items-center">
            <Image source={require('../../assets/brand/digidukaan.png')} style={{ width: 150, height: 150 / 7.6 }} resizeMode="contain" />
          </View>
          <Pressable onPress={() => onNavigate('notifications', { backTo: 'home' })} className="h-10 w-10 items-center justify-center rounded-lg border border-border" accessibilityLabel="Notifications">
            <Bell size={20} color={colors.foreground} />
            <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
          </Pressable>
          <Pressable onPress={() => onNavigate('profile')} className="h-10 w-10 items-center justify-center rounded-lg border border-border" accessibilityLabel="Profile">
            <User size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View className="px-4 pb-1 pt-1">
          <Pressable onPress={() => onNavigate('sub:addresses', { backTo: 'home' })} className="w-full flex-row items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1.5">
            <MapPin size={16} color={colors.primary} />
            <Text className="text-sm text-primary">Deliver to</Text>
            <Text className="flex-1 text-sm font-medium text-foreground" numberOfLines={1}>
              {deliveryLabel}
            </Text>
            <ChevronDown size={16} color={colors.foregroundSecondary} />
          </Pressable>
        </View>

        <View className="px-4 pb-2">
          <Pressable onPress={() => onNavigate('global-search')} className="h-11 flex-row items-center gap-2 rounded-lg border border-border bg-card px-3">
            <Search size={20} color={colors.primary} />
            <Text className="text-sm text-foreground-secondary">Search for Products</Text>
          </Pressable>
        </View>

        <View className="flex-row gap-2 px-4 pb-3">
          <TabButton active={effectiveTab === 'distributors'} disabled={!distAvailable} emoji="🏬" image="/home-category-cards/distributors.png" label="Authorized Distributors" onPress={() => setTab('distributors')} />
          <TabButton active={effectiveTab === 'wholesalers'} disabled={!wholeAvailable} emoji="📦" image="/home-category-cards/wholesalers.png" label="Wholesalers" onPress={() => setTab('wholesalers')} />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}>
        <BannerCarousel banners={HERO_BANNERS} onOpen={() => onNavigate('listing', { backTo: 'home' })} />

        {effectiveTab === 'distributors' ? (
          <View className="mt-6 gap-6">
            <Section title="Distributors" onSeeAll={() => onNavigate('distributors-list', { tab: 'sellers' })}>
              <Rail>
                {DISTRIBUTORS.map((d) => (
                  <DistributorCard key={d.id} d={d} onPress={() => onNavigate('storefront', { backTo: 'home', distributor: d })} />
                ))}
              </Rail>
            </Section>

            <Section title="Categories" onSeeAll={() => onNavigate('distributors-list', { tab: 'categories' })}>
              <Rail>
                {DIST_CATEGORIES.map((c) => (
                  <CategoryTile key={c.id} cat={c} onPress={() => onNavigate('listing', { applied: [{ type: 'category', value: c.name }], backTo: 'home' })} />
                ))}
              </Rail>
            </Section>

            <Section title="All Brands" onSeeAll={() => onNavigate('distributors-list', { tab: 'brands' })}>
              <BrandGrid brands={BRANDS} onBrand={(b) => onNavigate('listing', { applied: [{ type: 'brand', value: b.name }], backTo: 'home' })} />
            </Section>
          </View>
        ) : (
          <View className="mt-6 gap-6">
            <Section title="Categories">
              <View className="flex-row gap-3 px-4">
                {WHOLESALER_L1.map((c) => {
                  const src = img(c.image);
                  return (
                    <Pressable key={c.id} onPress={() => onNavigate('wholesaler-categories', { tab: 'categories' })} className="flex-1 gap-2">
                      <View className="aspect-[2/1] items-center justify-center overflow-hidden rounded-lg bg-muted">
                        {src ? <Image source={src} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text className="text-3xl">{CAT_EMOJI[c.name] ?? '📦'}</Text>}
                      </View>
                      <Text className="text-center text-sm font-medium text-foreground">{c.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section title="Exclusive offers">
              <Rail>
                {WHOLESALER_OFFERS.map((o) => (
                  <OfferCard key={o.id} offer={o} onPress={() => onNavigate('wholesaler-products', { applied: [{ type: 'brand', value: o.brand }], backTo: 'home' })} />
                ))}
              </Rail>
            </Section>

            <Section title="Top categories" onSeeAll={() => onNavigate('wholesaler-categories', { tab: 'categories' })}>
              <Rail>
                {WHOLESALER_CATEGORIES.map((c) => (
                  <CategoryTile key={c.id} cat={c} onPress={() => onNavigate('wholesaler-products', { applied: [{ type: 'category', value: c.name }], backTo: 'home' })} />
                ))}
              </Rail>
            </Section>

            <Section title="All Brands" onSeeAll={() => onNavigate('wholesaler-categories', { tab: 'brands' })}>
              <BrandGrid brands={BRANDS} onBrand={(b) => onNavigate('wholesaler-products', { applied: [{ type: 'brand', value: b.name }], backTo: 'home' })} />
            </Section>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TabButton({ active, disabled, emoji, image, label, onPress }: { active: boolean; disabled?: boolean; emoji: string; image?: string; label: string; onPress: () => void }) {
  const src = img(image);
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      className={cn('flex-1 flex-row items-center gap-2 rounded-lg border p-2', active && !disabled ? 'border-primary bg-card' : 'border-border bg-card', disabled && 'opacity-70')}
    >
      <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-muted">
        {src ? <Image source={src} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text className="text-xl">{emoji}</Text>}
      </View>
      <View className="min-w-0 flex-1">
        <Text className={cn('text-xs font-medium', disabled ? 'text-foreground-secondary' : active ? 'text-primary' : 'text-foreground')} numberOfLines={2}>
          {label}
        </Text>
        {disabled && <Text className="mt-0.5 text-[10px] text-foreground-tertiary">Coming Soon</Text>}
      </View>
    </Pressable>
  );
}

function Section({ title, onSeeAll, children }: { title: string; onSeeAll?: () => void; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-4">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll}>
            <Text className="text-sm font-medium text-primary">See all</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

function Rail({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
      {children}
    </ScrollView>
  );
}

function DistributorCard({ d, onPress }: { d: Distributor; onPress: () => void }) {
  const src = img(d.logo);
  return (
    <Pressable onPress={onPress} className="w-28 gap-1.5">
      <View className="h-28 w-28 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
        {src ? <Image source={src} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text className="text-3xl">🏭</Text>}
      </View>
      <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
        {d.title}
      </Text>
      <Text className="text-xs text-foreground-secondary" numberOfLines={1}>
        {d.short}
      </Text>
    </Pressable>
  );
}

function CategoryTile({ cat, onPress }: { cat: HomeCategory; onPress: () => void }) {
  const src = img(cat.image);
  return (
    <Pressable onPress={onPress} className="w-28 items-center gap-1.5">
      <View className="aspect-[2/1] w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
        {src ? <Image source={src} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text className="text-2xl">{CAT_EMOJI[cat.name] ?? '📦'}</Text>}
      </View>
      <Text className="w-full text-center text-xs text-foreground" numberOfLines={1}>
        {cat.name}
      </Text>
    </Pressable>
  );
}

function BrandGrid({ brands, onBrand }: { brands: typeof BRANDS; onBrand: (b: (typeof BRANDS)[number]) => void }) {
  return (
    <View className="flex-row flex-wrap gap-3 px-4">
      {brands.slice(0, 8).map((b) => (
        <Pressable key={b.id} onPress={() => onBrand(b)} className="w-[21%] items-center gap-1.5">
          <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
            {img(b.logo) ? <Image source={img(b.logo)} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text className="text-base font-bold text-foreground">{b.name.charAt(0)}</Text>}
          </View>
          <Text className="w-full text-center text-xs text-foreground" numberOfLines={1}>
            {b.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const OFFER_TONE: Record<HomeOffer['tone'], string> = {
  primary: 'bg-primary-soft',
  success: 'bg-success-subtle',
  warning: 'bg-warning-subtle',
};

function OfferCard({ offer, onPress }: { offer: HomeOffer; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={cn('h-40 w-52 rounded-lg p-3', OFFER_TONE[offer.tone])}>
      <View className="flex-row items-start justify-between">
        <Text className="text-base font-bold text-foreground">{offer.headline}</Text>
        <Text className="text-2xl">{offer.emoji}</Text>
      </View>
      <View className="mt-auto">
        <Text className="text-sm font-semibold text-foreground">{offer.brand}</Text>
        <Text className="text-xs text-foreground-secondary" numberOfLines={1}>
          {offer.sub}
        </Text>
        <View className="mt-1.5 flex-row items-center gap-1">
          <Text className="text-xs font-semibold text-foreground">Shop now</Text>
          <ArrowRight size={14} color={colors.foreground} />
        </View>
      </View>
    </Pressable>
  );
}

function BannerCarousel({ banners, onOpen }: { banners: string[]; onOpen: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % banners.length), 3500);
    return () => clearInterval(t);
  }, [banners.length]);
  const src = img(banners[i]);
  const TONES = ['bg-primary', 'bg-success', 'bg-warning', 'bg-info'];
  return (
    <View className="px-4">
      <Pressable onPress={onOpen} className={cn('h-40 items-center justify-center overflow-hidden rounded-lg', !src && TONES[i % TONES.length])}>
        {src ? (
          <Image source={src} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <>
            <Text className="text-lg font-bold text-white">Qwipo Offers</Text>
            <Text className="mt-1 text-sm text-white/80">Banner {i + 1}</Text>
          </>
        )}
      </Pressable>
      <View className="mt-2 flex-row justify-center gap-1.5">
        {banners.map((_, j) => (
          <View key={j} className={cn('h-1.5 rounded-full', j === i ? 'w-4 bg-primary' : 'w-1.5 bg-foreground-secondary/30')} />
        ))}
      </View>
    </View>
  );
}
