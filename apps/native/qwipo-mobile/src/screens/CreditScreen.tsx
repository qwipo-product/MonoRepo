import { View } from 'react-native';
import { Header } from '../components/Header';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

export function CreditScreen({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-background-subtle">
      <Header title="Credit Partners" onBack={onBack} />
      <EmptyState
        icon="🏦"
        title="No credit lines yet"
        description="Apply for pay-later credit from our partners to stock up without upfront cash."
        action={
          <View className="w-52">
            <Button>Explore credit</Button>
          </View>
        }
      />
    </View>
  );
}
