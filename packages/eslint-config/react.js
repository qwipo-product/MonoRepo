import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig } from 'eslint/config';
import { base } from './base.js';

/**
 * Flat config for React apps and React packages: the base rules plus the two
 * that genuinely save time — Rules of Hooks (silent, baffling bugs otherwise)
 * and react-refresh (a bad export shape breaks hot reload, which is the whole
 * point of working on a mockup).
 */
export const react = defineConfig([
  ...base,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    rules: {
      // A screen file exporting both a component and a helper constant is a
      // normal thing to do here; downgrade the HMR nag to a warning.
      'react-refresh/only-export-components': 'warn',

      // react-hooks v7 ships the React Compiler's optimizability rules. They
      // are about whether a component can be auto-memoised — not about whether
      // it is correct. On prototype code they fire constantly (a counter
      // mutated inside a .map, a setState that fakes an async fetch resolving)
      // and the "fix" is usually a restructure nobody wants to do to a mockup.
      // Warn so they're visible; never block.
      // `react-hooks/rules-of-hooks` deliberately stays an error — breaking
      // that one produces real, baffling bugs.
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
]);

export default react;
