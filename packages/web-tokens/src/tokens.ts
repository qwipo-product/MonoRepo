/**
 * @mockups/web-tokens — the desktop / admin token layer.
 *
 * Nothing here imports React or Tailwind. One binding consumes these:
 *   • Web → ../theme.css (Tailwind v4 @theme, light + `.dark`)
 *
 * RELATIONSHIP TO @mockups/design-tokens
 * --------------------------------------
 * This module re-exports `colorLight`, `colorDark`, and `ColorScheme`
 * from `@mockups/design-tokens`. These TypeScript exports share one source.
 * The desktop CSS contains separate values. Update that CSS where applicable.
 *
 * What this package adds is everything that genuinely differs on a dense
 * desktop surface: a tighter radius scale, 36px controls instead of 44px,
 * an admin type scale that bottoms out at 10px, chart colours, and the
 * breakpoint ladder. Those differ on purpose, not by accident.
 *
 * Rule, same as the mobile layer: components reference SEMANTIC tokens
 * (`bg-primary`, `text-foreground`), never a hex.
 */

import { colorDark, colorLight, space, zIndex } from '@mockups/design-tokens';
import type { ColorScheme, StatusColor } from '@mockups/design-tokens';

// Shared with the mobile layer — one definition, re-exported.
export { colorLight, colorDark, space, zIndex };
export type { ColorScheme, StatusColor };

// ─────────────────────────────────────────────────────────────────────────
// Desktop typography uses weights 400, 500, and 600.
// Use the defined typography roles for interface text.
// ─────────────────────────────────────────────────────────────────────────

export const font = {
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  /** Root size. Everything else is a rem multiple of this. */
  baseSize: 16,
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
} as const;

/**
 * The admin type scale. `class` is the Tailwind recipe used in components;
 * `size` / `lineHeight` are px, for anything that can't read a class.
 */
export const typography = {
  display: { class: 'text-2xl font-semibold', size: 24, lineHeight: 32, use: 'Page titles only' },
  h1: { class: 'text-xl font-semibold', size: 20, lineHeight: 28, use: 'Card section headers' },
  h2: { class: 'text-base font-semibold', size: 16, lineHeight: 24, use: 'Sub-section heads' },
  h3: { class: 'text-sm font-semibold', size: 14, lineHeight: 20, use: 'Tile titles, list items' },
  body: { class: 'text-sm', size: 14, lineHeight: 20, use: 'Default body' },
  small: { class: 'text-xs', size: 12, lineHeight: 16, use: 'Helper text, captions' },
  tiny: { class: 'text-[11px]', size: 11, lineHeight: 16, use: 'Footnotes, status-row helpers' },
  micro: {
    class: 'text-[10px] uppercase tracking-wider',
    size: 10,
    lineHeight: 14,
    use: 'Label badges, table mini-headers',
  },
  mono: { class: 'font-mono text-xs', size: 12, lineHeight: 16, use: 'IDs, SKU and order codes' },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// Shape — tighter than mobile. A data-table pill at mobile's 6px radius
// reads as a lozenge at 20px tall, which is why these diverge.
// ─────────────────────────────────────────────────────────────────────────

export const radius = {
  /** `--radius` base — cards, dialogs, popovers. */
  base: 10,
  sm: 2, // pills inside table cells
  md: 6, // buttons, inputs, switches
  lg: 8, // cards, dialogs
  xl: 12, // hero / brand surfaces only
  full: 9999,
} as const;

/** Elevation cues. Never stack shadow + ring + border on one element. */
export const elevation = {
  sm: 'Resting cards, sticky toolbars',
  md: 'Hover state on clickable cards',
  lg: 'Popovers, dropdown menus',
  xl: 'Modal dialogs, drawers',
} as const;

// ─────────────────────────────────────────────────────────────────────────
// Motion — matches the mobile layer's durations; adds the route-progress
// one-shot that only exists on web.
// ─────────────────────────────────────────────────────────────────────────

export const motion = {
  duration: { fast: 150, base: 200, exit: 150, slow: 300, progress: 600 },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────────────

/** Tailwind defaults. Design mobile-first even on an admin surface. */
export const breakpoints = {
  base: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Density recipes — the application norm, deliberately denser than
 * Material. Expressed as Tailwind classes because that is how they get
 * applied; the numbers behind them are in `space`.
 */
export const density = {
  cardPadding: 'p-4',
  dialogPadding: 'p-5',
  pagePadding: 'p-6',
  cardGutter: 'gap-4',
  sectionGap: 'space-y-6',
  fieldGap: 'space-y-2',
  toolbarControlHeight: 'h-9',
  compactControlHeight: 'h-8',
  /** Touch viewports still have to clear 44px — grow controls, not padding. */
  touchControlHeight: 'h-11',
} as const;

/** Component sizing. Compare `component` in design-tokens: 36 vs 44 height. */
export const component = {
  /** Web hit areas may shrink to 32px; aim for 40. Touch viewports: 44. */
  tapTargetMin: 32,
  tapTargetPreferred: 40,
  tapTargetTouch: 44,
  button: {
    height: { sm: 32, md: 36, lg: 40 },
    paddingX: { sm: space[3], md: space[4], lg: space[6] },
    radius: radius.md,
    gap: space[2],
  },
  input: { height: { sm: 32, md: 36 }, radius: radius.md, paddingX: space[3] },
  card: { padding: space[4], radius: radius.lg, gap: space[4] },
  table: { rowPaddingY: space[3], rowPaddingX: space[4] },
  /** Sidebar + top bar of the AppShell. */
  shell: { topBarHeight: 56, sidebarWidth: 224, sidebarCollapsedWidth: 64 },
  /** Lucide sizing grid. Stroke stays at Lucide's 1.5 — never override it. */
  icon: { tableCell: 12, chip: 14, default: 16, heading: 20, hero: 24, stroke: 1.5 },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// Charts — web only. The mobile layer has no chart surface.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Eight semantically-ordered series colours. A series meaning "Active"
 * reads green wherever it appears; "Cancelled" reads red. Don't reassign
 * roles between charts.
 *
 * All are 600-level shades, which stay legible on light and dark surfaces
 * without a second palette.
 */
export const chartPalette = [
  '#2563eb', // 1. Primary — blue 600
  '#16a34a', // 2. Success — green 600
  '#d97706', // 3. Warning — amber 600
  '#dc2626', // 4. Danger — red 600
  '#9333ea', // 5. Accent — purple 600
  '#0891b2', // 6. Cyan 600
  '#c026d3', // 7. Fuchsia 600
  '#4f46e5', // 8. Indigo 600
] as const;
