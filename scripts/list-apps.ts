#!/usr/bin/env bun
/**
 * `bun run ls` — what's in this lab, and how do I open it?
 *
 * Reads every workspace package.json and prints apps with their dev port and
 * one-liner description, then the shared packages. Cheaper than remembering.
 */

import { Glob } from 'bun';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');

type Pkg = {
  name?: string;
  description?: string;
  scripts?: Record<string, string>;
};

async function read(rel: string) {
  const pkg = (await Bun.file(join(ROOT, rel)).json()) as Pkg;
  // Each frontend declares its Vite port in the dev script.
  const dev = pkg.scripts?.dev ?? '';
  const port = dev.match(/--port\s+(\d+)/)?.[1];
  return { dir: rel.replace('/package.json', ''), pkg, port };
}

const apps = [];
const packages = [];

for await (const rel of new Glob('apps/frontend/*/package.json').scan(ROOT)) apps.push(await read(rel));
for await (const rel of new Glob('packages/*/package.json').scan(ROOT)) packages.push(await read(rel));

apps.sort((a, b) => a.dir.localeCompare(b.dir));
packages.sort((a, b) => a.dir.localeCompare(b.dir));

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

console.log(`\n${bold('APPS')}   ${dim('bun dev --filter=<name>')}`);
for (const { dir, pkg, port } of apps) {
  const where = port ? `http://localhost:${port}` : dim('(no dev server)');
  console.log(`\n  ${bold(pkg.name ?? dir)}  ${where}`);
  console.log(`  ${dim(dir)}`);
  if (pkg.description) console.log(`  ${pkg.description}`);
}

console.log(`\n${bold('SHARED PACKAGES')}   ${dim("import { … } from '<name>'")}`);
for (const { dir, pkg } of packages) {
  console.log(`\n  ${bold(pkg.name ?? dir)}`);
  console.log(`  ${dim(dir)}`);
  if (pkg.description) console.log(`  ${pkg.description}`);
}

console.log(`\n${dim('New mockup:  bun run new <name>')}\n`);
