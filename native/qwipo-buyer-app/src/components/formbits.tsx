import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Sheet } from './Sheet';
import { cn } from '../lib/format';
import { colors } from '../lib/theme';
import { ChevronDown, Check } from '../lib/icons';
import { BUSINESS_TYPES } from '../data/businessTypes';

export { AuthBrand } from './BrandMark';

/** Label (+ required asterisk) over a control. */
export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-foreground">
        {label}
        {required && <Text className="text-error"> *</Text>}
      </Text>
      {children}
    </View>
  );
}

function BtIcon({ paths, active }: { paths: string[]; active: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      {paths.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={active ? colors.primaryForeground : colors.foregroundSecondary}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}

/* Business Type control + its icon-grid bottom sheet. */
export function BusinessTypeField({ required, value, onChange }: { required?: boolean; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Field label="Business Type" required={required}>
      <Pressable onPress={() => setOpen(true)} className="h-11 flex-row items-center justify-between rounded-md border border-border bg-card px-3">
        <Text className={value ? 'text-sm text-foreground' : 'text-sm text-foreground-secondary'}>{value || 'Select Business Type'}</Text>
        <ChevronDown size={18} color={colors.foregroundSecondary} />
      </Pressable>

      <Sheet open={open} onClose={() => setOpen(false)} title="Business Type">
        <View className="flex-row flex-wrap gap-2">
          {BUSINESS_TYPES.map((bt) => {
            const active = bt.label === value;
            return (
              <Pressable
                key={bt.label}
                onPress={() => {
                  onChange(bt.label);
                  setOpen(false);
                }}
                className={cn('w-[22%] items-center gap-1.5 rounded-lg border p-1.5', active ? 'border-primary bg-primary-soft' : 'border-border bg-card')}
              >
                <View className={cn('rounded-full p-1.5', active ? 'bg-primary' : 'bg-muted')}>
                  <BtIcon paths={bt.paths} active={active} />
                </View>
                <Text className="text-center text-[10px] font-medium text-foreground" numberOfLines={2}>
                  {bt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </Field>
  );
}

export { Check };
