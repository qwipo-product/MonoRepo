import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Header } from '../../components/Header';
import { Button } from '../../ui/Button';

export function LoginScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [phone, setPhone] = useState('');
  return (
    <View className="flex-1 bg-background">
      <Header title="Login" onBack={onBack} />
      <View className="flex-1 p-4">
        <Text className="text-lg font-semibold text-foreground">Enter your mobile number</Text>
        <Text className="mt-1 text-sm text-foreground-secondary">We’ll send you a one-time password.</Text>
        <View className="mt-4 flex-row items-center gap-2 rounded-lg border border-border bg-card px-3">
          <Text className="text-sm font-medium text-foreground">+91</Text>
          <TextInput
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
            keyboardType="number-pad"
            placeholder="98765 43210"
            placeholderTextColor="#717182"
            className="h-12 flex-1 text-base text-foreground"
          />
        </View>
      </View>
      <View className="p-4">
        <Button fullWidth disabled={phone.length < 10} onPress={onNext}>
          Continue
        </Button>
      </View>
    </View>
  );
}
