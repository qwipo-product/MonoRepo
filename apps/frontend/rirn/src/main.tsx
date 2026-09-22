import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { BrowserRouter } from 'react-router';
import { VersionBadge } from '@mockups/version-badge';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* attribute="class" is the contract @mockups/web-tokens keys its dark
        variant off — every dark rule is scoped under `.dark`. */}
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      {/* Deployed version — outside the router so it is on every screen. */}
      <VersionBadge />
    </ThemeProvider>
  </StrictMode>
);
