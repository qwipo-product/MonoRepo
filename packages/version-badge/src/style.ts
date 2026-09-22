import type { CSSProperties } from 'react';

/** `1.2.3` → `v1.2.3`; anything else (`dev-8abf53d`, `local`) is shown as-is. */
export function versionLabel(version: string): string {
  return /^\d+\.\d+\.\d+$/.test(version) ? `v${version}` : version;
}

export type Corner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

const CORNERS: Record<Corner, CSSProperties> = {
  'bottom-right': { right: 0, bottom: 0 },
  'bottom-left': { left: 0, bottom: 0 },
  'top-right': { right: 0, top: 0 },
  'top-left': { left: 0, top: 0 },
};

/**
 * One look, two consumers: the React <VersionBadge /> spreads this object, and
 * the Storybook manager script gets it serialised by `badgeCss()` below.
 *
 * Inline on purpose — the badge belongs to neither design kit, so it must not
 * depend on Tailwind classes (which would need an `@source` line in every
 * app) or on either token layer. White on translucent near-black reads on any
 * page, light or dark.
 *
 * Unitless CSS values are written as strings so `badgeCss()` can add `px` to
 * every number without special-casing z-index or opacity.
 */
export const BADGE_STYLE: CSSProperties = {
  position: 'fixed',
  zIndex: '9999',
  margin: 8,
  padding: '3px 7px',
  borderRadius: 999,
  font: '600 10px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  letterSpacing: '0.02em',
  color: '#fff',
  background: 'rgba(17, 17, 17, 0.62)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  whiteSpace: 'nowrap',
  userSelect: 'all',
  opacity: '0.85',
};

export function badgeStyle(corner: Corner): CSSProperties {
  return { ...BADGE_STYLE, ...CORNERS[corner] };
}

/** The same style as a `style=""` attribute value, for the Storybook manager. */
export function badgeCss(corner: Corner): string {
  return Object.entries(badgeStyle(corner))
    .map(([key, value]) => {
      const prop = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `${prop}:${typeof value === 'number' ? `${value}px` : value}`;
    })
    .join(';');
}
