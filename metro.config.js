const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // The box model is bundled as a binary asset and loaded by Filament.
    assetExts: [...defaultConfig.resolver.assetExts, 'glb'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
