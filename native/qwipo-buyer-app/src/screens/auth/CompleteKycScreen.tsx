import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '../../components/ui';
import { Field, BusinessTypeField } from '../../components/formbits';
import { ChevronLeft, MapPin, Check } from '../../lib/icons';
import { cn } from '../../lib/format';
import { colors } from '../../lib/theme';

const DOC_FIELDS = [
  { key: 'shopImage', label: 'Shop Image', required: true },
  { key: 'ownerId', label: 'Shop Owner Photo ID', required: true },
  { key: 'gst', label: 'GST Certificate', required: false },
  { key: 'shopReg', label: 'Shop Registration Certificate', required: false },
];

export function CompleteKycScreen({ onCancel, onRegister }: { onCancel: () => void; onRegister: () => void }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [docs, setDocs] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);

  const step2Valid = !!(docs.shopImage && docs.ownerId && agreed);
  const uploadDoc = (key: string) => setDocs((d) => ({ ...d, [key]: 'uploaded.jpg' }));

  return (
    <View className="flex-1 bg-background">
      <View className="h-14 flex-row items-center gap-3 px-3">
        <Pressable onPress={() => (step === 1 ? onCancel() : setStep(1))} className="h-9 w-9 items-center justify-center rounded-md bg-muted" accessibilityLabel="Back">
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <View>
          <Text className="text-base font-semibold text-foreground">Complete KYC</Text>
          <Text className="text-xs text-foreground-secondary">{step === 1 ? 'Basic information' : 'ID Proofs'}</Text>
        </View>
      </View>

      <View className="flex-row gap-2 px-4 py-3">
        <View className="h-1 flex-1 rounded-full bg-primary" />
        <View className={cn('h-1 flex-1 rounded-full', step === 2 ? 'bg-primary' : 'bg-muted')} />
      </View>

      <ScrollView className="flex-1 px-4 pt-1" contentContainerStyle={{ gap: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {step === 1 ? (
          <>
            <Field label="Customer Name" required>
              <Input value={name} onChangeText={setName} placeholder="Enter your name" />
            </Field>
            <Field label="Customer Email">
              <Input value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" />
            </Field>
            <BusinessTypeField value={businessType} onChange={setBusinessType} />
            <Field label="Shop Location">
              <View className="h-11 flex-row items-center rounded-md border border-border bg-card px-3">
                <Text className="flex-1 text-sm text-foreground-secondary">Fetch using GPS</Text>
                <MapPin size={18} color={colors.primary} />
              </View>
            </Field>
          </>
        ) : (
          <>
            {DOC_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} required={f.required}>
                <View className="h-11 flex-row items-center justify-between rounded-md border border-border bg-card px-3">
                  <Text className={docs[f.key] ? 'text-sm text-foreground' : 'text-sm text-foreground-secondary'}>{docs[f.key] || 'Upload here'}</Text>
                  <Pressable onPress={() => uploadDoc(f.key)}>
                    <Text className="text-sm font-medium text-primary">Upload</Text>
                  </Pressable>
                </View>
              </Field>
            ))}

            <Pressable onPress={() => setAgreed((a) => !a)} className="mt-2 flex-row items-start gap-2">
              <View className={cn('mt-0.5 h-5 w-5 items-center justify-center rounded border', agreed ? 'border-primary bg-primary' : 'border-border')}>
                {agreed && <Check size={14} color={colors.primaryForeground} />}
              </View>
              <Text className="flex-1 text-sm text-foreground-secondary">
                I have read & agree to the <Text className="font-medium text-primary underline">Terms of Use</Text> and{' '}
                <Text className="font-medium text-primary underline">Privacy Policy</Text>
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <View className="flex-row gap-3 border-t border-border px-4 pt-4 pb-5">
        {step === 1 ? (
          <>
            <Button variant="secondary" size="lg" className="flex-1" onPress={onCancel}>
              Cancel
            </Button>
            <Button size="lg" className="flex-1" onPress={() => setStep(2)}>
              Next
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" size="lg" className="flex-1" onPress={() => setStep(1)}>
              Back
            </Button>
            <Button size="lg" className="flex-1" disabled={!step2Valid} onPress={onRegister}>
              Register
            </Button>
          </>
        )}
      </View>
    </View>
  );
}
