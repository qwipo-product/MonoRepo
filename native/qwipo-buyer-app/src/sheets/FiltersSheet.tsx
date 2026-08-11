import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Button, Chip, Switch } from '../components/ui';
import { cn } from '../lib/format';
import { DEFAULT_FILTERS, countActiveFilters, type Filters, type SortKey, type Stock } from '../data/filters';

const SORT: { value: SortKey; label: string; sub: string }[] = [
  { value: 'recommended', label: 'Recommended', sub: 'Most relevant first' },
  { value: 'price_asc', label: 'Price: Low to High', sub: 'Cheapest first' },
  { value: 'price_desc', label: 'Price: High to Low', sub: 'Premium first' },
  { value: 'margin_desc', label: 'Margin: High to Low', sub: 'Best profit first' },
];
const STOCK_OPTS: { value: Stock; label: string; dot: string }[] = [
  { value: 'available', label: 'In Stock', dot: 'bg-success' },
  { value: 'limited', label: 'Limited', dot: 'bg-warning' },
  { value: 'out', label: 'Out of Stock', dot: 'bg-error' },
];
const MARGIN_OPTS = [
  { v: 0, l: 'Any' }, { v: 12, l: '12% +' }, { v: 14, l: '14% +' }, { v: 16, l: '16% +' },
];

export function FiltersSheet({
  open,
  value,
  brands,
  onApply,
  onClose,
}: {
  open: boolean;
  value: Filters;
  brands: string[];
  onApply: (f: Filters) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState<Filters>(value);
  useEffect(() => {
    if (open) setF(value);
  }, [open, value]);

  const toggleArr = (key: 'stock' | 'brands', v: string) =>
    setF((s) => {
      const arr = s[key] as string[];
      return { ...s, [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });
  const active = countActiveFilters(f);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      subtitle={active > 0 ? `${active} active` : 'Refine your product view'}
      size="tall"
      footer={
        <View className="flex-row gap-3">
          <Button variant="secondary" fullWidth onPress={() => setF(DEFAULT_FILTERS)}>
            Reset
          </Button>
          <Button
            fullWidth
            onPress={() => {
              onApply(f);
              onClose();
            }}
          >
            {`Apply${active > 0 ? ` (${active})` : ''}`}
          </Button>
        </View>
      }
    >
      <View className="gap-5">
        <Block title="Sort by">
          <View className="gap-2">
            {SORT.map((s) => {
              const on = f.sort === s.value;
              return (
                <Pressable
                  key={s.value}
                  onPress={() => setF((x) => ({ ...x, sort: s.value }))}
                  className={cn('flex-row items-center gap-3 rounded-lg border p-3', on ? 'border-primary bg-primary-soft' : 'border-border')}
                >
                  <View className={cn('h-4 w-4 items-center justify-center rounded-full border-2', on ? 'border-primary' : 'border-foreground-tertiary')}>
                    {on && <View className="h-2 w-2 rounded-full bg-primary" />}
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-foreground">{s.label}</Text>
                    <Text className="text-xs text-foreground-secondary">{s.sub}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Block>

        <Block title="Availability">
          <View className="flex-row flex-wrap gap-2">
            {STOCK_OPTS.map((s) => (
              <Chip
                key={s.value}
                selected={f.stock.includes(s.value)}
                onPress={() => toggleArr('stock', s.value)}
                icon={<View className={cn('h-2 w-2 rounded-full', s.dot)} />}
              >
                {s.label}
              </Chip>
            ))}
          </View>
        </Block>

        <Block title="Minimum margin">
          <View className="flex-row flex-wrap gap-2">
            {MARGIN_OPTS.map((m) => (
              <Chip key={m.v} selected={f.minMargin === m.v} onPress={() => setF((x) => ({ ...x, minMargin: m.v }))}>
                {m.l}
              </Chip>
            ))}
          </View>
        </Block>

        <Block title={`Brand${f.brands.length ? ` · ${f.brands.length}` : ''}`}>
          <View className="flex-row flex-wrap gap-2">
            {brands.map((b) => (
              <Chip key={b} selected={f.brands.includes(b)} onPress={() => toggleArr('brands', b)}>
                {b}
              </Chip>
            ))}
          </View>
        </Block>

        <Block title="Schemes">
          <View className="flex-row items-center gap-3 rounded-lg border border-border p-3">
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-medium text-foreground">Show only items with schemes</Text>
              <Text className="text-xs text-foreground-secondary">Buy 1 Get 1, flat off, %-discount, etc.</Text>
            </View>
            <Switch checked={f.schemesOnly} onCheckedChange={(v) => setF((x) => ({ ...x, schemesOnly: v }))} />
          </View>
        </Block>
      </View>
    </Sheet>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-foreground">{title}</Text>
      {children}
    </View>
  );
}
