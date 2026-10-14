import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import { versionBadgeManagerHead } from '@mockups/version-badge/storybook';

/**
 * Storybook for the Qwipo design system.
 *
 * Same rendering stack as the apps: Vite + React + Tailwind v4, with the
 * design tokens as the single source of truth. Tailwind does not scan
 * node_modules, so `.storybook/tailwind.css` points `@source` at the package
 * sources — exactly as each app's index.css does.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-themes'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  // Deployed-version pill on the manager shell (sidebar/toolbar), the same
  // badge the apps mount in main.tsx. Reads VITE_APP_VERSION at build time.
  managerHead: (head) => head + versionBadgeManagerHead(),
  viteFinal: async (cfg) => {
    cfg.plugins = cfg.plugins ?? [];
    cfg.plugins.push(tailwindcss());
    return cfg;
  },
};

export default config;
