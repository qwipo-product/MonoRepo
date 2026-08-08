import { useState } from 'react';
import BuyerShell from './shells/BuyerShell';
import PaytmShell from './shells/PaytmShell';
import ShellSwitcher, { type Shell } from './review/ShellSwitcher';
import FlowIndex from './review/FlowIndex';
import type { ScreenId } from './review/screenIndex';
import SplashScreen from './screens-buyer-only/SplashScreen';
import LoginScreen from './screens-buyer-only/LoginScreen';
import OTPScreen from './screens-buyer-only/OTPScreen';
import OnboardingScreen from './screens-buyer-only/OnboardingScreen';
import CompleteKycScreen from './screens-buyer-only/CompleteKycScreen';
import KycSuccessScreen from './screens-buyer-only/KycSuccessScreen';
import Home from './screens/Home';

type OnboardingData = { location: string; businessName: string; businessType: string };

/* Screens migrated so far. FlowIndex greys the rest and they render a
   placeholder in the frame; each phase adds its ids here. */
const BUILT = new Set<ScreenId>(['splash', 'login', 'otp', 'onboarding', 'kyc-complete', 'kyc-success', 'home']);
const AUTH = new Set<ScreenId>(['splash', 'login', 'otp', 'onboarding', 'kyc-complete', 'kyc-success']);

/* One codebase, two chrome shells. Auth screens render chromeless; the main app
   renders inside the selected shell. State-based nav mirrors qwipo-buyer-app.
   The FlowIndex sidebar jumps straight to any screen for review. */
export default function App() {
  const [screen, setScreen] = useState<ScreenId>('splash');
  const [shell, setShell] = useState<Shell>(
    new URLSearchParams(window.location.search).get('shell') === 'paytm' ? 'paytm' : 'buyer'
  );
  const [phone, setPhone] = useState('');
  const [onboarding, setOnboarding] = useState<OnboardingData>({
    location: '',
    businessName: '',
    businessType: '',
  });
  const [kycPending, setKycPending] = useState(false);

  const frame = (() => {
    switch (screen) {
      case 'splash':
        return <SplashScreen onContinue={() => setScreen('login')} />;
      case 'login':
        return (
          <LoginScreen
            onSubmit={(p) => {
              setPhone(p);
              setScreen('otp');
            }}
          />
        );
      case 'otp':
        return <OTPScreen phone={phone} onBack={() => setScreen('login')} onVerify={() => setScreen('onboarding')} />;
      case 'onboarding':
        return (
          <OnboardingScreen
            onBack={() => setScreen('otp')}
            onProceed={(data) => {
              setOnboarding(data);
              setKycPending(true);
              setScreen('home');
            }}
          />
        );
      case 'kyc-complete':
        return (
          <CompleteKycScreen
            initialBusinessType={onboarding.businessType}
            initialLocation={onboarding.location}
            onCancel={() => setScreen('home')}
            onRegister={() => setScreen('kyc-success')}
          />
        );
      case 'kyc-success':
        return (
          <KycSuccessScreen
            onCallSupport={() => alert('Calling customer support…')}
            onPlaceOrder={() => {
              setKycPending(false);
              setScreen('home');
            }}
          />
        );
      case 'home': {
        const CurrentShell = shell === 'paytm' ? PaytmShell : BuyerShell;
        return (
          <CurrentShell>
            <Home kycPending={kycPending} onCompleteKyc={() => setScreen('kyc-complete')} />
          </CurrentShell>
        );
      }
      default:
        return <Placeholder />;
    }
  })();

  const isAuth = AUTH.has(screen);

  return (
    <div className="flex min-h-dvh bg-shell">
      <FlowIndex active={screen} built={BUILT} onPick={setScreen} />

      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        {screen === 'home' && <ShellSwitcher value={shell} onChange={setShell} />}
        {/* 'home' brings its own shell/frame; everything else sits in the bare phone frame. */}
        {screen === 'home' ? (
          frame
        ) : (
          <div
            className={`h-[844px] w-[390px] overflow-hidden rounded-[2rem] bg-background text-foreground shadow-xl ${
              isAuth ? '' : 'grid place-items-center'
            }`}
          >
            {frame}
          </div>
        )}
      </main>
    </div>
  );
}

function Placeholder() {
  return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      This screen lands in a later phase.
    </div>
  );
}
