import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button } from '../components/ui';
import { QwipoLogo } from '../components/BrandMark';
import { cn } from '../lib/format';
import { shadows, colors } from '../lib/theme';
import { ChevronLeft } from '../lib/icons';

export function OtpScreen({ onBack, onVerify }: { onBack: () => void; onVerify: () => void }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [secs, setSecs] = useState(23);
  const refs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secs]);

  const setAt = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '').slice(-1);
    setDigits((d) => d.map((x, j) => (j === i ? clean : x)));
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };
  const filled = digits.join('').length === 6;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        <View className="px-3 pt-3">
          <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md bg-muted">
            <ChevronLeft size={18} color={colors.foreground} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center">
          <QwipoLogo width={96} />
        </View>
      </View>

      <View className="flex-1 rounded-t-2xl border-t border-border bg-background p-6" style={shadows.barTop}>
        <Text className="text-xl font-semibold text-foreground">OTP Verification</Text>
        <Text className="mt-1 text-sm text-foreground-secondary">
          Enter the verification code we just sent on your phone number.
        </Text>

        <View className="mt-5 flex-row justify-between">
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              keyboardType="number-pad"
              maxLength={1}
              value={d}
              onChangeText={(v) => setAt(i, v)}
              className={cn(
                'h-12 w-12 rounded-md border bg-card text-center text-lg font-semibold',
                d ? 'border-primary text-foreground' : 'border-border text-foreground-secondary'
              )}
            />
          ))}
        </View>

        <Button size="lg" className="mt-5 w-full" disabled={!filled} onPress={onVerify}>
          Verify
        </Button>

        <View className="mt-4 flex-row justify-center">
          {secs > 0 ? (
            <Text className="text-sm text-foreground-secondary">
              Resend OTP in <Text className="font-semibold">{secs}s</Text>
            </Text>
          ) : (
            <Pressable onPress={() => setSecs(23)}>
              <Text className="text-sm font-semibold text-primary">Resend OTP</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
