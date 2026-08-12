import { useState, type ComponentType, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/ui';
import { formatInr } from '../lib/format';
import { colors } from '../lib/theme';
import { AlertTriangle, ChevronDown, MapPin, PackageIcon, Plus, ShoppingCart, Store, Trash2, Scale } from '../lib/icons';
import { buildCart } from '../data/cart';

const DELETABLE = new Set(['unavailable', 'seller', 'location']);
const kg = (n: number) => `${Number(n.toFixed(2))} kg`;

type IconType = ComponentType<{ size?: number; color?: string }>;

const CART = buildCart();
const MOV_FAILS = CART.sellers.filter((s) => s.status === 'below').map((s) => ({ seller: s.name, balance: s.unlockRemaining, mov: s.mov, deliveryBy: s.windows[0] ?? '—' }));
const MOW_FAILS = CART.sellers.filter((s) => s.belowWeight).map((s) => ({ seller: s.name, weight: s.weight, mow: s.mow, weightRemaining: s.weightRemaining, deliveryBy: s.windows[0] ?? '—' }));

const SECTIONS: { key: string; icon: IconType; label: string; rows: { title: string; note: string }[] }[] = [
  { key: 'stock', icon: PackageIcon, label: 'Stock Adjustments', rows: [
    { title: 'Freedom Sunflower Oil 1L', note: 'Quantity reduced from 12 to 8 — limited stock' },
    { title: 'Aashirvaad Atta 5kg', note: 'Quantity reduced from 8 to 6 — limited stock' },
  ] },
  { key: 'unavailable', icon: MapPin, label: 'Unavailable Items', rows: [{ title: 'Mysore Sandal Soap', note: 'Out of stock — will be removed at checkout' }] },
  { key: 'seller', icon: Store, label: 'Seller unavailable', rows: [
    { title: 'Omkar Enterprises', note: 'Not accepting orders today' },
    { title: 'Karnataka Soaps & Detergents', note: 'Temporarily closed' },
  ] },
  { key: 'location', icon: MapPin, label: 'Location not serviceable', rows: [
    { title: 'Fortune Besan 1kg', note: "Doesn't deliver to 560001" },
    { title: 'Maggi Noodles', note: "Doesn't deliver to 560001" },
  ] },
];

export function CartAlertsSheet({ open, onClose, onProceed }: { open: boolean; onClose: () => void; onProceed: () => void }) {
  const [sections, setSections] = useState(SECTIONS);
  const removeRow = (key: string, title: string) =>
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, rows: s.rows.filter((r) => r.title !== title) } : s)));
  const visible = sections.filter((s) => s.rows.length > 0);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      icon={<AlertTriangle size={18} color={colors.warning} />}
      title="Alerts"
      subtitle="Please review the following alerts before proceeding"
      size="tall"
      footer={
        <Button fullWidth onPress={onProceed}>
          Proceed Anyway
        </Button>
      }
    >
      <View className="gap-3">
        {MOV_FAILS.length > 0 && (
          <AlertGroup icon={ShoppingCart} title={`MOV Fail (${MOV_FAILS.length} ${MOV_FAILS.length === 1 ? 'Seller' : 'Sellers'})`} defaultOpen>
            <View className="gap-2">
              {MOV_FAILS.map((f) => (
                <View key={f.seller} className="rounded-lg bg-muted p-3">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm font-semibold text-foreground">{f.seller}</Text>
                      <Text className="mt-1 text-xs text-foreground-secondary">Balance to Order: <Text className="font-semibold text-foreground">{formatInr(f.balance)}</Text></Text>
                      <Text className="text-xs text-foreground-secondary">Delivery By: {f.deliveryBy}</Text>
                    </View>
                    <View className="items-end gap-2">
                      <Text className="text-xs text-foreground-secondary">MOV: <Text className="font-semibold text-foreground">{formatInr(f.mov)}</Text></Text>
                      <Button variant="secondary" size="sm" onPress={onClose}>
                        <Plus size={14} color={colors.foreground} />
                        <Text className="text-xs font-bold text-foreground">Add items</Text>
                      </Button>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </AlertGroup>
        )}

        {MOW_FAILS.length > 0 && (
          <AlertGroup icon={Scale} title={`MOW Fail (${MOW_FAILS.length} ${MOW_FAILS.length === 1 ? 'Seller' : 'Sellers'})`} defaultOpen>
            <View className="gap-2">
              {MOW_FAILS.map((f) => (
                <View key={f.seller} className="rounded-lg bg-muted p-3">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm font-semibold text-foreground">{f.seller}</Text>
                      <Text className="mt-1 text-xs text-foreground-secondary">Weight to Add: <Text className="font-semibold text-foreground">{kg(f.weightRemaining)}</Text></Text>
                      <Text className="text-xs text-foreground-secondary">Delivery By: {f.deliveryBy}</Text>
                    </View>
                    <View className="items-end gap-2">
                      <Text className="text-xs text-foreground-secondary">MOW: <Text className="font-semibold text-foreground">{kg(f.mow)}</Text></Text>
                      <Button variant="secondary" size="sm" onPress={onClose}>
                        <Plus size={14} color={colors.foreground} />
                        <Text className="text-xs font-bold text-foreground">Add items</Text>
                      </Button>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </AlertGroup>
        )}

        {visible.map((s) => {
          const deletable = DELETABLE.has(s.key);
          return (
            <AlertGroup key={s.key} icon={s.icon} title={`${s.label} (${s.rows.length})`}>
              <View className="gap-2.5">
                {s.rows.map((r) => (
                  <View key={r.title} className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm font-medium text-foreground">{r.title}</Text>
                      <Text className="text-xs text-foreground-secondary">{r.note}</Text>
                    </View>
                    {deletable && (
                      <Pressable onPress={() => removeRow(s.key, r.title)} className="h-8 w-8 items-center justify-center rounded-md active:bg-error-subtle">
                        <Trash2 size={15} color={colors.error} />
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            </AlertGroup>
          );
        })}
      </View>
    </Sheet>
  );
}

function AlertGroup({ icon: Icon, title, defaultOpen, children }: { icon: IconType; title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <View className="overflow-hidden rounded-lg border border-border bg-card">
      <Pressable onPress={() => setOpen((o) => !o)} className="flex-row items-center gap-3 p-3">
        <Icon size={20} color={colors.foregroundSecondary} />
        <Text className="flex-1 text-sm font-semibold text-foreground">{title}</Text>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={16} color={colors.foregroundSecondary} />
        </View>
      </Pressable>
      {open && <View className="border-t border-border p-3">{children}</View>}
    </View>
  );
}
