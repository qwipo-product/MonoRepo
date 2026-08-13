import { ScrollView, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui';
import { QwipoWordmark } from '../components/BrandMark';
import { colors, shadows } from '../lib/theme';
import { Phone } from '../lib/icons';

const TERMS = [
  { title: '1. Acceptance', body: 'By using the Qwipo platform you agree to these terms and our privacy policy.' },
  { title: '2. Orders & Delivery', body: 'Orders are subject to seller minimum order value and stock. Delivery windows are indicative.' },
  { title: '3. Pricing', body: 'Prices are set by sellers and may change without notice. Taxes apply as per GST rules.' },
  { title: '4. Cancellations', body: 'Orders may be cancelled before the seller confirms dispatch. Refunds follow our policy.' },
  { title: '5. Liability', body: 'Qwipo connects buyers and sellers and is not liable for seller-side quality disputes.' },
];
const SUPPORT_PHONE = '+91 9121222836';

export function TermsScreen({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Terms & Conditions" onBack={onBack} />
      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16, gap: 12 }}>
        <QwipoWordmark height={28} />
        {TERMS.map((t) => (
          <View key={t.title} className="rounded-lg border border-border bg-card p-4" style={shadows.sm}>
            <Text className="text-sm font-semibold text-foreground">{t.title}</Text>
            <Text className="mt-1 text-xs leading-relaxed text-foreground-secondary">{t.body}</Text>
          </View>
        ))}
        <View className="flex-row items-center gap-2.5 rounded-lg border border-border bg-card p-4" style={shadows.sm}>
          <Phone size={16} color={colors.foregroundSecondary} />
          <Text className="text-sm font-medium text-foreground">{SUPPORT_PHONE}</Text>
        </View>
        <Text className="pt-1 text-center text-[11px] text-foreground-tertiary">© Qwipo · B2B Commerce</Text>
      </ScrollView>
    </View>
  );
}
