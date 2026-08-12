import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button } from '../components/ui';
import { AuthBrand } from '../components/BrandMark';
import { shadows } from '../lib/theme';

export function LoginScreen({ onNext }: { onNext: (phone: string) => void }) {
  const [phone, setPhone] = useState('');
  const valid = /^\d{10}$/.test(phone);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <AuthBrand />
      </View>

      <View className="flex-1 rounded-t-2xl border-t border-border bg-background p-6 pb-8" style={shadows.barTop}>
        <Text className="text-xl font-semibold text-foreground">Login</Text>
        <Text className="mt-1 text-sm text-foreground-secondary">Please enter your phone number</Text>

        <View className="mt-5 h-12 flex-row items-center rounded-md border border-border bg-card px-3">
          <Text className="text-sm font-medium text-foreground">+91</Text>
          <View className="mx-3 h-6 w-px bg-border" />
          <TextInput
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/\D/g, ''))}
            placeholder="Phone number"
            placeholderTextColor="#717182"
            className="h-full flex-1 text-sm text-foreground"
          />
        </View>

        <Button size="lg" className="mt-5 w-full" disabled={!valid} onPress={() => onNext(phone)}>
          Get OTP
        </Button>

        <Text className="mt-auto pt-5 text-center text-xs text-foreground-secondary">
          By continuing, you agree to our{' '}
          <Text className="font-medium text-primary underline">Terms of Service</Text> and{' '}
          <Text className="font-medium text-primary underline">Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}
