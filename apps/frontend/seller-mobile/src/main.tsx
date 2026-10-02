import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mockups/ui';
import { I18nProvider } from '@mockups/i18n';
import { VersionBadge } from '@mockups/version-badge';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <App />
        {/* Deployed version — outside the phone frame, on every screen. */}
        <VersionBadge />
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>
);
