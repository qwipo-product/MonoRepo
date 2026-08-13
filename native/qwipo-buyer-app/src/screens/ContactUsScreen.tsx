import { Pressable, ScrollView, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui';
import { QwipoWordmark } from '../components/BrandMark';
import { colors, shadows } from '../lib/theme';
import { Clock, Mail, Phone, MapPin } from '../lib/icons';

const CONTACT = [
  { Icon: Clock, label: 'Office Timing', value: '09:00 AM to 6:00 PM · IST' },
  { Icon: Mail, label: 'Email Address', value: 'info@qwipo.com' },
  { Icon: Phone, label: 'Customer Care Number', value: '9121222836' },
];
const ADVISOR = { name: 'Vinodkumar Musku', phone: '9100466765' };

export function ContactUsScreen({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Contact Us" onBack={onBack} />
      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="items-center">
          <Text className="text-center text-sm text-foreground-secondary">If you have any query or need any further help</Text>
          <View className="mt-3">
            <QwipoWordmark height={28} />
          </View>
        </View>

        <View className="overflow-hidden rounded-lg border border-border bg-card" style={shadows.sm}>
          {CONTACT.map(({ Icon, label, value }, i) => (
            <View key={label} className={`flex-row items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Icon size={16} color={colors.foregroundSecondary} />
              </View>
              <View className="min-w-0">
                <Text className="text-xs text-foreground-secondary">{label}</Text>
                <Text className="text-sm font-medium text-foreground">{value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className="rounded-lg border border-border bg-card p-4" style={shadows.sm}>
          <Text className="text-sm font-semibold text-foreground">Your Business Advisor</Text>
          <View className="mt-2.5 flex-row items-center gap-3">
            <MapPin size={20} color={colors.foregroundSecondary} />
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-medium text-foreground">{ADVISOR.name}</Text>
              <Text className="text-xs text-foreground-secondary">{ADVISOR.phone}</Text>
            </View>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-primary active:opacity-80">
              <Phone size={16} color={colors.primaryForeground} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
