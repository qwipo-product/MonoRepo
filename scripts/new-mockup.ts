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
 * the repo has to be touched — Bun workspaces glob `apps/*`/`*` and Turbo
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
  : `      <div className="min-h-dvh bg-shell grid place-items-center p-4">\n        {/* 390×844 ≈ iPhone 15. Design inside this frame. */}\n        <div className="w-[390px] h-[844px] overflow-y-auto rounded-[2rem] bg-background text-foreground shadow-xl">\n          <Home />\n        </div>\n      </div>`;

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
      dependencies: {
        '@mockups/i18n': 'workspace:*',
        '@mockups/mock-data': 'workspace:*',
        '@mockups/types': 'workspace:*',
        '@mockups/ui': 'workspace:*',
        'lucide-react': 'catalog:',
        react: 'catalog:',
        'react-dom': 'catalog:',
      },
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

  'vite.config.ts': `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nimport tailwindcss from '@tailwindcss/vite';\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n  server: {\n    port: Number(process.env.PORT) || ${port},\n    host: true,\n  },\n  preview: { host: true, allowedHosts: true },\n});\n`,

  'index.html': `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${title} — mockup</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,

  'src/main.tsx': `import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport { ThemeProvider } from '@mockups/ui';\nimport { I18nProvider } from '@mockups/i18n';\nimport './index.css';\nimport App from './App';\n\ncreateRoot(document.getElementById('root')!).render(\n  <StrictMode>\n    <ThemeProvider>\n      <I18nProvider>\n        <App />\n      </I18nProvider>\n    </ThemeProvider>\n  </StrictMode>\n);\n`,

  'src/App.tsx': `import Home from './screens/Home';\n\nexport default function App() {\n  return (\n${shell}\n  );\n}\n`,

  'src/screens/Home.tsx': `import { Button, Card, CardContent, CardHeader, CardTitle } from '@mockups/ui';\nimport { products } from '@mockups/mock-data';\n\nexport default function Home() {\n  return (\n    <div className="p-4 space-y-4">\n      <h1 className="text-xl font-semibold">${title}</h1>\n      <p className="text-sm text-muted-foreground">\n        Delete this screen and build the real thing. The shared kit is already wired up.\n      </p>\n\n      <Card>\n        <CardHeader>\n          <CardTitle>Mock data is ready</CardTitle>\n        </CardHeader>\n        <CardContent className="space-y-2">\n          <p className="text-sm">{products.length} products available from @mockups/mock-data.</p>\n          <Button onClick={() => alert('Wire me up')}>Do the thing</Button>\n        </CardContent>\n      </Card>\n    </div>\n  );\n}\n`,

  'src/index.css': `@import "tailwindcss";\n\n/* Tailwind never scans node_modules, and workspace packages are symlinked\n   there — so point it at the shared sources or @mockups/ui renders unstyled. */\n@source "../../../../packages/ui/src";\n\n/* Design tokens for this mockup. Change these, not the component internals.\n   Copy the block from apps/frontend/qwipo-buyer-app/src/index.css if you want\n   the full Qwipo palette. */\n@theme {\n  --color-primary: #2563eb;\n  --color-primary-foreground: #ffffff;\n  --color-background: #ffffff;\n  --color-foreground: #252525;\n  --color-card: #ffffff;\n  --color-muted: #ececf0;\n  --color-muted-foreground: #717182;\n  --color-shell: #f7f7f9;\n  --color-destructive: #d4183d;\n  --color-destructive-foreground: #ffffff;\n\n  --radius-lg: 8px;\n  --radius-xl: 12px;\n\n  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n}\n\nhtml,\nbody,\n#root {\n  height: 100%;\n}\n\nbody {\n  margin: 0;\n  font-family: var(--font-sans);\n  -webkit-font-smoothing: antialiased;\n}\n`,

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
