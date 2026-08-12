// ProductCard — distributor product card (RN port of @mockups/components ProductCard).
import { memo, type ReactNode } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Badge, Button, Card, Chip, PriceLabel } from './ui';
import { formatInr } from '../lib/format';

export interface PackPill {
  id: string;
  label: string;
}

export interface ProductCardProps {
  name: string;
  caseLabel?: string;
  image?: string;
  variants?: PackPill[];
  selectedVariant?: string;
  onSelectVariant?: (id: string) => void;
  seller?: string;
  delivery?: string;
  source?: 'distributor' | 'wholesaler';
  margin?: string;
  price: number;
  mrp?: number;
  priceSuffix?: string;
  qty?: number;
  onQty?: (n: number) => void;
  onAdd?: () => void;
  onDiscounts?: () => void;
  subtotal?: number;
  subtotalLabel?: string;
  footer?: ReactNode;
}

function Thumb({ image, name }: { image?: string; name: string }) {
  const isUrl = !!image && /^https?:\/\//.test(image);
  return (
    <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-muted">
      {isUrl ? (
        <Image source={{ uri: image }} resizeMode="contain" className="h-full w-full" accessibilityLabel={name} />
      ) : (
        <Text className="text-2xl">{image ?? '📦'}</Text>
      )}
    </View>
  );
}

export const ProductCard = memo(function ProductCard({
  name,
  caseLabel,
  image,
  variants,
  selectedVariant,
  onSelectVariant,
  seller,
  delivery,
  source,
  margin,
  price,
  mrp,
  priceSuffix = '/pc',
  qty = 0,
  onAdd,
  onDiscounts,
  subtotal,
  subtotalLabel = 'Total',
  footer,
}: ProductCardProps) {
  return (
    <Card className="p-3">
      <Pressable onPress={onAdd} className="flex-row items-start justify-between gap-3 active:opacity-90">
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-foreground">{name}</Text>
          {caseLabel && <Text className="mt-0.5 text-xs text-foreground-secondary">{caseLabel}</Text>}
        </View>
        <Thumb image={image} name={name} />
      </Pressable>

      {variants && variants.length > 0 && (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {variants.map((v) => (
            <Chip key={v.id} selected={v.id === selectedVariant} onPress={() => onSelectVariant?.(v.id)} className="px-2.5 py-1">
              {v.label}
            </Chip>
          ))}
        </View>
      )}

      {(seller || delivery || source) && (
        <View className="mt-2.5 gap-0.5">
          {(seller || source) && (
            <View className="flex-row items-center gap-2">
              {seller && <Text className="text-sm text-foreground">{seller}</Text>}
              {source && (
                <Badge variant={source === 'distributor' ? 'info' : 'warning'}>
                  {source === 'distributor' ? 'Distributor' : 'Wholesaler'}
                </Badge>
              )}
            </View>
          )}
          {delivery && <Text className="text-sm text-success-foreground">{delivery}</Text>}
        </View>
      )}

      <View className="mt-3 flex-row items-end justify-between gap-3">
        {margin ? <Badge variant="success">{margin}</Badge> : <View />}
        <PriceLabel price={price} mrp={mrp} suffix={priceSuffix} size="lg" />
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        {onDiscounts && (
          <Button variant="soft" className="flex-1" onPress={onDiscounts}>
            Discounts ⌄
          </Button>
        )}
        <View className={onDiscounts ? 'w-28' : 'flex-1'}>
          {qty > 0 ? (
            <Pressable onPress={onAdd} className="h-9 flex-row items-center justify-between rounded-md bg-primary-soft px-3 active:opacity-80">
              <Text className="text-lg font-medium text-primary-soft-foreground">−</Text>
              <Text className="text-sm font-semibold text-foreground">{qty}</Text>
              <Text className="text-lg font-medium text-primary-soft-foreground">+</Text>
            </Pressable>
          ) : (
            <Button className="w-full" onPress={onAdd}>
              + Add
            </Button>
          )}
        </View>
      </View>

      {subtotal != null && subtotal > 0 && (
        <View className="mt-3 flex-row items-center justify-between border-t border-border pt-2.5">
          <Text className="text-[10px] font-medium uppercase tracking-wide text-foreground-secondary">{subtotalLabel}</Text>
          <Text className="text-base font-bold text-foreground">{formatInr(subtotal)}</Text>
        </View>
      )}

      {footer && (
        <View className="mt-3 flex-row items-center justify-between border-t border-border pt-2">{footer}</View>
      )}
    </Card>
  );
});
