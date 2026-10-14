#!/usr/bin/env bun
/**
 * Scaffold a new mockup app.
 *
 *   bun run new                      # asks for a name
 *   bun run new distributor-portal   # or just tell it
 *   bun run new admin --web          # desktop/web frame instead of a phone frame
 *
 * Creates apps/frontend/<name>/ wired to every shared package, picks the next
 * free dev port, and prints the two commands you need next. Nothing else in
 * the repo has to be touched — Bun workspaces glob `apps/frontend/*` and Turbo
 * discovers the new package on its next run.
 */

import { $ } from 'bun';
import { existsSync } from 'node:fs';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const FRONTEND = join(ROOT, 'apps', 'frontend');

// ── args ─────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const isWeb = argv.includes('--web');
let name = argv.find((a) => !a.startsWith('-'));

if (!name) {
  process.stdout.write('Name for the new mockup (kebab-case, e.g. seller-dashboard): ');
  name = (await new Response(Bun.stdin.stream()).text()).trim().split('\n')[0]?.trim();
}

if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error(`✗ "${name ?? ''}" is not a valid name. Use kebab-case: my-new-app`);
  process.exit(1);
}

const dir = join(FRONTEND, name);
if (existsSync(dir)) {
  console.error(`✗ apps/frontend/${name} already exists.`);
  process.exit(1);
}

// ── pick the next free dev port ──────────────────────────────────────────────

const existing = await readdir(FRONTEND, { withFileTypes: true });
const usedPorts = new Set<number>();
for (const entry of existing) {
  if (!entry.isDirectory()) continue;
  const cfg = join(FRONTEND, entry.name, 'vite.config.ts');
  if (!existsSync(cfg)) continue;
  const match = (await Bun.file(cfg).text()).match(/port:\s*Number\(process\.env\.PORT\)\s*\|\|\s*(\d+)/);
  if (match) usedPorts.add(Number(match[1]));
}
let port = 5173;
while (usedPorts.has(port)) port += 1;

// ── template ─────────────────────────────────────────────────────────────────

const title = name
  .split('-')
  .map((w) => w[0]!.toUpperCase() + w.slice(1))
  .join(' ');

// A phone-sized frame for mobile mockups; full-bleed for web ones.
const shell = isWeb
  ? `      <div className="min-h-dvh bg-background text-foreground">\n        {/* Your web mockup starts here. */}\n        <Home />\n      </div>`
  : `      <div className="min-h-dvh bg-shell grid place-items-center p-4">\n        {/* 390×844 ≈ iPhone 15. Design inside this frame.\n\n            \`relative\` is load-bearing: @mockups/ui's Sheet renders\n            \`absolute inset-0\` and fills its nearest positioned ancestor.\n            Drop it and every bottom sheet escapes the phone and covers the\n            whole browser window. */}\n        <div className="relative w-[390px] h-[844px] overflow-hidden rounded-[2rem] bg-background text-foreground shadow-xl">\n          <div className="h-full overflow-y-auto">\n            <Home />\n          </div>\n        </div>\n      </div>`;

/* ── which design system the new app rides ───────────────────────────────────
 *
 * Mobile mockups get the mobile-first kit: @mockups/ui primitives on
 * @mockups/design-tokens, whose theme.css the app imports whole. The app
 * declares no tokens of its own — one design language, shared.
 *
 * Web mockups get the desktop/admin kit: @mockups/web-ui (shadcn + Radix —
 * data tables, dialogs, the app shell) on @mockups/web-tokens, which ships a
 * complete theme.css so the app needs no `@theme` block of its own.
 *
 * These are deliberately two design languages, not two skins: 44px tap
 * targets and 12px radii on mobile, 36px controls and 8px radii on a dense
 * admin screen. Don't import both token layers into one app — the later
 * import would win every shared custom property.
 */
