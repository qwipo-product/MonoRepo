import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { RouterProvider } from 'react-router';
import { Toaster } from '@mockups/web-ui';
import { VersionBadge } from '@mockups/version-badge';
import { router } from './app/routes';
import { AuthProvider } from './app/lib/auth-context';
import './index.css';

/**
 * next-themes flips a `dark` class on <html> from the persisted preference
 * (qwipo.theme). That class is what @mockups/web-tokens keys every dark rule
 * off, via Tailwind v4's `@custom-variant dark (&:is(.dark *))`.
 *
 * defaultTheme="light"  — first-time visitors land on the canonical brand
 *                         surface; dark is a deliberate user action.
 * enableSystem={false}  — the in-app toggle is the source of truth, not the OS.
 *
 * No <StrictMode> here, matching the original app: several screens use
 * effect-driven mock-store seeding that double-invokes badly under it.
 */
createRoot(document.getElementById('root')!).render(
  <ThemeProvider
    attribute="class"
    defaultTheme="light"
    enableSystem={false}
    storageKey="qwipo.theme"
    disableTransitionOnChange
  >
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
      {/* Deployed version — outside the router so it is on every screen. */}
      <VersionBadge />
    </AuthProvider>
  </ThemeProvider>
);
