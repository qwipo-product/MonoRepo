import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, RotateCcw, ShoppingCart, type LucideIcon } from 'lucide-react-native';
import { lightTheme } from '../theme/tokens';
import { cn } from '../ui/cn';

export type TabId = 'home' | 'reorder' | 'cart';

const TABS: { id: TabId; label: string; Icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'reorder', label: 'Reorder', Icon: RotateCcw },
  { id: 'cart', label: 'Cart', Icon: ShoppingCart },
];

export function BottomNav({
  active,
  cartCount = 0,
  onChange,
}: {
  active: TabId;
  cartCount?: number;
  onChange: (t: TabId) => void;
}) {
  const insets = useSafeAreaInsets();
  const c = lightTheme.color;
  return (
    <View
      className="flex-row border-t border-border bg-card"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const on = active === id;
        return (
          <Pressable key={id} onPress={() => onChange(id)} className="flex-1 items-center justify-center py-2">
            <View>
              <Icon size={22} color={on ? c.brand.primary : c.text.secondary} />
              {id === 'cart' && cartCount > 0 ? (
                <View className="absolute -right-2.5 -top-1.5 h-4 min-w-4 items-center justify-center rounded-full bg-error px-1">
                  <Text className="text-[10px] font-bold text-white">{cartCount}</Text>
                </View>
              ) : null}
            </View>
            <Text className={cn('mt-1 text-[10px] font-medium', on ? 'text-primary' : 'text-foreground-secondary')}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
