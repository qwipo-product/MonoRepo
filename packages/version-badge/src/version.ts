import { versionLabel } from './style';

/**
 * Which build is this page?
 *
 * Both values are inlined by Vite at build time from VITE_APP_VERSION and
 * VITE_APP_COMMIT. The Dockerfile sets them from the image's own registry tag
 * — `1.2.3` for a main release, `dev-8abf53d` for a branch build — so the
 * page can only ever name the image that is serving it (see
 * azure-cicd/templates/mockup-docker-template.yaml). Under `vite dev` and a
 * plain local `vite build` neither is set, and the badge reads `local`.
 */
export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION || 'local';
export const APP_COMMIT: string = import.meta.env.VITE_APP_COMMIT || '';
export const APP_VERSION_LABEL: string = versionLabel(APP_VERSION);
