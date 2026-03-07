const fs = require('fs');
const { execSync } = require('child_process');
fs.writeFileSync('help_utf8.txt', execSync('npx react-native-bootsplash generate -h', { encoding: 'utf-8' }));
