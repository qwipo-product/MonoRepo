// Standalone Expo + NativeWind app (outside the bun workspace) — stock config.
// Isolation gives a single react-native, so no resolver dedup hacks are needed.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// inlineRem:16 — NativeWind defaults rem→px at 14; the web (browser root) uses
// 16, so without this every text-* size renders 12.5% smaller than the bezel.
module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
