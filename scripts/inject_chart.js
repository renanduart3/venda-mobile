const fs = require('fs');
const p = 'app/relatorios.tsx';
let s = fs.readFileSync(p, 'utf8');
if (!s.includes("import ReportChartRenderer")) {
  s = s.replace(/(import\s+\{\s*useTheme\s*\}\s+from\s+'@\/contexts\/ThemeContext';)/, `$1\nimport ReportChartRenderer from '@/components/ReportChartRenderer';`);
}
// Inject chart preview before export section title
s = s.replace(/<Text style=\{styles\.sectionTitle\}>Formato de Exporta\u[0-9A-F]{4,6}o<\/Text>/, match => {
  return (
    `<Text style={styles.sectionTitle}>Visualização (preview)</Text>\n` +
    `            <ReportChartRenderer reportId={selectedReport?.id} data={reportData} />\n` +
    match
  );
});
fs.writeFileSync(p, s, 'utf8');
console.log('relatorios.tsx chart injected');
