// Resolve the data layer's web-style image paths (e.g. "/brand-logos/Freedom
// Oil.png") to bundled RN assets. Metro's require.context statically collects
// every asset under /assets at build time; we key them by their web path so the
// copied data files (home.ts etc.) work unchanged.
import type { ImageSourcePropType } from 'react-native';

// @ts-ignore - require.context is provided by Metro (Expo enables it by default).
const ctx = require.context('../../assets', true, /\.(png|jpe?g|webp)$/);

const MAP: Record<string, ImageSourcePropType> = {};
for (const key of ctx.keys()) {
  // key: "./brand-logos/Freedom Oil.png" -> "/brand-logos/Freedom Oil.png"
  MAP[key.replace(/^\./, '')] = ctx(key) as ImageSourcePropType;
}

/** Returns the bundled asset for a web-style path, or undefined if not copied. */
export function img(path?: string): ImageSourcePropType | undefined {
  if (!path) return undefined;
  return MAP[path] ?? MAP[decodeURI(path)] ?? MAP[encodeURI(path)];
}
