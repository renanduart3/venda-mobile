const fs = require('fs');
const p = 'app/_layout.tsx';
let s = fs.readFileSync(p, 'utf8');
if (!s.includes('function ThemeBootstrapper(')) {
  if (!s.includes("import { useEffect as useEffect2 } from 'react';")) {
    s = s.replace(
      /(import\s+\{\s*ThemeProvider,\s*useTheme\s*\}\s+from\s+'@\/contexts\/ThemeContext';)/,
      "$1\nimport { useEffect as useEffect2 } from 'react';"
    );
  }
  const comp = `\n\nfunction ThemeBootstrapper() {\n  const { setPrimaryColor, setSecondaryColor } = useTheme();\n  useEffect2(() => {\n    (async () => {\n      try {\n        const { loadStoreSettings } = await import('@/lib/data-loader');\n        const data = await loadStoreSettings();\n        if (data && typeof data === 'object') {\n          if ((data).primaryColor) setPrimaryColor((data).primaryColor);\n          if ((data).secondaryColor) setSecondaryColor((data).secondaryColor);\n        }\n      } catch (e) {\n        // ignore\n      }\n    })();\n  }, []);\n  return null;\n}\n`;
  s = s + comp;
  s = s.replace(
    /<ThemeProvider>\s*\n\s*<AuthProvider>/,
    '<ThemeProvider>\n        <ThemeBootstrapper />\n        <AuthProvider>'
  );
  fs.writeFileSync(p, s, 'utf8');
  console.log('Layout updated');
} else {
  console.log('Bootstrapper already present');
}
