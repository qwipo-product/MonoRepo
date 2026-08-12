import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui';
import { Check } from '../../lib/icons';
import { colors } from '../../lib/theme';

export function KycSuccessScreen({ onPlaceOrder }: { onPlaceOrder: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-success">
          <Check size={40} strokeWidth={3} color={colors.white} />
        </View>
        <Text className="mt-5 text-2xl font-bold text-foreground">Congratulations! 🎉</Text>
        <Text className="mt-2 text-center text-sm leading-relaxed text-foreground-secondary">
          Your KYC is confirmed{'\n'}You are all set and you're now eligible to place orders seamlessly on our app{'\n'}Start shopping now!
        </Text>
      </View>

      <View className="gap-3 border-t border-border p-4">
        <Button variant="secondary" fullWidth>
          Call Customer Support
        </Button>
        <Button fullWidth onPress={onPlaceOrder}>
          Place Order
        </Button>
      </View>
    </View>
  );
}
