/**
 * @mockups/design-tokens — the single, platform-neutral source of truth.
 *
 * Nothing here imports React, Tailwind, or React Native. These are raw values.
 * Two bindings consume them:
 *   • Web / Paytm WebView  → ../theme.css   (Tailwind v4 @theme, light + `.dark`)
 *   • React Native         → ./theme.ts     (resolved light / dark objects)
 *
 * Derived from the running Qwipo app's actual UI + the reconciled semantic
 * scale. When you change a value here, mirror it in ../theme.css (small set,
 * edited together — the repo has no build step by design).
 *
 * Rule: components reference SEMANTIC tokens (color.text.primary, not a hex).
 * Raw palette values live only in this file.
 */

// ─────────────────────────────────────────────────────────────────────────
// Primitives — theme-neutral raw scales
// ─────────────────────────────────────────────────────────────────────────

export const font = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/** 4px base scale (Tailwind-aligned). Key = Tailwind step, value = px. */
export const space = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const zIndex = {
  base: 0,
  sticky: 10,
  stickyHeader: 20,
  drawer: 40,
  popover: 50,
  modal: 60,
  toast: 70,
  tooltip: 80,
} as const;

export const motion = {
  duration: { fast: 150, base: 200, slow: 300 },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
  },
  /** Canonical press feedback for every primary/pressable target. */
  pressScale: 0.98,
} as const;

/**
 * Typography roles. Each role names size (px), weight, lineHeight (unitless),
 * and optional letterSpacing (em) + transform. Replaces the ad-hoc
 * text-[9px]/[10px]/[11px] and text-lg/base/sm section-title spread.
 */
