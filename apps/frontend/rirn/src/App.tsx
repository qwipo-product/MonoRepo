import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MotionProvider } from './components/Motion';
import { ReviewTools } from './components/ReviewTools';
import { useSitePathname } from './lib/navigation';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import NotFound from './pages/NotFound';

export default function App() {
  const pathname = useSitePathname();
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousPath = useRef<string | undefined>(undefined);

  useEffect(() => {
    const samePage = previousPath.current === pathname;
    previousPath.current = pathname;
    document.title = pathname === '/'
      ? 'DigiDukaan by Qwipo | Beyond the beat'
      : `${pathname === '/how-it-works' ? 'How it works' : 'Page not found'} | DigiDukaan by Qwipo`;
    // Same-page clicks already scroll through MotionProvider. Back/Forward
    // and cross-page links still need their destination restored here.
    if (samePage && navigationType !== 'POP') return;
    // Wait for the destination page to mount before resolving its section.
    const frame = requestAnimationFrame(() => {
      let section = '';
      try { section = decodeURIComponent(location.hash.slice(1)); } catch { /* Ignore malformed fragments. */ }
      const target = section ? document.getElementById(section) : null;
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
        const hadTabIndex = target.hasAttribute('tabindex');
        if (!hadTabIndex) target.tabIndex = -1;
        target.focus({ preventScroll: true });
        if (!hadTabIndex) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      } else if (location.key !== 'default') {
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.getElementById('main')?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, location.hash, location.key, navigationType]);

  return (
    <MotionProvider>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header key={pathname} />
      <main id="main" tabIndex={-1}>
        {pathname === '/' ? <Home /> : pathname === '/how-it-works' ? <HowItWorks /> : <NotFound />}
      </main>
      <Footer />
      {import.meta.env.DEV && <ReviewTools />}
    </MotionProvider>
  );
}
