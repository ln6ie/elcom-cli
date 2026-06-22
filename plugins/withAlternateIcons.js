const { withInfoPlist } = require('expo/config-plugins');

module.exports = function withAlternateIcons(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.CFBundleIcons = config.modResults.CFBundleIcons || {};
    config.modResults.CFBundleIcons.CFBundleAlternateIcons = {
      DarkMode: {
        CFBundleIconFiles: ['icon_dark'],
        UIPrerenderedIcon: false,
      },
    };
    return config;
  });
};
