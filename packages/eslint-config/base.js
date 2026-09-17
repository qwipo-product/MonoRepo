import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

/**
 * Shared flat config for every JS/TS workspace in the repo.
 *
 * Deliberately quiet. Lint here exists to catch things that will actually
 * break a mockup — an undefined variable, an unreachable branch — not to
 * enforce house style on code that is, by design, throwaway. Anything that
 * would make someone argue with the linter instead of iterating on the
 * product is turned off.
 *
 * Type-aware rules are NOT enabled: they need a full program per lint run,
 * which roughly triples lint time for very little signal on mock code.
 */
export const base = defineConfig([
  globalIgnores(['**/dist/**', '**/build/**', '**/storybook-static/**', '**/.turbo/**', '**/*.tsbuildinfo']),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Mock data is full of intentionally-unused scaffolding. Warn, never error.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      // `any` is a legitimate escape hatch when you're sketching a screen.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      // console.log is how you debug a prototype.
      'no-console': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
]);

export default base;
