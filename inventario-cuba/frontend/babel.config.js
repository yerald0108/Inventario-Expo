module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated debe ir siempre al final
      'react-native-reanimated/plugin',
    ],
  };
};