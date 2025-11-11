const fs = require('fs');
const path = 'app/settings.tsx';
let s = fs.readFileSync(path, 'utf8');
const repl = `  const loadStoreSettings = async () => {\n    const { loadStoreSettings: loadStoreSettingsData } = await import('@/lib/data-loader');\n    const data = await loadStoreSettingsData();\n    // Normaliza: se vier como objetos { value }, converte para string\n    if (Array.isArray((data as any).pixKeys) && typeof (data as any).pixKeys[0] === 'object') {\n      const converted = (data as any).pixKeys.map((k: any) => (k?.value ?? ''));\n      setStoreSettings({ ...(data as any), pixKeys: converted });\n    } else {\n      setStoreSettings(data as any);\n    }\n    // Sincroniza cores personalizadas se existirem no banco\n    const primary = (data as any).primaryColor;\n    const secondary = (data as any).secondaryColor;\n    if (primary || secondary) {\n      setCustomColors({\n        primary: (typeof primary === 'string' && primary) ? primary : customColors.primary,\n        secondary: (typeof secondary === 'string' && secondary) ? secondary : customColors.secondary,\n      });\n    }\n  };`;
s = s.replace(/const\s+loadStoreSettings\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*?\};/, repl);
fs.writeFileSync(path, s, 'utf8');
console.log('loadStoreSettings updated');
