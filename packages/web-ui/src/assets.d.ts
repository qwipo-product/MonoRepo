/**
 * Asset imports resolve to a URL string. The consuming app's bundler (Vite)
 * does the work; these declarations only exist so `tsc --noEmit` agrees.
 * Declared locally rather than via `vite/client` because this package is
 * typechecked with the react-library preset, which carries no Vite types.
 */
declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}
