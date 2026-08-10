// Local copy of the design tokens the RN runtime needs (icon colours, etc.).
// Mirrors @mockups/design-tokens `colorLight`. The app is a standalone Expo
// mockup, so it inlines these instead of importing the workspace package —
// keeps the install self-contained (Tailwind v3 for NativeWind, no hoisting
// clash with the web apps' Tailwind v4). Values also mirror tailwind.config.js.
export const lightTheme = {
  color: {
    brand: {
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      primaryActive: '#1e40af',
      onPrimary: '#ffffff',
    },
    text: {
      primary: '#1f2024',
      secondary: '#717182',
      tertiary: '#9a9aa4',
      onBrand: '#ffffff',
      link: '#2563eb',
    },
    status: {
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#2563eb',
    },
  },
} as const;
