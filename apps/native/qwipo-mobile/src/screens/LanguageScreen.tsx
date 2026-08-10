import { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Header } from '../components/Header';
import { LANGUAGES } from '../data/account';
import { cn } from '../ui/cn';

export function LanguageScreen({ onBack }: { onBack: () => void }) {
  const [sel, setSel] = useState('en');
  return (
    <View className="flex-1 bg-background-subtle">
      <Header title="Language" onBack={onBack} />
      <ScrollView contentContainerClassName="p-3">
        <View className="overflow-hidden rounded-lg border border-border bg-card">
          {LANGUAGES.map((l, i) => {
            const on = l.code === sel;
            return (
              <Pressable
                key={l.code}
                onPress={() => setSel(l.code)}
                className={cn('flex-row items-center gap-3 px-4 py-3', i > 0 && 'border-t border-border')}
              >
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">{l.label}</Text>
                  <Text className="text-xs text-foreground-secondary">{l.native}</Text>
                </View>
                <View className={cn('h-5 w-5 items-center justify-center rounded-full border-2', on ? 'border-primary' : 'border-border')}>
                  {on ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
