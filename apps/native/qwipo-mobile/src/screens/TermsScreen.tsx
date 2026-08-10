import { ScrollView, View, Text } from 'react-native';
import { Header } from '../components/Header';

const SECTIONS = [
  { h: '1. Acceptance', b: 'By creating an account or placing an order on Qwipo, you agree to these terms.' },
  { h: '2. Orders', b: 'All orders are subject to seller confirmation and each seller’s minimum order value.' },
  { h: '3. Pricing & payments', b: 'Prices are inclusive of applicable taxes unless stated otherwise at checkout.' },
  { h: '4. Delivery', b: 'Delivery timelines are estimates and may depend on your beat day and seller location.' },
  { h: '5. Returns', b: 'Damaged or incorrect items can be reported within 24 hours of delivery for resolution.' },
  { h: '6. Contact', b: 'For any questions, reach support@qwipo.com or +91 1800 123 4567.' },
];

export function TermsScreen({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-background-subtle">
      <Header title="Terms & Conditions" onBack={onBack} />
      <ScrollView contentContainerClassName="gap-4 p-4">
        {SECTIONS.map((s) => (
          <View key={s.h}>
            <Text className="text-sm font-semibold text-foreground">{s.h}</Text>
            <Text className="mt-1 text-sm text-foreground-secondary">{s.b}</Text>
          </View>
        ))}
        <Text className="mt-2 text-xs text-foreground-tertiary">Last updated 9 August 2026 · Qwipo Technologies</Text>
      </ScrollView>
    </View>
  );
}
