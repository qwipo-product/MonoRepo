// Metro for a Bun/Turborepo monorepo + NativeWind.
// Watches the workspace root so the symlinked @mockups/* packages resolve, and
// pipes the Tailwind entry (global.css) through NativeWind.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
// apps/native/qwipo-mobile -> repo root is three levels up.
const workspaceRoot = path.resolve(projectRoot, '../../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Shared packages ship raw TypeScript (no build step) — let Metro resolve them.
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: './global.css' });
