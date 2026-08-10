import { ScrollView, View, Text } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../ui/Card';
import { BUSINESS } from '../data/account';

const FIELDS: { label: string; value: string }[] = [
  { label: 'Business name', value: BUSINESS.name },
  { label: 'Owner', value: BUSINESS.owner },
  { label: 'Business type', value: BUSINESS.type },
  { label: 'GSTIN', value: BUSINESS.gstin },
  { label: 'Phone', value: BUSINESS.phone },
  { label: 'Address', value: BUSINESS.address },
];

export function BusinessDetailsScreen({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-background-subtle">
      <Header title="Business Details" onBack={onBack} />
      <ScrollView contentContainerClassName="p-3">
        <Card className="p-4">
          {FIELDS.map((f, i) => (
            <View key={f.label} className={i > 0 ? 'mt-3 border-t border-border pt-3' : ''}>
              <Text className="text-xs text-foreground-secondary">{f.label}</Text>
              <Text className="mt-0.5 text-sm font-medium text-foreground">{f.value}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}
