const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/**/*.styles.ts', { cwd: __dirname, absolute: true });

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('export default')) {
        content += '\n\n// Workaround para o Expo Router não reclamar de ausência de default export:\nexport default function StyleRoute() { return null; }\n';
        fs.writeFileSync(file, content, 'utf8');
    }
}
console.log('Arquivos de estilo ajustados para remover os avisos no Expo Router.');
