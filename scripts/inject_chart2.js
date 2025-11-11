const fs = require('fs');
const p = 'app/relatorios.tsx';
let s = fs.readFileSync(p, 'utf8');
const marker = '<Text style={styles.sectionTitle}>Formato de Exportação</Text>';
if (s.includes(marker)) {
  const inject = [
    '<Text style={styles.sectionTitle}>Visualização (preview)</Text>',
    '            <ReportChartRenderer reportId={selectedReport?.id} data={reportData} />',
    '',
    '            ' + marker
  ].join('\n');
  s = s.replace(marker, inject);
  fs.writeFileSync(p, s, 'utf8');
  console.log('Inserted preview');
} else {
  console.log('Marker not found');
}
