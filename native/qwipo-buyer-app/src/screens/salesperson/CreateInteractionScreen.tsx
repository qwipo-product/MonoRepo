import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Input, ScreenHeader } from '../../components/ui';
import { Sheet } from '../../components/Sheet';
import { cn } from '../../lib/format';
import { colors, shadows } from '../../lib/theme';
import { ChevronDown, Camera, Check } from '../../lib/icons';
import { COMMENT_CATEGORIES, type CommentCategory } from '../../data/salesperson';

export function CreateInteractionScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [category, setCategory] = useState<CommentCategory | null>(null);
  const [comments, setComments] = useState('');
  const [photo, setPhoto] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const valid = category && comments.trim();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Interaction form" onBack={onBack} />
      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground">Comment category</Text>
          <Pressable onPress={() => setPickerOpen(true)} className="h-10 flex-row items-center justify-between rounded-md border border-border bg-card px-3">
            <Text className={category ? 'text-sm text-foreground' : 'text-sm text-foreground-secondary'}>{category ?? 'Select a category'}</Text>
            <ChevronDown size={16} color={colors.foregroundSecondary} />
          </Pressable>
        </View>

        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground">Comments</Text>
          <Input placeholder="Enter comments here" value={comments} onChangeText={setComments} />
        </View>

        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground">Shop photo</Text>
          <Pressable onPress={() => setPhoto(true)} className={cn('h-24 items-center justify-center gap-1.5 rounded-lg border border-dashed', photo ? 'border-primary bg-primary-soft' : 'border-border bg-card')}>
            {photo ? <Check size={24} color={colors.primary} /> : <Camera size={24} color={colors.foregroundSecondary} />}
            <Text className={cn('text-xs font-medium', photo ? 'text-primary' : 'text-foreground-secondary')}>{photo ? 'Photo captured' : 'Take shop photo (optional)'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View className="border-t border-border bg-card p-3" style={shadows.barTop}>
        <Button fullWidth disabled={!valid} onPress={onDone}>Submit</Button>
      </View>

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Comment category">
        <View className="gap-1">
          {COMMENT_CATEGORIES.map((c) => (
            <Pressable key={c} onPress={() => { setCategory(c); setPickerOpen(false); }} className={cn('flex-row items-center justify-between rounded-md px-3 py-2.5', category === c && 'bg-primary-soft')}>
              <Text className={cn('text-sm', category === c ? 'font-medium text-primary' : 'text-foreground')}>{c}</Text>
              {category === c && <Check size={16} color={colors.primary} />}
            </Pressable>
          ))}
        </View>
      </Sheet>
    </View>
  );
}
