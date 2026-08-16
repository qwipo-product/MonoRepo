import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

/**
 * Storybook for the WEB / desktop-admin design system.
 *
 * Same shape as apps/frontend/storybook (the mobile-first catalog) — Vite +
 * React + Tailwind v4 — but pointed at @mockups/web-ui and @mockups/web-tokens.
 * Two catalogs rather than one because the two layers are genuinely different
 * design languages: a 44px tap target and a 36px toolbar control should not
 * sit in the same gallery pretending to be alternatives.
 *
 * Tailwind does not scan node_modules, so `.storybook/tailwind.css` points
 * `@source` at the package sources — exactly as each app's index.css does.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-themes'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  viteFinal: async (cfg) => {
    cfg.plugins = cfg.plugins ?? [];
    cfg.plugins.push(tailwindcss());
    return cfg;
  },
};

export default config;
