import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ui';
import { cn } from '../lib/format';
import { shadows } from '../lib/theme';

const LANGUAGES = [
  { code: 'en', native: 'English', name: 'English' },
  { code: 'hi', native: 'हिन्दी', name: 'Hindi' },
  { code: 'te', native: 'తెలుగు', name: 'Telugu' },
  { code: 'ta', native: 'தமிழ்', name: 'Tamil' },
];

export function LanguageScreen({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState('en');
  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Language" onBack={onBack} />
      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16 }}>
        <Text className="text-sm font-semibold text-foreground">Choose your language</Text>
        <Text className="mt-0.5 text-xs text-foreground-secondary">The app will switch to your selected language immediately.</Text>

        <View className="mt-3 overflow-hidden rounded-lg border border-border bg-card" style={shadows.sm}>
          {LANGUAGES.map((l, i) => {
            const active = l.code === selected;
            return (
              <Pressable key={l.code} onPress={() => setSelected(l.code)} className={cn('flex-row items-center gap-3 px-4 py-3', i > 0 && 'border-t border-border')}>
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-medium text-foreground">{l.native}</Text>
                  <Text className="text-xs text-foreground-secondary">{l.name}</Text>
                </View>
                <View className={cn('h-5 w-5 items-center justify-center rounded-full border-2', active ? 'border-primary' : 'border-foreground-tertiary')}>
                  {active && <View className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
