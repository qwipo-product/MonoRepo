import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../ui/Button';

export function SplashScreen({ onNext }: { onNext: () => void }) {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-primary">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-5xl font-bold text-primary-foreground">qwipo</Text>
        <Text className="mt-3 text-center text-sm text-primary-foreground">
          B2B ordering for kirana stores — best margins, delivered on your beat day.
        </Text>
      </View>
      <View className="px-6 pb-4">
        <Button variant="secondary" fullWidth onPress={onNext}>
          Get started
        </Button>
      </View>
    </SafeAreaView>
  );
}
