import { Pressable, Text, View } from 'react-native';
import { Home, RotateCcw, ShoppingCart, User } from '../lib/icons';
import { colors } from '../lib/theme';
import type { ScreenId } from '../nav/screenIndex';
import { cn } from '../lib/format';

const TABS: { id: ScreenId; label: string; Icon: typeof Home }[] = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'reorder', label: 'Reorder', Icon: RotateCcw },
  { id: 'cart', label: 'Cart', Icon: ShoppingCart },
  { id: 'profile', label: 'Account', Icon: User },
];

export function BottomNav({ active, cartCount = 0, onNavigate }: { active: ScreenId; cartCount?: number; onNavigate: (id: ScreenId) => void }) {
  return (
    <View className="flex-row border-t border-border bg-card">
      {TABS.map(({ id, label, Icon }) => {
        const on = active === id;
        return (
          <Pressable key={id} onPress={() => onNavigate(id)} className="flex-1 items-center gap-0.5 py-2 active:opacity-70">
            <View>
              <Icon size={22} color={on ? colors.primary : colors.foregroundSecondary} />
              {id === 'cart' && cartCount > 0 && (
                <View className="absolute -right-2.5 -top-1.5 h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1">
                  <Text className="text-[10px] font-bold text-primary-foreground">{cartCount}</Text>
                </View>
              )}
            </View>
            <Text className={cn('text-[11px]', on ? 'font-semibold text-primary' : 'text-foreground-secondary')}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
