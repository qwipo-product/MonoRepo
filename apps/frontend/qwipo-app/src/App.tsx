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
import HomeScreen from './screens/HomeScreen';
import GlobalSearchScreen from './screens/GlobalSearchScreen';
import AllBrandsScreen from './screens/AllBrandsScreen';
import DistributorsListScreen from './screens/DistributorsListScreen';
import WholesalersCategoriesScreen from './screens/WholesalersCategoriesScreen';

type OnboardingData = { location: string; businessName: string; businessType: string };

const BUILT = new Set<ScreenId>([
  'splash', 'login', 'otp', 'onboarding', 'kyc-complete', 'kyc-success',
  'home', 'home-distributors-only', 'home-wholesalers-only',
  'global-search', 'distributors-list', 'wholesaler-categories', 'all-brands',
]);
const HOME_AVAILABILITY: Record<string, 'both' | 'distributors' | 'wholesalers'> = {
  home: 'both',
  'home-distributors-only': 'distributors',
  'home-wholesalers-only': 'wholesalers',
};

/* One codebase, two chrome shells. Auth + pushed detail screens render in the
   bare phone frame (own status bar, no tab bar); the home roots render inside
   the selected shell. State-based nav mirrors qwipo-buyer-app. FlowIndex jumps
   to any screen for review. */
export default function App() {
  const [screen, setScreen] = useState<ScreenId>(
    () => new URLSearchParams(window.location.search).get('screen') || 'splash'
  );
  const [shell, setShell] = useState<Shell>(
    new URLSearchParams(window.location.search).get('shell') === 'paytm' ? 'paytm' : 'buyer'
  );
  const [phone, setPhone] = useState('');
  const [onboarding, setOnboarding] = useState<OnboardingData>({ location: '', businessName: '', businessType: '' });
  const [kycPending, setKycPending] = useState(false);
  const [wholesalerVariant, setWholesalerVariant] = useState<'groceries' | 'fmcg' | 'all'>('all');
  const [distListTab, setDistListTab] = useState<'categories' | 'brands' | 'sellers'>('categories');
  const go = setScreen;
  const isHome = screen in HOME_AVAILABILITY;

  const homeProps = {
    kycPending,
    onCompleteKyc: () => go('kyc-complete'),
    onOpenNotifications: () => go('notifications'),
    onOpenProfile: () => go('profile'),
    onOpenAddresses: () => go('sub:addresses'),
    onOpenSearch: () => go('global-search'),
    onSelectDistributor: () => go('storefront'),
    onSelectBrand: () => go('all-brands'),
    onSelectDistributorBrand: () => go('all-brands'),
    onSelectCategory: () => go('listing'),
    onSeeAllDistributors: () => { setDistListTab('sellers'); go('distributors-list'); },
    onSeeAllBrands: () => go('all-brands'),
    onSeeAllCategories: () => { setWholesalerVariant('all'); go('wholesaler-categories'); },
    onOpenWholesalerCategory: (id: string) => { setWholesalerVariant(id === 'groceries' ? 'groceries' : 'fmcg'); go('wholesaler-categories'); },
    onOpenBannerListing: () => go('listing'),
  };

  const bareScreen = (() => {
    switch (screen) {
      case 'splash':
        return <SplashScreen onContinue={() => go('login')} />;
      case 'login':
        return <LoginScreen onSubmit={(p) => { setPhone(p); go('otp'); }} />;
      case 'otp':
        return <OTPScreen phone={phone} onBack={() => go('login')} onVerify={() => go('onboarding')} />;
      case 'onboarding':
        return <OnboardingScreen onBack={() => go('otp')} onProceed={(data) => { setOnboarding(data); setKycPending(true); go('home'); }} />;
      case 'kyc-complete':
        return <CompleteKycScreen initialBusinessType={onboarding.businessType} initialLocation={onboarding.location} onCancel={() => go('home')} onRegister={() => go('kyc-success')} />;
      case 'kyc-success':
        return <KycSuccessScreen onCallSupport={() => alert('Calling customer support…')} onPlaceOrder={() => { setKycPending(false); go('home'); }} />;
      case 'global-search':
        return <GlobalSearchScreen onBack={() => go('home')} onSelectProduct={() => go('listing')} />;
      case 'all-brands':
        return <AllBrandsScreen onBack={() => go('home')} onSelectBrand={() => go('storefront')} onOpenSearch={() => go('global-search')} />;
      case 'distributors-list':
        return <DistributorsListScreen initialTab={distListTab} onBack={() => go('home')} onSelectDistributor={() => go('storefront')} onSelectBrand={() => go('storefront')} onSelectCategory={() => go('listing')} />;
      case 'wholesaler-categories':
        return <WholesalersCategoriesScreen variant={wholesalerVariant} onBack={() => go('home')} onSelectCategory={() => go('listing')} onOpenSearch={() => go('global-search')} />;
      default:
        return null;
    }
  })();

  if (bareScreen) {
    return (
      <div className="flex min-h-dvh bg-shell">
        <FlowIndex active={screen} built={BUILT} onPick={go} />
        <main className="flex flex-1 items-center justify-center p-6">
          <div className="h-[844px] w-[390px] overflow-hidden rounded-[2rem] bg-background text-foreground shadow-xl">
            {bareScreen}
          </div>
        </main>
      </div>
    );
  }

  const CurrentShell = shell === 'paytm' ? PaytmShell : BuyerShell;
  const content = isHome ? (
    <HomeScreen sellerAvailability={HOME_AVAILABILITY[screen]} {...homeProps} />
  ) : (
    <Placeholder />
  );

  return (
    <div className="flex min-h-dvh bg-shell">
      <FlowIndex active={screen} built={BUILT} onPick={go} />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <ShellSwitcher value={shell} onChange={setShell} />
        <CurrentShell active="home" cartCount={0} onNavigate={go}>
          {content}
        </CurrentShell>
      </main>
    </div>
  );
}

function Placeholder() {
  return <div className="grid h-full place-items-center p-8 text-center text-sm text-muted-foreground">This screen lands in a later phase.</div>;
}
