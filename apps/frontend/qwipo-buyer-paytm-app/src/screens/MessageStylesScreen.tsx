/* Message Styles — the reference sheet. Every feedback pattern in the app on
   one screen, so copy and treatment can be agreed once instead of per screen.

   The rule this page encodes:
     • FieldError    — belongs to one input, sits under it
     • InlineMessage — blocks or explains the screen, stays until fixed
     • Toast         — confirms something that already happened, auto-dismisses */

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button, FieldError, InlineMessage, Input, Toast } from '@mockups/ui';

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-foreground-secondary">{note}</p>
      </div>
      {children}
    </section>
  );
}

export function MessageStylesScreen({ onBack }: { onBack: () => void }) {
  const [toast, setToast] = useState<'success' | 'error' | 'info' | null>(null);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight">Message styles</h1>
          <p className="text-xs text-foreground-secondary">Reference — not a real screen</p>
        </div>
      </header>

      <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto bg-background-subtle p-4">
        <Section
          title="Field errors"
          note="One input, one message. The field border turns red at the same time."
        >
          <div className="space-y-3 rounded-lg border border-border bg-card p-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Mobile number</label>
              <Input defaultValue="98765" aria-invalid inputMode="numeric" />
              <FieldError>Enter a valid 10-digit mobile number</FieldError>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">GST number</label>
              <Input defaultValue="29ABCDE" aria-invalid />
              <FieldError>GST number must be 15 characters</FieldError>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">PIN code</label>
              <Input defaultValue="" aria-invalid inputMode="numeric" />
              <FieldError>PIN code is required</FieldError>
            </div>
          </div>
        </Section>

        <Section
          title="Inline messages"
          note="Explains or blocks the whole screen. Stays until the cause is fixed."
        >
          <div className="space-y-2.5">
            <InlineMessage
              variant="error"
              title="Couldn't load products"
              description="Something went wrong at our end."
              action={
                <Button size="sm" variant="outline">
                  Retry
                </Button>
              }
            />
            <InlineMessage
              variant="warning"
              title="Prices updated"
              description="3 items changed price since you added them."
              action={
                <Button size="sm" variant="soft">
                  Review changes
                </Button>
              }
            />
            <InlineMessage
              variant="success"
              title="KYC verified"
              description="You can now order from all sellers."
            />
            <InlineMessage
              variant="info"
              title="Delivery on your beat day"
              description="Orders placed today arrive Tuesday."
              onDismiss={() => {}}
            />
            <InlineMessage
              variant="error"
              title="No internet connection"
              description="Check your network and try again."
            />
          </div>
        </Section>

        <Section title="Toasts" note="Confirms an outcome. Auto-dismisses after 4 seconds.">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setToast('success')}>
              Success
            </Button>
            <Button size="sm" variant="outline" onClick={() => setToast('error')}>
              Error
            </Button>
            <Button size="sm" variant="outline" onClick={() => setToast('info')}>
              Info
            </Button>
          </div>
        </Section>

        <Section title="Copy rules" note="What good message text looks like here.">
          <ul className="space-y-2 rounded-lg border border-border bg-card p-3 text-sm text-foreground-secondary">
            <li>
              <span className="font-medium text-foreground">Say what happened, then what to do.</span>{' '}
              "Incorrect OTP. 2 attempts left" — not "Validation failed".
            </li>
            <li>
              <span className="font-medium text-foreground">Sentence case, no full stop on titles.</span>{' '}
              Descriptions get a full stop.
            </li>
            <li>
              <span className="font-medium text-foreground">Never blame the buyer.</span> "We couldn't
              reach the seller" — not "You entered the wrong details".
            </li>
            <li>
              <span className="font-medium text-foreground">Give the number.</span> "₹1,240 more to reach
              MOV" beats "Order value too low".
            </li>
          </ul>
        </Section>
      </div>

      <Toast
        open={toast === 'success'}
        variant="success"
        message="Address saved"
        onClose={() => setToast(null)}
      />
      <Toast
        open={toast === 'error'}
        variant="error"
        message="Couldn't place order. Try again."
        onClose={() => setToast(null)}
      />
      <Toast
        open={toast === 'info'}
        variant="info"
        message="Item removed from cart"
        onClose={() => setToast(null)}
      />
    </div>
  );
}
