import { View } from 'react-native';
import { ScreenHeader, EmptyState } from '../components/ui';

/* Temporary stand-in for screens not yet ported in this phase. */
export function PlaceholderScreen({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={title} onBack={onBack} />
      <EmptyState icon="🚧" title={title} description="This screen is coming in a later phase." />
    </View>
  );
}
