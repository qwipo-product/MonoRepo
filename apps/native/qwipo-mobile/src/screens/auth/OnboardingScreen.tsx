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
        className="mt-1 h-12 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
      />
    </View>
  );
}

export function OnboardingScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [city, setCity] = useState('');
  return (
    <View className="flex-1 bg-background">
      <Header title="Business details" onBack={onBack} />
      <ScrollView contentContainerClassName="p-4">
        <Text className="text-lg font-semibold text-foreground">Tell us about your store</Text>
        <Field label="Business name" value={name} onChange={setName} placeholder="Sri Venkateswara Kirana Store" />
        <Field label="Business type" value={type} onChange={setType} placeholder="Kirana / General Store" />
        <Field label="City" value={city} onChange={setCity} placeholder="Vijayawada" />
      </ScrollView>
      <View className="p-4">
        <Button fullWidth onPress={onNext}>
          Proceed
        </Button>
      </View>
    </View>
  );
}
