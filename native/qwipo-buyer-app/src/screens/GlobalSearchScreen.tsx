import { useMemo, useState, type ComponentType } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SearchField } from '../components/ui';
import { cn, formatInr } from '../lib/format';
import { colors } from '../lib/theme';
import { ChevronLeft, Clock, TrendingUp, ArrowUpRight, PackageOpen, Tag, LayoutGrid } from '../lib/icons';
import { PRODUCTS } from '../data/products';
import { BRANDS, DIST_CATEGORIES, WHOLESALER_CATEGORIES, type HomeCategory } from '../data/home';

const RECENT = ['Sunflower Oil', 'Aashirvaad Atta', 'Maggi', 'Besan'];
const TRENDING = ['Edible Oils & Ghee', 'Atta & Flours', 'Instant Noodles', 'Dals & Pulses'];
const CATEGORIES: HomeCategory[] = Array.from(new Map([...DIST_CATEGORIES, ...WHOLESALER_CATEGORIES].map((c) => [c.name, c])).values());

function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <Text className="text-sm text-foreground">{text}</Text>;
  return (
    <Text className="text-sm text-foreground">
      {text.slice(0, i)}
      <Text className="font-semibold text-primary">{text.slice(i, i + q.length)}</Text>
      {text.slice(i + q.length)}
    </Text>
  );
}

export function GlobalSearchScreen({ onBack, onOpenSheet }: { onBack: () => void; onOpenSheet: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const brandMatches = useMemo(() => (q ? BRANDS.filter((b) => b.name.toLowerCase().includes(q)).slice(0, 2) : []), [q]);
  const productMatches = useMemo(
    () => (q ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(q) || p.seller.toLowerCase().includes(q)) : []),
    [q]
  );
  const categoryMatches = useMemo(() => {
    if (!q) return [];
    const byName = CATEGORIES.filter((c) => c.name.toLowerCase().includes(q)).map((c) => c.name);
    const byProduct = productMatches.map((p) => p.category);
    return Array.from(new Set([...byName, ...byProduct])).slice(0, 2);
  }, [q, productMatches]);

  const term = query.trim();
  const hasAnyMatch = brandMatches.length + categoryMatches.length + productMatches.length > 0;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-2 border-b border-border bg-card p-3">
        <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-70">
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <View className="flex-1">
          <SearchField value={query} onChangeText={setQuery} placeholder="Search for products" autoFocus />
        </View>
      </View>

      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: q ? 12 : 16, gap: q ? 12 : 24 }} keyboardShouldPersistTaps="handled">
        {!q ? (
          <>
            <ChipSection title="Recent searches" items={RECENT} icon={Clock} onPick={setQuery} />
            <ChipSection title="Trending searches" items={TRENDING} icon={TrendingUp} accent onPick={setQuery} />
            <ChipSection title="Start with a category" items={CATEGORIES.map((c) => c.name)} onPick={setQuery} />
          </>
        ) : hasAnyMatch ? (
          <>
            {brandMatches.length > 0 && (
              <View className="gap-1.5">
                <GroupHeader term={term} group="Brands" />
                <View className="overflow-hidden rounded-lg border border-border bg-card">
                  {brandMatches.map((b) => (
                    <Pressable key={b.id} onPress={() => setQuery(b.name)} className="flex-row items-center gap-2.5 border-b border-border px-3 py-2">
                      <Tag size={16} color={colors.foregroundSecondary} />
                      <View className="min-w-0 flex-1">
                        <Highlight text={b.name} q={q} />
                      </View>
                      <ArrowUpRight size={16} color={colors.foregroundSecondary} />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {categoryMatches.length > 0 && (
              <View className="gap-1.5">
                <GroupHeader term={term} group="Categories" />
                <View className="overflow-hidden rounded-lg border border-border bg-card">
                  {categoryMatches.map((name) => (
                    <Pressable key={name} onPress={() => setQuery(name)} className="flex-row items-center gap-2.5 border-b border-border px-3 py-2">
                      <LayoutGrid size={16} color={colors.foregroundSecondary} />
                      <View className="min-w-0 flex-1">
                        <Highlight text={name} q={q} />
                      </View>
                      <ArrowUpRight size={16} color={colors.foregroundSecondary} />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {productMatches.length > 0 && (
              <View className="gap-2">
                <GroupHeader term={term} group="Products" />
                <View className="overflow-hidden rounded-lg border border-border bg-card">
                  {productMatches.map((p) => (
                    <Pressable key={p.id} onPress={() => onOpenSheet(p.id)} className="flex-row items-start gap-3 border-b border-border px-3 py-2.5">
                      <View className="h-9 w-9 items-center justify-center rounded-md bg-muted">
                        <Text className="text-lg">{p.image}</Text>
                      </View>
                      <View className="min-w-0 flex-1">
                        <Highlight text={p.name} q={q} />
                      </View>
                      <View className="items-end">
                        <Text className="text-[11px] text-foreground-secondary">
                          {p.variants.slice(0, 2).map((v) => v.label).join(' · ')}
                          {p.variants.length > 2 ? ` +${p.variants.length - 2}` : ''}
                        </Text>
                        <Text className="mt-0.5 text-sm font-semibold text-foreground">{formatInr(p.price)}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <View className="items-center px-6 pt-12">
            <PackageOpen size={56} color={colors.foregroundTertiary} />
            <Text className="mt-3 text-base font-semibold text-foreground">No results for “{query}”</Text>
            <Text className="mt-1 text-center text-sm text-foreground-secondary">Check the spelling, or try a brand or category name.</Text>
            <View className="mt-6 w-full">
              <ChipSection title="Try one of these" items={TRENDING} icon={TrendingUp} accent onPick={setQuery} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function GroupHeader({ term, group }: { term: string; group: string }) {
  return (
    <Text className="px-1 text-xs text-foreground-secondary">
      <Text className="font-semibold text-foreground">{term}</Text> in {group}
    </Text>
  );
}

function ChipSection({
  title,
  items,
  icon: Icon,
  accent,
  onPick,
}: {
  title: string;
  items: string[];
  icon?: ComponentType<{ size?: number; color?: string }>;
  accent?: boolean;
  onPick: (v: string) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {items.map((label) => (
          <Pressable
            key={label}
            onPress={() => onPick(label)}
            className={cn('flex-row items-center gap-1.5 rounded-full border px-3 py-1.5', accent ? 'border-warning/40 bg-warning-subtle' : 'border-border bg-card')}
          >
            {Icon && <Icon size={14} color={accent ? colors.warning : colors.foregroundSecondary} />}
            <Text className={cn('text-xs', accent ? 'text-warning-foreground' : 'text-foreground')}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
