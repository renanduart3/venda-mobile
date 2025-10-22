const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force SDK 54
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
