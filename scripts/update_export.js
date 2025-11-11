const fs = require('fs');
const path = 'lib/export.ts';
let s = fs.readFileSync(path, 'utf8');
// Switch to legacy FileSystem
s = s.replace(/import \* as FileSystem from 'expo-file-system';/, "import * as FileSystem from 'expo-file-system/legacy';");
function replaceFunc(name, body) {
  const re = new RegExp(`export\\s+async\\s+function\\s+${name}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\}`, 'm');
  if (!re.test(s)) {
    console.error('Function not found:', name);
    return;
  }
  s = s.replace(re, `export async function ${name}() {\n  ${body}\n}`);
}
replaceFunc('exportDatabaseToCSV', "throw new Error('Exportação para CSV/JSON desativada. Utilize o backup do banco (.db) nas Configurações.');");
replaceFunc('exportTableToCSV', "throw new Error('Exportação para CSV desativada. Utilize o backup do banco (.db) nas Configurações.');");
replaceFunc('importDatabaseFromFile', "throw new Error('Importação de CSV/JSON desativada. Utilize a restauração do arquivo .db nas Configurações.');");
replaceFunc('importCSVFromFile', "throw new Error('Importação de CSV desativada. Utilize a restauração do arquivo .db nas Configurações.');");
replaceFunc('exportReportToCSV', "throw new Error('Exportação de relatórios em CSV desativada. Gere o PDF ou faça backup do banco (.db).');");
fs.writeFileSync(path, s, 'utf8');
console.log('lib/export.ts updated');