const deps = isWeb
  ? {
      '@mockups/version-badge': 'workspace:*',
      '@mockups/web-tokens': 'workspace:*',
      '@mockups/web-ui': 'workspace:*',
      'lucide-react': 'catalog:',
      'next-themes': 'catalog:',
      react: 'catalog:',
      'react-dom': 'catalog:',
      'react-router': 'catalog:',
    }
  : {
      '@mockups/design-tokens': 'workspace:*',
      '@mockups/ui': 'workspace:*',
      '@mockups/version-badge': 'workspace:*',
      'lucide-react': 'catalog:',
      react: 'catalog:',
      'react-dom': 'catalog:',
    };

// next-themes drives the `.dark` class the web token layer keys off; the
// mobile kit has its own ThemeProvider.
const mainTsx = isWeb
  ? `import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport { ThemeProvider } from 'next-themes';\nimport { HashRouter } from 'react-router';\nimport { VersionBadge } from '@mockups/version-badge';\nimport './index.css';\nimport App from './App';\n\ncreateRoot(document.getElementById('root')!).render(\n  <StrictMode>\n    {/* attribute="class" is the contract @mockups/web-tokens keys its dark\n        variant off — every dark rule is scoped under \`.dark\`. */}\n    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>\n      <HashRouter>\n        <App />\n      </HashRouter>\n      {/* Deployed version — outside the router so it is on every screen. */}\n      <VersionBadge />\n    </ThemeProvider>\n  </StrictMode>\n);\n`
  : `import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport { ThemeProvider } from '@mockups/ui';\nimport { VersionBadge } from '@mockups/version-badge';\nimport './index.css';\nimport App from './App';\n\ncreateRoot(document.getElementById('root')!).render(\n  <StrictMode>\n    <ThemeProvider>\n      <App />\n      {/* Deployed version — outside the phone frame, on every screen. */}\n      <VersionBadge />\n    </ThemeProvider>\n  </StrictMode>\n);\n`;

const indexCss = isWeb
  ? `@import "tailwindcss";\n\n/* Tailwind never scans node_modules, and workspace packages are symlinked\n   there — so point it at the shared source or @mockups/web-ui renders\n   unstyled and nothing errors. */\n@source "../../../../packages/web-ui/src";\n\n/* Desktop/admin tokens: light + \`.dark\`, @theme, Radix animations, and the\n   dark-mode utility rebinding layer. This app needs no @theme block of its\n   own — change a token in packages/web-tokens, not here. */\n@import "../../../../packages/web-tokens/theme.css";\n\nhtml,\nbody,\n#root {\n  height: 100%;\n}\n\nbody {\n  margin: 0;\n}\n`
  : `@import "tailwindcss";\n\n/* Tailwind never scans node_modules, and workspace packages are symlinked\n   there — so point it at the shared source or @mockups/ui renders unstyled. */\n@source "../../../../packages/ui/src";\n\n/* The mobile token layer: light + \`.dark\`, @theme, the .type-* role classes\n   and the sheet animations. One design language shared by every mockup —\n   this app defines no tokens of its own. Change a value in\n   packages/design-tokens (tokens.ts AND theme.css), not here. */\n@import "../../../../packages/design-tokens/theme.css";\n\nhtml,\nbody,\n#root {\n  height: 100%;\n}\n\nbody {\n  margin: 0;\n}\n`;

