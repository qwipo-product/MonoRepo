import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import { Check } from '../lib/icons';
import { colors } from '../lib/theme';

/* Order Confirmation — success state after Place Order. */
export function OrderConfirmationScreen({ onBackToHome }: { onBackToHome: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <View className="h-28 w-28 items-center justify-center rounded-full bg-success/15">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-success">
            <Check size={52} strokeWidth={2.6} color={colors.white} />
          </View>
        </View>
        <Text className="mt-6 text-2xl font-bold text-foreground">Order Confirmation</Text>
        <Text className="mt-2 text-center text-sm text-foreground-secondary">Your order has been placed successfully!</Text>
      </View>
      <View className="p-4">
        <Button size="lg" fullWidth onPress={onBackToHome}>
          Back to home
        </Button>
      </View>
    </View>
  );
}
