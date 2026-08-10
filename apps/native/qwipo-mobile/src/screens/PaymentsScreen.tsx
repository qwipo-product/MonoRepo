import { View } from 'react-native';
import { Header } from '../components/Header';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

export function PaymentsScreen({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-background-subtle">
      <Header title="Payments" onBack={onBack} />
      <EmptyState
        icon="💳"
        title="No payment methods yet"
        description="Add a UPI ID or bank account to pay faster at checkout."
        action={
          <View className="w-52">
            <Button>Add payment method</Button>
          </View>
        }
      />
    </View>
  );
}
