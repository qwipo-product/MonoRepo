// Standalone Expo + NativeWind config. The app carries its own node_modules
// (Tailwind v3 alongside NativeWind), so no monorepo watch folders — Metro
// resolves everything from this project and won't pick up the web apps'
// Tailwind v4 at the repo root.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
