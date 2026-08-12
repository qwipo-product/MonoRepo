import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, EmptyState, Input, ScreenHeader, ScrollView, SelectableCard } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { formatInrExact } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { AlertCircle, CheckCircle2 } from '../lib/icons';
import { GATEWAYS_BY_VENDOR, PAYMENT_VENDORS, type GatewayOption } from '../data/payments';

export function PaymentGatewaysScreen({
  vendorId,
  amount,
  onBack,
  onDone,
}: {
  vendorId: string;
  amount: number;
  onBack: () => void;
  onDone: () => void;
}) {
  const vendor = PAYMENT_VENDORS.find((v) => v.id === vendorId) ?? PAYMENT_VENDORS[0];
  const gateways = GATEWAYS_BY_VENDOR[vendor.id] ?? [];
  const [amountStr, setAmountStr] = useState(String(amount));
  const [selected, setSelected] = useState<string>(gateways[0]?.id ?? '');
  const [warning, setWarning] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  const gateway = gateways.find((g) => g.id === selected);
  const value = Number(amountStr);

  const pay = () => {
    const msg = validate(value, amount, gateway);
    if (msg) setWarning(msg);
    else setPaid(true);
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Payment" onBack={onBack} />
      {gateways.length === 0 ? (
        <EmptyState icon={<AlertCircle size={28} color={colors.foregroundSecondary} />} title="No Payment Options Found" description="You have no payment gateways available at this time." />
      ) : (
        <>
          <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16, gap: 16 }}>
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Enter the amount</Text>
              <Input value={amountStr} onChangeText={(t) => setAmountStr(t.replace(/[^\d]/g, ''))} keyboardType="number-pad" className="text-center text-lg font-semibold" />
              <Text className="text-xs text-foreground-secondary">Outstanding {formatInrExact(amount)} — you can pay any amount up to this.</Text>
            </View>

            <View className="gap-2">
              <Text className="text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">Pay using</Text>
              {gateways.map((g) => (
                <SelectableCard key={g.id} radio selected={selected === g.id} onPress={() => setSelected(g.id)} className="p-3">
                  <View className="pr-7">
                    <Text className="text-sm font-semibold text-foreground">{g.title}</Text>
                    {g.subtitle && <Text className="mt-0.5 text-xs text-foreground-secondary">{g.subtitle}</Text>}
                    {g.kind === 'bnpl' && (
                      <View className="mt-2 flex-row gap-4">
                        <Limit label="Available" value={g.availableLimit ?? 0} />
                        <Limit label="Current" value={g.currentLimit ?? 0} />
                      </View>
                    )}
                  </View>
                </SelectableCard>
              ))}
            </View>
          </ScrollView>

          <View className="border-t border-border bg-card p-3" style={shadows.barTop}>
            <Button fullWidth onPress={pay}>
              {`Continue · ${formatInrExact(value || 0)}`}
            </Button>
          </View>
        </>
      )}

      <Sheet open={!!warning} onClose={() => setWarning(null)} title="Check the amount" footer={<Button fullWidth onPress={() => setWarning(null)}>OK</Button>}>
        <Text className="text-sm text-foreground-secondary">{warning}</Text>
      </Sheet>

      <Sheet open={paid} onClose={onDone} title="Payment successful" footer={<Button fullWidth onPress={onDone}>Done</Button>}>
        <View className="items-center py-2">
          <CheckCircle2 size={56} color={colors.success} />
          <Text className="mt-3 text-lg font-bold text-foreground">{formatInrExact(value)}</Text>
          <Text className="mt-1 text-center text-sm text-foreground-secondary">Paid to {vendor.name} via {gateway?.title}.</Text>
        </View>
      </Sheet>
    </View>
  );
}

function Limit({ label, value }: { label: string; value: number }) {
  return (
    <View>
      <Text className="text-[11px] text-foreground-secondary">{label} limit</Text>
      <Text className="text-xs font-semibold text-foreground">{formatInrExact(value)}</Text>
    </View>
  );
}

function validate(value: number, outstanding: number, gateway?: GatewayOption): string | null {
  if (!gateway) return 'Please select a payment option.';
  if (!Number.isFinite(value) || value <= 0) return 'Please enter a valid amount.';
  if (value > outstanding) return `Amount cannot exceed the outstanding ${formatInrExact(outstanding)}.`;
  if (gateway.kind === 'bnpl') {
    const avail = gateway.availableLimit ?? 0;
    if (avail === 0) return `Insufficient ${gateway.title} available limit.`;
    if (value > avail) return `Enter an amount within your ${formatInrExact(avail)} available limit.`;
  }
  if (value < gateway.minAmount) return `Please enter a minimum amount of ${formatInrExact(gateway.minAmount)}.`;
  return null;
}
