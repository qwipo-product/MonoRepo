// Token hex values for imperative use (icon `color`, Animated, RN Switch).
// Mirrors tailwind.config.js (light theme). Keep in sync.
export const colors = {
  primary: '#2563eb',
  primaryForeground: '#ffffff',
  primarySoft: 'rgba(37,99,235,0.10)',
  primarySoftForeground: '#2563eb',
  background: '#ffffff',
  backgroundSubtle: '#f6f7f9',
  card: '#ffffff',
  muted: '#f6f7f9',
  foreground: '#1f2024',
  foregroundSecondary: '#717182',
  foregroundTertiary: '#9a9aa4',
  border: 'rgba(0,0,0,0.10)',
  success: '#059669',
  successForeground: '#047857',
  warning: '#d97706',
  error: '#dc2626',
  errorForeground: '#b91c1c',
  info: '#2563eb',
  brandLavender: '#bc77ff',
  overlay: 'rgba(0,0,0,0.5)',
  white: '#ffffff',
};

// RN elevation styles mirroring the web --elevation-* box-shadow tokens.
// (iOS reads shadowOffset/Opacity/Radius; Android uses elevation.)
export const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.14, shadowRadius: 32, elevation: 16 },
  // Upward shadow for bottom sheets / sticky bars (--elevation-bar-top).
  barTop: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 12 },
} as const;

// Inter weight → font-family map (registered by expo-font in App.tsx).
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;