const homeTsx = isWeb
  ? `import { Button, Card, CardContent, CardHeader, CardTitle, StatusBadge } from '@mockups/web-ui';\n\nexport default function Home() {\n  return (\n    <div className="p-6 space-y-6">\n      <div>\n        <h1 className="text-2xl font-semibold">${title}</h1>\n        <p className="mt-1 text-sm text-muted-foreground">\n          Delete this screen and build the real thing. The desktop kit is already wired up.\n        </p>\n      </div>\n\n      <Card className="max-w-lg">\n        <CardHeader>\n          <CardTitle className="text-base font-semibold">The web kit is ready</CardTitle>\n        </CardHeader>\n        <CardContent className="space-y-3">\n          <p className="text-sm">\n            Tables, dialogs, sheets, comboboxes, charts and AppShell all come from\n            @mockups/web-ui. See its README and Seller Store’s design handbook.\n          </p>\n          <div className="flex items-center gap-2">\n            <StatusBadge tone="success">Verified</StatusBadge>\n            <StatusBadge tone="warning">Pending</StatusBadge>\n            <StatusBadge tone="danger">Rejected</StatusBadge>\n          </div>\n          <Button onClick={() => alert('Wire me up')}>Do the thing</Button>\n        </CardContent>\n      </Card>\n    </div>\n  );\n}\n`
  : `import { Button, Card, CardContent, CardHeader, CardTitle } from '@mockups/ui';\n\nexport default function Home() {\n  return (\n    <div className="p-4 space-y-4">\n      <h1 className="text-xl font-semibold">${title}</h1>\n      <p className="text-sm text-muted-foreground">\n        Delete this screen and build the real thing. The shared kit is already wired up.\n      </p>\n\n      <Card>\n        <CardHeader>\n          <CardTitle>The mobile kit is ready</CardTitle>\n        </CardHeader>\n        <CardContent className="space-y-2">\n          <p className="text-sm">Add screen fixtures in this app when they are needed.</p>\n          <Button onClick={() => alert('Wire me up')}>Do the thing</Button>\n        </CardContent>\n      </Card>\n    </div>\n  );\n}\n`;

const files: Record<string, string> = {
  'package.json': `${JSON.stringify(
    {
      name: `@mockups/${name}`,
      version: '0.0.0',
      private: true,
      type: 'module',
      license: 'UNLICENSED',
      description: `${title} mockup.`,
      scripts: {
        dev: `vite --port ${port}`,
        build: 'vite build',
        preview: `vite preview --port ${port + 1000}`,
        typecheck: 'tsc --noEmit -p tsconfig.json',
        lint: 'eslint .',
        clean: 'rm -rf dist .turbo .vite *.tsbuildinfo',
      },
      dependencies: deps,
      devDependencies: {
        '@mockups/eslint-config': 'workspace:*',
        '@mockups/tsconfig': 'workspace:*',
        '@tailwindcss/vite': 'catalog:',
        '@types/react': 'catalog:',
        '@types/react-dom': 'catalog:',
        '@vitejs/plugin-react': 'catalog:',
        eslint: 'catalog:',
        tailwindcss: 'catalog:',
        typescript: 'catalog:',
        vite: 'catalog:',
      },
    },
    null,
    2
  )}\n`,

  'tsconfig.json': `{\n  "extends": "@mockups/tsconfig/react-app.json",\n  "include": ["src", "vite.config.ts"]\n}\n`,

  'eslint.config.js': `import { react } from '@mockups/eslint-config/react';\n\nexport default react;\n`,

  'vite.config.ts': `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nimport tailwindcss from '@tailwindcss/vite';\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n  // Relative asset URLs: preview builds are served from /builds/<branch>/<sha>/.\n  // Safe because the app routes on the URL hash, so the document path never changes.\n  base: "./",\n  server: {\n    port: Number(process.env.PORT) || ${port},\n    host: true,\n  },\n  preview: { host: true, allowedHosts: true },\n});\n`,

  'index.html': `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${title} — mockup</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,

  'src/main.tsx': mainTsx,

  'src/App.tsx': `import Home from './screens/Home';\n\nexport default function App() {\n  return (\n${shell}\n  );\n}\n`,

  'src/screens/Home.tsx': homeTsx,

  'src/index.css': indexCss,

  'src/vite-env.d.ts': `/// <reference types="vite/client" />\n`,
};

// ── write ────────────────────────────────────────────────────────────────────

for (const [rel, contents] of Object.entries(files)) {
  const path = join(dir, rel);
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, contents);
}

console.log(`\n✓ Created apps/frontend/${name}  (dev port ${port})\n`);

// Link the new workspace so `bun dev` works immediately.
console.log('  Linking workspace…');
await $`bun install`.cwd(ROOT).quiet();

console.log(`
  Next:
    bun dev --filter=@mockups/${name}     →  http://localhost:${port}

  Then point Claude at apps/frontend/${name}/src and describe the screens
  you want. Read CLAUDE.md first if you haven't — it tells Claude which
  shared package to reach for instead of reinventing one.
`);
