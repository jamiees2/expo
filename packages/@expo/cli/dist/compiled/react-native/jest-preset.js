'use strict';

module.exports = {
  haste: {
    defaultPlatform: 'ios',
    platforms: ['android', 'ios', 'native']
  },
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': require.resolve("./jest/assetFileTransformer.js")
  },
  transformIgnorePatterns: ['node_modules/(?!((jest-)?react-native|@react-native(-community)?)/)'],
  setupFiles: [require.resolve("./jest/setup.js")],
  testEnvironment: require.resolve("./jest/react-native-env.js")
};
//# sourceMappingURL=jest-preset.js.map