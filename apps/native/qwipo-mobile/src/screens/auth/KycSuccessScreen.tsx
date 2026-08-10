import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { Button } from '../../ui/Button';

export function KycSuccessScreen({ onDone }: { onDone: () => void }) {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-success-subtle">
          <Check size={40} color="#059669" />
        </View>
        <Text className="mt-4 text-2xl font-bold text-foreground">You’re all set!</Text>
        <Text className="mt-1 text-center text-sm text-foreground-secondary">
          Your store is verified. Start ordering at the best wholesale rates.
        </Text>
      </View>
      <View className="px-4 pb-2">
        <Button fullWidth onPress={onDone}>
          Start ordering
        </Button>
      </View>
    </SafeAreaView>
  );
}
