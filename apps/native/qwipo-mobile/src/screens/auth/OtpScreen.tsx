import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Header } from '../../components/Header';
import { Button } from '../../ui/Button';
import { cn } from '../../ui/cn';

export function OtpScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [otp, setOtp] = useState('');
  return (
    <View className="flex-1 bg-background">
      <Header title="Verify OTP" onBack={onBack} />
      <View className="flex-1 p-4">
        <Text className="text-lg font-semibold text-foreground">Enter the 4-digit code</Text>
        <Text className="mt-1 text-sm text-foreground-secondary">Sent to +91 98765 43210</Text>

        <View className="mt-4">
          <View className="flex-row gap-3">
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                className={cn('h-14 w-14 items-center justify-center rounded-lg border bg-card', otp.length === i ? 'border-primary' : 'border-border')}
              >
                <Text className="text-xl font-bold text-foreground">{otp[i] ?? ''}</Text>
              </View>
            ))}
          </View>
          <TextInput
            value={otp}
            onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 4))}
            keyboardType="number-pad"
            autoFocus
            className="absolute left-0 top-0 h-14 w-full opacity-0"
          />
        </View>

        <Text className="mt-4 text-sm text-primary">Resend code</Text>
      </View>
      <View className="p-4">
        <Button fullWidth disabled={otp.length < 4} onPress={onNext}>
          Verify
        </Button>
      </View>
    </View>
  );
}
