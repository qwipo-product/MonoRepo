/** @type {import('tailwindcss').Config} */
// Semantic colour tokens mirror @mockups/design-tokens `colorLight`. They are
// duplicated here because tailwind.config runs as plain JS at build time and the
// tokens ship as raw TS (no build step). Keep in sync with packages/design-
// tokens/src/tokens.ts — or, later, have design-tokens emit a JSON both consume.
// Class names match the web semantic utilities so screens read the same.
module.exports = {
  content: ['./App.tsx', './index.ts', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          active: '#1e40af',
          foreground: '#ffffff',
          soft: 'rgba(37, 99, 235, 0.10)',
          'soft-foreground': '#2563eb',
        },
        background: {
          DEFAULT: '#ffffff',
          subtle: '#f6f7f9',
          sunken: '#f3f3f5',
        },
        card: '#ffffff',
        input: '#f3f3f5',
        muted: '#f3f3f5',
        overlay: 'rgba(0, 0, 0, 0.5)',
        foreground: {
          DEFAULT: '#1f2024',
          secondary: '#717182',
          tertiary: '#9a9aa4',
        },
        border: {
          DEFAULT: 'rgba(0, 0, 0, 0.10)',
          subtle: 'rgba(0, 0, 0, 0.06)',
          strong: 'rgba(0, 0, 0, 0.16)',
        },
        success: { DEFAULT: '#059669', foreground: '#047857', subtle: '#ecfdf5', border: '#a7f3d0' },
        warning: { DEFAULT: '#d97706', foreground: '#b45309', subtle: '#fffbeb', border: '#fde68a' },
        error: { DEFAULT: '#dc2626', foreground: '#b91c1c', subtle: '#fef2f2', border: '#fecaca' },
        info: { DEFAULT: '#2563eb', foreground: '#1d4ed8', subtle: '#eff6ff', border: '#bfdbfe' },
        accent: { DEFAULT: '#9333ea', foreground: '#7e22ce', subtle: '#faf5ff', border: '#e9d5ff' },
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
