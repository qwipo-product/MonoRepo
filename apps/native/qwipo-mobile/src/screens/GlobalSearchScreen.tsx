import { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search, X } from 'lucide-react-native';
import { PRODUCTS } from '../data/products';
import { formatInr } from '../ui/PriceLabel';
import { Chip } from '../ui/Chip';
import type { Navigate } from '../nav';

const TRENDING = ['Sunflower oil', 'Aashirvaad', 'Tea', 'Maggi', 'Soap'];

export function GlobalSearchScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: Navigate }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const results = query
    ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(query) || p.shortName.toLowerCase().includes(query))
    : [];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="flex-row items-center gap-2 border-b border-border bg-card px-3 py-2">
        <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md">
          <ChevronLeft size={20} color="#1f2024" />
        </Pressable>
        <View className="flex-1 flex-row items-center gap-2 rounded-lg border border-border bg-card px-3">
          <Search size={18} color="#2563eb" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search for products"
            placeholderTextColor="#717182"
            autoFocus
            className="h-10 flex-1 text-sm text-foreground"
          />
          {q.length > 0 ? (
            <Pressable onPress={() => setQ('')}>
              <X size={16} color="#717182" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {query.length === 0 ? (
        <View className="p-4">
          <Text className="text-[10px] font-semibold uppercase tracking-wide text-foreground-secondary">Trending</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {TRENDING.map((t) => (
              <Chip key={t} onPress={() => setQ(t)}>
                {t}
              </Chip>
            ))}
          </View>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-2 p-3">
          {results.length === 0 ? (
            <Text className="p-6 text-center text-sm text-foreground-secondary">No products match “{q}”.</Text>
          ) : (
            results.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => onNavigate('listing')}
                className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <View className="h-11 w-11 items-center justify-center rounded-lg bg-muted">
                  <Text className="text-xl">{p.image}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                    {p.shortName}
                  </Text>
                  <Text className="text-xs text-foreground-secondary">{p.seller}</Text>
                </View>
                <Text className="text-sm font-bold text-foreground">{formatInr(p.price)}</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
