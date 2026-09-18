const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('glb');

// expo-three 8 still imports the pre-SDK-54 FileSystem API. Its callers need
// the legacy JS entrypoint, while native autolinking uses SDK 54's module.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-file-system' &&
      /node_modules[\\/](expo-three|expo-asset-utils|@expo[\\/]browser-polyfill)[\\/]/.test(context.originModulePath)) {
    return context.resolveRequest(context, 'expo-file-system/legacy', platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
