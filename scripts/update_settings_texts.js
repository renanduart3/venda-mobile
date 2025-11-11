const fs = require('fs');
const p = 'app/settings.tsx';
let s = fs.readFileSync(p, 'utf8');
// Switch FileSystem to legacy
s = s.replace(/import \* as FileSystem from 'expo-file-system';/, "import * as FileSystem from 'expo-file-system/legacy';");
// Update button label to include (.db)
s = s.replace("'Backup do Banco'", "'Backup do Banco (.db)'");
// Clarify success message after export share
s = s.replace(/Alert\.alert\('\u2705 Exporta[\s\S]*?,\s*'[^']*exportado[^']*'\)/, "Alert.alert('Backup do Banco (.db)', 'Backup gerado: arquivo .db criado. Você pode salvar/compartilhar localmente. Não é backup na nuvem.')");
// Clarify import success message
s = s.replace(/Alert\.alert\(\s*'\u2705 Importa[\s\S]*?importado com sucesso![\s\S]*?\)\s*;/, "Alert.alert('Restauração do Banco (.db)', 'Banco de dados importado com sucesso!\n\nEste é um backup LOCAL do arquivo .db. Não é backup na nuvem.\nO banco anterior foi salvo como backup caso precise restaurar.');");
fs.writeFileSync(p, s, 'utf8');
console.log('settings.tsx updated');
