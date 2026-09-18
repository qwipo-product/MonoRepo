// Vite inlines `import.meta.env.VITE_*` at build time. This package reads two
// of them: the Dockerfile sets both from the image's own registry tag, and
// `vite dev` leaves them unset, which the badge shows as "local".
//
// Declared here so the package typechecks on its own. Inside an app,
// vite/client already declares both interfaces and these merge into them.
interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_COMMIT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
