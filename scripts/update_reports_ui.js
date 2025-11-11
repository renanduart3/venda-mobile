const fs = require('fs');
const p = 'app/relatorios.tsx';
let s = fs.readFileSync(p, 'utf8');
// Remove exportReportToCSV import and FileSpreadsheet icon
s = s.replace(/,\s*exportReportToCSV\s*\}/, '}');
s = s.replace(/,\s*FileSpreadsheet/, '');
// Default format to PDF only
s = s.replace(/useState<'pdf' \| 'excel' \| null>\(null\)/, "useState<'pdf'>('pdf')");
// Remove else-branch that exports CSV in handleGenerateReport
s = s.replace(/\}\s*else\s*\{[\s\S]*?\}\s*\n\s*\}/, "}\n    }\n  }");
// Remove Excel button block in modal
s = s.replace(/\n\s*<TouchableOpacity[\s\S]*?Excel[\s\S]*?<\/TouchableOpacity>\n\s*<\/View>/, '\n            </View>');
// Relax canGenerateReport check
s = s.replace(/const canGenerateReport = [^;]+;/, 'const canGenerateReport = !isFetchingReport && !reportError;');
fs.writeFileSync(p, s, 'utf8');
console.log('relatorios.tsx updated');
