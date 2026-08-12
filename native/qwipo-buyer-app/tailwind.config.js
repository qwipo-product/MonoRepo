/** NativeWind (Tailwind v3) — mirrors @mockups/design-tokens (light theme).
 *  Dark theme is a follow-up: add a darkMode strategy + the .dark values. */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './index.ts', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Inter weight → font-family (faces loaded by expo-font in App.tsx).
      // font-medium/semibold/bold/extrabold resolve to the real weighted face
      // so weights render correctly on iOS and Android (no synthesis).
      fontFamily: {
        sans: ['Inter_400Regular'],
        normal: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
        extrabold: ['Inter_800ExtraBold'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          foreground: '#ffffff',
          soft: 'rgba(37,99,235,0.10)',
          'soft-foreground': '#2563eb',
        },
        background: {
          DEFAULT: '#ffffff',
          subtle: '#f6f7f9',
          sunken: '#f3f3f5',
        },
        card: '#ffffff',
        muted: '#f6f7f9',
        foreground: {
          DEFAULT: '#1f2024',
          secondary: '#717182',
          tertiary: '#9a9aa4',
        },
        border: {
          DEFAULT: 'rgba(0,0,0,0.10)',
          strong: 'rgba(0,0,0,0.16)',
        },
        success: {
          DEFAULT: '#059669',
          foreground: '#047857',
          subtle: '#ecfdf5',
          border: '#a7f3d0',
        },
        warning: {
          DEFAULT: '#d97706',
          foreground: '#b45309',
          subtle: '#fffbeb',
        },
        error: {
          DEFAULT: '#dc2626',
          foreground: '#b91c1c',
          subtle: '#fef2f2',
        },
        info: {
          DEFAULT: '#2563eb',
          foreground: '#1d4ed8',
          subtle: '#eff6ff',
        },
        destructive: '#dc2626',
        // Splash-only brand lavender (not a DS token).
        'brand-lavender': '#bc77ff',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
