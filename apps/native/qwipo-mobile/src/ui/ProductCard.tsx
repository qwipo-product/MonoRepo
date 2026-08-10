import { View, Text } from 'react-native';
import type { ReactNode } from 'react';
import { Card } from './Card';
import { Chip } from './Chip';
import { Badge } from './Badge';
import { Button } from './Button';
import { QtyStepper } from './QtyStepper';
import { PriceLabel } from './PriceLabel';
import type { Source, Variant } from '../data/products';

export function ProductCard({
  name,
  caseLabel,
  image,
  variants,
  selectedVariant,
  onSelectVariant,
  seller,
  source,
  delivery,
  margin,
  price,
  mrp,
  qty = 0,
  onQty,
  onAdd,
  footer,
}: {
  name: string;
  caseLabel?: string;
  image?: string;
  variants?: Variant[];
  selectedVariant?: string;
  onSelectVariant?: (id: string) => void;
  seller?: string;
  source?: Source;
  delivery?: string;
  margin?: string;
  price: number;
  mrp?: number;
  qty?: number;
  onQty?: (n: number) => void;
  onAdd?: () => void;
  footer?: ReactNode;
}) {
  return (
    <Card className="p-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{name}</Text>
          {caseLabel ? <Text className="mt-0.5 text-xs text-foreground-secondary">{caseLabel}</Text> : null}
        </View>
        <View className="h-16 w-16 items-center justify-center rounded-lg bg-muted">
          <Text className="text-2xl">{image ?? '📦'}</Text>
        </View>
      </View>

      {variants && variants.length > 0 ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {variants.map((v) => (
            <Chip key={v.id} selected={v.id === selectedVariant} onPress={() => onSelectVariant?.(v.id)}>
              {v.label}
            </Chip>
          ))}
        </View>
      ) : null}

      {seller || source ? (
        <View className="mt-2.5 flex-row items-center gap-2">
          {seller ? <Text className="text-sm text-foreground">{seller}</Text> : null}
          {source ? (
            <Badge variant={source === 'distributor' ? 'info' : 'warning'}>
              {source === 'distributor' ? 'Distributor' : 'Wholesaler'}
            </Badge>
          ) : null}
        </View>
      ) : null}
      {delivery ? <Text className="mt-1 text-sm text-success-foreground">{delivery}</Text> : null}

      <View className="mt-3 flex-row items-end justify-between">
        {margin ? <Badge variant="success">{margin}</Badge> : <View />}
        <PriceLabel price={price} mrp={mrp} suffix="/pc" size="lg" align="end" />
      </View>

      <View className="mt-3 flex-row items-center justify-end">
        {qty > 0 && onQty ? (
          <QtyStepper value={qty} onChange={onQty} tone="soft" />
        ) : (
          <View className="w-28">
            <Button size="sm" onPress={onAdd}>
              + Add
            </Button>
          </View>
        )}
      </View>

      {footer ? (
        <View className="mt-3 flex-row items-center justify-between border-t border-border pt-2">{footer}</View>
      ) : null}
    </Card>
  );
}
