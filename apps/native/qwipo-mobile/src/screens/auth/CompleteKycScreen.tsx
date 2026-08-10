import { useState } from 'react';
import { ScrollView, View, Text, TextInput } from 'react-native';
import { Header } from '../../components/Header';
import { Button } from '../../ui/Button';

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View className="mt-4">
      <Text className="text-xs font-medium text-foreground-secondary">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#717182"
        autoCapitalize="characters"
        className="mt-1 h-12 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
      />
    </View>
  );
}

export function CompleteKycScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  return (
    <View className="flex-1 bg-background">
      <Header title="Complete KYC" onBack={onBack} />
      <ScrollView contentContainerClassName="p-4">
        <Text className="text-lg font-semibold text-foreground">Verify your business</Text>
        <Text className="mt-1 text-sm text-foreground-secondary">Required to unlock distributor pricing and credit.</Text>
        <Field label="GSTIN" value={gstin} onChange={setGstin} placeholder="36ABCDE1234F1Z5" />
        <Field label="PAN" value={pan} onChange={setPan} placeholder="ABCDE1234F" />
      </ScrollView>
      <View className="p-4">
        <Button fullWidth onPress={onNext}>
          Register
        </Button>
      </View>
    </View>
  );
}
