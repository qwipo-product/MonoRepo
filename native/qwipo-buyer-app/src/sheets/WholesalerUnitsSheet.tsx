import { useState } from 'react';
import { Text, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Button, Chip } from '../components/ui';
import { PackTierRow } from '../components/PackTierRow';
import { VendorPicker } from '../components/VendorPicker';
import { formatInr } from '../lib/format';
import { colors } from '../lib/theme';
import { Store } from '../lib/icons';
import { packTiers } from '../data/products';
import { cheapestVendorId, type WholesalerProduct, type WholesalerVendor } from '../data/wholesaler';

/* Wholesaler selling-units sheet — the Add-to-Cart sheet for the multi-vendor
   model: vendor picker in the header, pack tiers priced against that vendor. */
export function WholesalerUnitsSheet({
  product,
  vendor,
  cartTotal,
  onAdd,
  onContinue,
  onClose,
}: {
  product: WholesalerProduct | null;
  vendor: WholesalerVendor | null;
  cartTotal: number;
  onAdd: (pcs: number) => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  const [variant, setVariant] = useState('');
  const [vendorId, setVendorId] = useState(vendor?.id ?? '');
  if (!product || !vendor) return <Sheet open={false} onClose={onClose} />;

  const tiers = packTiers(product.caseSize);
  const activeVariant = variant || product.variants[0].id;
  const sel = product.vendors.find((v) => v.id === vendorId) ?? vendor;

  return (
    <Sheet
      open
      onClose={onClose}
      icon={<Store size={18} color={colors.primary} />}
      title="Add to Cart"
      subtitle="Select the quantity to add to your cart"
      footer={
        <View className="flex-row items-center justify-between gap-3">
          <View>
            <Text className="text-[10px] font-medium uppercase tracking-wide text-foreground-secondary">Total cart value</Text>
            <Text className="text-lg font-bold text-foreground">{formatInr(cartTotal)}</Text>
          </View>
          <Button className="px-8" onPress={onContinue}>
            Continue
          </Button>
        </View>
      }
    >
      <View className="flex-row items-center gap-3">
        <View className="h-16 w-16 items-center justify-center rounded-lg bg-card" style={{ borderWidth: 2, borderColor: 'rgba(217,119,6,0.7)' }}>
          <Text className="text-2xl">{product.image}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-foreground">{product.name}</Text>
          <View className="mt-1.5 flex-row flex-wrap gap-2">
            {product.variants.map((v) => (
              <Chip key={v.id} selected={v.id === activeVariant} onPress={() => setVariant(v.id)} className="px-2.5 py-1">
                {v.label}
              </Chip>
            ))}
          </View>
        </View>
      </View>

      <View className="mt-4">
        <VendorPicker vendors={product.vendors} value={sel.id} onChange={setVendorId} cheapestId={cheapestVendorId(product)} />
      </View>

      <View className="mt-4 gap-2.5">
        {tiers.map((t) => (
          <PackTierRow key={t.id} label={t.label} pcs={t.pcs} unitPrice={sel.price} onDelta={onAdd} />
        ))}
      </View>
    </Sheet>
  );
}
