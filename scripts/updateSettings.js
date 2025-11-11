const fs = require('fs');
const path = 'app/settings.tsx';
let s = fs.readFileSync(path, 'utf8');
if (!s.includes("import db from '@/lib/db';")) {
  s = s.replace(
    /(import\s+\{\s*useSafeAreaInsets\s*\}\s+from\s+'react-native-safe-area-context';)/,
    "$1\nimport db from '@/lib/db';"
  );
}
const newFunc = `  const saveStoreSettings = async () => {\n    try {\n      const now = new Date().toISOString();\n\n      // Normalize and serialize PIX keys (store as JSON array)\n      const pixKeys = (storeSettings.pixKeys || [])\n        .map((k) => (typeof k === 'string' ? k.trim() : ''))\n        .filter((k) => k.length > 0);\n      const pix_key = JSON.stringify(pixKeys);\n\n      // Find existing row, if any\n      const rows = await db.all('store_settings');\n      const existing = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;\n      const id = existing?.id || 'main';\n\n      const payload: any = {\n        store_name: storeSettings.storeName?.trim() || '',\n        owner_name: storeSettings.ownerName?.trim() || '',\n        pix_key,\n        primary_color: customColors.primary,\n        secondary_color: customColors.secondary,\n        updated_at: now,\n      };\n\n      if (existing) {\n        await db.update('store_settings', payload, 'id = ?', [id]);\n      } else {\n        await db.insert('store_settings', {\n          id,\n          ...payload,\n          created_at: now,\n        });\n      }\n\n      // Apply theme colors immediately\n      setPrimaryColor(customColors.primary);\n      setSecondaryColor(customColors.secondary);\n\n      Alert.alert('Sucesso', 'Configurações salvas com sucesso!');\n      setIsEditing(false);\n\n      // Reload from DB to ensure UI reflects persisted state\n      await loadStoreSettings();\n    } catch (error) {\n      console.error('Erro ao salvar configurações da loja:', error);\n      Alert.alert('Erro', 'Não foi possível salvar as configurações.');\n    }\n  };`;
s = s.replace(/const\s+saveStoreSettings\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*?\};/, newFunc);
fs.writeFileSync(path, s, 'utf8');
console.log('settings.tsx updated');
