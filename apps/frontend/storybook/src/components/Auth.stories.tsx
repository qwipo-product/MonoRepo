import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AuthShell, OtpVerify, PhoneLogin } from '@mockups/components';

/* The auth screens fill their parent; a relative 390×700 box lays them out
   the way the phone frame does in the apps. */
const Phone = ({ children }: { children: ReactNode }) => (
  <div className="relative h-[700px] w-[390px] overflow-hidden rounded-xl border border-border bg-background">{children}</div>
);

const meta = {
  title: 'Components/Auth',
  component: PhoneLogin,
  parameters: {
    docs: {
      description: {
        component:
          'Sign-in shared by the buyer and seller apps: PhoneLogin (mobile number) → OtpVerify (6-digit code, 123456 passes), both inside AuthShell so logo, heading and button line up. Pass `labels` to use an app’s own words. The logo reads /brand/*.svg from the app’s public folder (Storybook serves its own copy).',
      },
    },
  },
  args: { onNext: () => {} },
} satisfies Meta<typeof PhoneLogin>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Login: Story = {
  render: (args) => (
    <Phone>
      <PhoneLogin {...args} />
    </Phone>
  ),
};

export const LoginSellerWords: Story = {
  render: (args) => (
    <Phone>
      <PhoneLogin
        {...args}
        initialPhone="9900000002"
        labels={{ title: 'Welcome back', subtitle: 'Sign in with your mobile number', submit: 'Send OTP' }}
      />
    </Phone>
  ),
};

export const LoginError: Story = {
  render: (args) => (
    <Phone>
      <PhoneLogin {...args} demoError />
    </Phone>
  ),
};

export const Otp: Story = {
  render: () => (
    <Phone>
      <OtpVerify onBack={() => {}} onVerify={() => {}} />
    </Phone>
  ),
};

export const OtpError: Story = {
  render: () => (
    <Phone>
      <OtpVerify onBack={() => {}} onVerify={() => {}} demoError />
    </Phone>
  ),
};

export const Shell: Story = {
  render: () => (
    <Phone>
      <AuthShell title="Any auth step" subtitle="One line of help under the heading" onBack={() => {}}>
        <p className="mt-5 text-sm text-foreground-secondary">The step’s fields go here.</p>
      </AuthShell>
    </Phone>
  ),
};