export const typography = {
  display: { size: 24, weight: fontWeight.bold, lineHeight: 1.25 },
  h1: { size: 20, weight: fontWeight.semibold, lineHeight: 1.3 },
  h2: { size: 18, weight: fontWeight.semibold, lineHeight: 1.35 },
  h3: { size: 16, weight: fontWeight.semibold, lineHeight: 1.4 },
  bodyLg: { size: 16, weight: fontWeight.regular, lineHeight: 1.5 },
  body: { size: 14, weight: fontWeight.regular, lineHeight: 1.5 },
  label: { size: 14, weight: fontWeight.medium, lineHeight: 1.4 },
  caption: { size: 12, weight: fontWeight.regular, lineHeight: 1.4 },
  micro: {
    size: 10,
    weight: fontWeight.semibold,
    lineHeight: 1.3,
    letterSpacing: 0.06,
    transform: 'uppercase',
  },
  /** Primary price — tabular figures so columns align. */
  price: { size: 18, weight: fontWeight.bold, lineHeight: 1.2, tabular: true },
  priceSm: { size: 14, weight: fontWeight.semibold, lineHeight: 1.3, tabular: true },
  button: { size: 14, weight: fontWeight.bold, lineHeight: 1 },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// Semantic color — light + dark. Status colors are {solid, fg, bg, border}
// quads so the emerald-600/700 and amber-700/800 drift can't recur.
// ─────────────────────────────────────────────────────────────────────────

type StatusColor = { solid: string; fg: string; bg: string; border: string };

export interface ColorScheme {
  brand: {
    primary: string;
    primaryHover: string;
    primaryActive: string;
    onPrimary: string;
    /** Tonal fill for secondary "Discounts"-style buttons (primary @ ~10%). */
    soft: string;
    softText: string;
  };
  background: {
    page: string;
    subtle: string;
    sunken: string;
  };
  surface: {
    card: string;
    input: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    onBrand: string;
    link: string;
  };
  border: {
    subtle: string;
    default: string;
    strong: string;
    focus: string;
  };
  status: {
    success: StatusColor;
    warning: StatusColor;
    error: StatusColor;
    info: StatusColor;
    neutral: StatusColor;
    /** Purple accent — the Qwipo brand mark; also the seller-store handbook's
     * "Accent" semantic. Not a primary action (that's brand.primary blue). */
    accent: StatusColor;
  };
}

export const colorLight: ColorScheme = {
  brand: {
    primary: '#2563eb', // blue-600 — the app's healthiest existing token, kept
    primaryHover: '#1d4ed8', // blue-700
    primaryActive: '#1e40af', // blue-800
    onPrimary: '#ffffff',
    soft: 'rgba(37, 99, 235, 0.10)',
    softText: '#2563eb',
  },
  background: {
    page: '#ffffff',
    subtle: '#f6f7f9', // replaces raw bg-gray-50 page/panel usage
    sunken: '#f3f3f5', // input backgrounds — exact seller-store handbook value
  },
  surface: {
    card: '#ffffff',
    input: '#f3f3f5', // exact seller-store handbook input-background
    overlay: 'rgba(0, 0, 0, 0.5)', // sheet/dialog backdrop
  },
  text: {
    primary: '#1f2024', // ≈ oklch(0.145) foreground
    secondary: '#717182', // exact seller-store handbook muted-foreground
    tertiary: '#9a9aa4',
    onBrand: '#ffffff',
    link: '#2563eb',
  },
  border: {
    subtle: 'rgba(0, 0, 0, 0.06)',
    default: 'rgba(0, 0, 0, 0.10)',
    strong: 'rgba(0, 0, 0, 0.16)',
    focus: '#2563eb',
  },
  status: {
    success: { solid: '#059669', fg: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
    warning: { solid: '#d97706', fg: '#b45309', bg: '#fffbeb', border: '#fde68a' },
    error: { solid: '#dc2626', fg: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
    info: { solid: '#2563eb', fg: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
    neutral: { solid: '#4b5563', fg: '#374151', bg: '#f9fafb', border: '#e5e7eb' },
    accent: { solid: '#9333ea', fg: '#7e22ce', bg: '#faf5ff', border: '#e9d5ff' },
  },
};

export const colorDark: ColorScheme = {
  brand: {
    primary: '#3b82f6', // blue-500 — lifts on dark surfaces
    primaryHover: '#60a5fa',
    primaryActive: '#93c5fd',
    onPrimary: '#0b1220',
    soft: 'rgba(59, 130, 246, 0.16)',
    softText: '#93c5fd',
  },
  background: {
    page: '#1c1c1e',
    subtle: '#232326',
    sunken: '#2a2a2d',
  },
  surface: {
    card: '#2a2a2d',
    input: '#2e2e31',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  text: {
    primary: '#fafafa', // ≈ oklch(0.985)
    secondary: '#a1a1aa',
    tertiary: '#71717a',
    onBrand: '#ffffff',
    link: '#93c5fd',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.20)',
    focus: '#3b82f6',
  },
  status: {
    success: { solid: '#34d399', fg: '#6ee7b7', bg: '#0b271d', border: '#14532d' },
    warning: { solid: '#fbbf24', fg: '#fcd34d', bg: '#2a2008', border: '#78500a' },
    error: { solid: '#f87171', fg: '#fca5a5', bg: '#2a0d0d', border: '#7f1d1d' },
    info: { solid: '#60a5fa', fg: '#93c5fd', bg: '#0d1e3a', border: '#1e3a8a' },
    neutral: { solid: '#9ca3af', fg: '#d1d5db', bg: '#212124', border: '#374151' },
    accent: { solid: '#c084fc', fg: '#d8b4fe', bg: '#2a1039', border: '#6b21a8' },
  },
};

// ─────────────────────────────────────────────────────────────────────────
// Elevation — light + dark (shadows are weaker on light, deeper on dark)
// ─────────────────────────────────────────────────────────────────────────

export const elevationLight = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.06)', // resting cards, sticky header
  md: '0 4px 8px -2px rgba(0, 0, 0, 0.08)', // raised / pressed cards
  lg: '0 10px 20px -4px rgba(0, 0, 0, 0.10)', // popovers, menus
  xl: '0 20px 32px -8px rgba(0, 0, 0, 0.14)', // sheets, dialogs
  barTop: '0 -4px 16px rgba(0, 0, 0, 0.08)', // sticky bottom CTA bar
} as const;

export const elevationDark = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.40)',
  md: '0 4px 8px -2px rgba(0, 0, 0, 0.50)',
  lg: '0 10px 20px -4px rgba(0, 0, 0, 0.55)',
  xl: '0 20px 32px -8px rgba(0, 0, 0, 0.60)',
  barTop: '0 -4px 16px rgba(0, 0, 0, 0.50)',
} as const;

// ─────────────────────────────────────────────────────────────────────────
// Component tokens — derived from the scales above. Mobile-first sizes
// honor the 44px minimum tap target (DESIGN-SYSTEM §6.1).
// ─────────────────────────────────────────────────────────────────────────

export const component = {
  tapTargetMin: 44,
  button: {
    height: { sm: 36, md: 44, lg: 52 },
    paddingX: { sm: space[3], md: space[4], lg: space[6] },
    radius: radius.md,
    gap: space[2],
  },
  input: {
    height: { md: 44, lg: 52 },
    radius: radius.md,
    paddingX: space[3],
  },
  card: {
    padding: { compact: space[2], default: space[3], roomy: space[4] },
    radius: radius.lg,
    gap: space[3],
  },
  sheet: {
    radiusTop: radius.xl,
    maxHeightPct: 90,
    handle: true,
  },
  icon: { sm: 16, md: 20, lg: 24 },
} as const;

export type { StatusColor };
