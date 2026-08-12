import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '../../components/ui';
import { Field, BusinessTypeField } from '../../components/formbits';
import { MapPin, ChevronLeft } from '../../lib/icons';
import { colors } from '../../lib/theme';
import { img } from '../../lib/images';

export function OnboardingScreen({ onBack, onProceed }: { onBack: () => void; onProceed: () => void }) {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');

  useEffect(() => {
    setLocation('Rai Durg, Hitech City, Hyderabad');
  }, []);

  const valid = !!(location.trim() && businessName.trim() && businessType);

  return (
    <View className="flex-1 bg-background">
      <View className="h-14 flex-row items-center gap-3 px-3">
        <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md bg-muted" accessibilityLabel="Back">
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground">On Boarding</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-2" contentContainerStyle={{ gap: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Field label="Shop Location" required>
          <View className="h-11 flex-row items-center rounded-md border border-border bg-card px-3">
            <Input value={location} onChangeText={setLocation} placeholder="Fetch using GPS" className="h-full flex-1 border-0 bg-transparent px-0" />
            <Pressable onPress={() => setLocation('Rai Durg, Hitech City, Hyderabad')} accessibilityLabel="Use GPS">
              <MapPin size={18} color={colors.primary} />
            </Pressable>
          </View>
        </Field>

        <Field label="Business Name" required>
          <Input value={businessName} onChangeText={setBusinessName} placeholder="Enter Business name" />
        </Field>

        <BusinessTypeField required value={businessType} onChange={setBusinessType} />

        <View className="h-48 items-center justify-center rounded-lg">
          {img('/onboarding-illustration.png') ? (
            <Image source={img('/onboarding-illustration.png')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          ) : (
            <Text className="text-5xl">🏪</Text>
          )}
        </View>
      </ScrollView>

      <View className="border-t border-border px-4 pt-4 pb-5">
        <Button size="lg" fullWidth disabled={!valid} onPress={onProceed}>
          Proceed
        </Button>
      </View>
    </View>
  );
}
