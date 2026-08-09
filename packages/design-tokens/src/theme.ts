/**
 * React Native binding for @mockups/design-tokens.
 *
 * Resolves the platform-neutral tokens into two flat theme objects the RN app
 * (and RN Storybook) consume directly — colors as hex strings, spacing/radius
 * as numbers, typography with lineHeight pre-multiplied to px (RN wants px,
 * not a unitless ratio).
 *
 *   import { themes, type Theme } from '@mockups/design-tokens';
 *   const t = themes[isDark ? 'dark' : 'light'];
 *   <View style={{ backgroundColor: t.color.surface.card, padding: t.space[4] }} />
 *
 * The web/Paytm build does NOT import this — it consumes ../theme.css.
 */

import {
  colorLight,
  colorDark,
  elevationLight,
  elevationDark,
  typography,
  space,
  radius,
  zIndex,
  motion,
  font,
  fontWeight,
  component,
  type ColorScheme,
} from './tokens';

/** Typography role with lineHeight resolved to px, ready for RN <Text>. */
export interface ResolvedTextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: 'uppercase';
  fontVariant?: ['tabular-nums'];
}

function resolveType(): Record<keyof typeof typography, ResolvedTextStyle> {
  const out = {} as Record<keyof typeof typography, ResolvedTextStyle>;
  (Object.keys(typography) as (keyof typeof typography)[]).forEach((key) => {
    const role = typography[key] as {
      size: number;
      weight: number;
      lineHeight: number;
      letterSpacing?: number;
      transform?: 'uppercase';
      tabular?: boolean;
    };
    out[key] = {
      fontFamily: 'Inter',
      fontSize: role.size,
      fontWeight: String(role.weight),
      lineHeight: Math.round(role.size * role.lineHeight),
      ...(role.letterSpacing ? { letterSpacing: role.size * role.letterSpacing } : {}),
      ...(role.transform ? { textTransform: role.transform } : {}),
      ...(role.tabular ? { fontVariant: ['tabular-nums'] as ['tabular-nums'] } : {}),
    };
  });
  return out;
}

const typographyResolved = resolveType();

type Elevation = Record<keyof typeof elevationLight, string>;

function makeTheme(color: ColorScheme, elevation: Elevation, name: 'light' | 'dark') {
  return {
    name,
    color,
    elevation,
    typography: typographyResolved,
    space,
    radius,
    zIndex,
    motion,
    font,
    fontWeight,
    component,
  } as const;
}

export const lightTheme = makeTheme(colorLight, elevationLight, 'light');
export const darkTheme = makeTheme(colorDark, elevationDark, 'dark');

export const themes = { light: lightTheme, dark: darkTheme } as const;

export type Theme = typeof lightTheme;
export type ThemeName = keyof typeof themes;
export { typographyResolved };
