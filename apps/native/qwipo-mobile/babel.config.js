// NativeWind v4 babel setup: the Expo preset with the NativeWind jsxImportSource
// (enables `className` on RN components), plus the NativeWind babel preset.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
