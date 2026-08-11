import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Switch } from '../components/ui';
import { QwipoWordmark } from '../components/BrandMark';
import { colors, shadows } from '../lib/theme';
import type { ScreenId } from '../nav/screenIndex';
import {
  ChevronRight, Briefcase, MapPin, CreditCard, Users, Bell, LifeBuoy, FileText, LogOut, BadgeCheck, Moon,
} from '../lib/icons';

const PROFILE = { name: 'Rajesh Kumar', phone: '9876543210', business: 'Sri Venkateswara Kirana Store' };

type Item = { icon: typeof Briefcase; label: string; to: ScreenId; badge?: number };

const ACCOUNT: Item[] = [
  { icon: Briefcase, label: 'My Orders', to: 'my-orders' },
  { icon: MapPin, label: 'Saved Addresses', to: 'sub:addresses' },
  { icon: CreditCard, label: 'Payments', to: 'sub:payment' },
  { icon: Users, label: 'Credit Partners', to: 'sub:credit' },
];
const PREFERENCES: Item[] = [{ icon: Bell, label: 'Notifications', to: 'notifications', badge: 6 }];
const SUPPORT: Item[] = [
  { icon: LifeBuoy, label: 'Contact Us', to: 'sub:help' },
  { icon: FileText, label: 'Terms and Conditions', to: 'sub:terms' },
];

export function MyAccountScreen({ onNavigate, onSignOut }: { onNavigate: (id: ScreenId) => void; onSignOut: () => void }) {
  const [dark, setDark] = useState(false);
  const initials = PROFILE.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <View className="flex-1 bg-background">
      <View className="h-14 flex-row items-center border-b border-border bg-card px-4" style={shadows.sm}>
        <QwipoWordmark height={24} />
      </View>

      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Pressable onPress={() => onNavigate('sub:business-details')} className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-4" style={shadows.sm}>
          <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
            <Text className="text-sm font-bold text-primary">{initials}</Text>
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-1">
              <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{PROFILE.name}</Text>
              <BadgeCheck size={16} color={colors.primary} />
            </View>
            <Text className="text-xs text-foreground-secondary" numberOfLines={1}>{PROFILE.phone}</Text>
            <Text className="text-xs text-foreground-secondary" numberOfLines={1}>{PROFILE.business}</Text>
          </View>
          <ChevronRight size={20} color={colors.foregroundSecondary} />
        </Pressable>

        <MenuGroup title="Account" items={ACCOUNT} onNavigate={onNavigate} />
        <MenuGroup title="Preferences" items={PREFERENCES} onNavigate={onNavigate} />
        <MenuGroup title="Support" items={SUPPORT} onNavigate={onNavigate} />

        <View className="gap-1.5">
          <Text className="px-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">Appearance</Text>
          <View className="flex-row items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5" style={shadows.sm}>
            <Moon size={20} color={colors.foregroundSecondary} />
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-medium text-foreground">Dark mode</Text>
              <Text className="text-xs text-foreground-secondary">Switch the whole app theme</Text>
            </View>
            <Switch checked={dark} onCheckedChange={setDark} />
          </View>
        </View>

        <Pressable onPress={onSignOut} className="flex-row items-center gap-2 rounded-lg border border-border bg-card px-4 py-3.5" style={shadows.sm}>
          <LogOut size={16} color={colors.error} />
          <Text className="text-sm font-semibold text-error">Logout</Text>
        </Pressable>

        <Text className="pb-2 text-center text-[11px] text-foreground-tertiary">Qwipo · v2.0.0</Text>
      </ScrollView>
    </View>
  );
}

function MenuGroup({ title, items, onNavigate }: { title: string; items: Item[]; onNavigate: (id: ScreenId) => void }) {
  return (
    <View className="gap-1.5">
      <Text className="px-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">{title}</Text>
      <View className="overflow-hidden rounded-lg border border-border bg-card" style={shadows.sm}>
        {items.map(({ icon: Icon, label, to, badge }, i) => (
          <Pressable key={label} onPress={() => onNavigate(to)} className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-border' : ''}`}>
            <Icon size={20} color={colors.foregroundSecondary} />
            <Text className="flex-1 text-sm font-medium text-foreground">{label}</Text>
            {badge ? (
              <View className="h-5 min-w-5 items-center justify-center rounded-full bg-error px-1">
                <Text className="text-[11px] font-semibold text-white">{badge}</Text>
              </View>
            ) : null}
            <ChevronRight size={20} color={colors.foregroundSecondary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
