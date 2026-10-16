import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mockups/ui';
import { VersionBadge } from '@mockups/version-badge';
import App from './App';
import { WalletProvider } from './data/cancellation';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
      {/* Deployed version, bottom-right of the review harness — outside the
          phone frame, so it never lands in a captured PNG. */}
      <VersionBadge />
    </ThemeProvider>
  </StrictMode>
);
