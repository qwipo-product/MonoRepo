import { type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui';
import { shadows } from '../lib/theme';

const BUSINESS = {
  shopName: 'Lit Box',
  ownerName: 'Rajesh Kumar',
  mobile: '9876543210',
  address: 'Rai Durg, Hitech City, Hyderabad',
  gstin: '36ABCDE1234F1Z5',
};

export function BusinessDetailsScreen({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Business Details" onBack={onBack} />
      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Field label="Shop Name" required value={BUSINESS.shopName} />
        <Field label="Owner Name" value={BUSINESS.ownerName} />
        <Field label="Mobile Number" required value={BUSINESS.mobile} />
        <Field label="Address" required value={BUSINESS.address} />
        <Field label="GSTIN Number (optional)" value={BUSINESS.gstin} />
      </ScrollView>
    </View>
  );
}

function Field({ label, value, required }: { label: string; value: ReactNode; required?: boolean }) {
  return (
    <View className="rounded-lg border border-border bg-card p-3" style={shadows.sm}>
      <Text className="text-xs text-foreground-secondary">
        {label}
        {required && <Text className="text-error"> *</Text>}
      </Text>
      <Text className="mt-1 text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}
