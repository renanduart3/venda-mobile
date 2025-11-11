const fs = require('fs');
const p = 'lib/export.ts';
let s = fs.readFileSync(p, 'utf8');
const i5 = s.indexOf("if (reportId === '5')");
const retIdx = s.indexOf("return '';", i5);
if (i5 >= 0 && retIdx > i5) {
  const inject = `\n    if (reportId === '2') {\n      const items = rows.map((r:any)=>({ label: String(r.productName||'Produto'), value: Number(r.percentage||0) }));\n      const max = Math.max(1,...items.map(i=>i.value));\n      const bars = items.map(i=>\`<div class=\"row\"><div class=\"lbl\">\${i.label}</div><div class=\"bar-bg\"><div class=\"bar\" style=\"width:\${(i.value/max)*100}%\"></div></div><div class=\"val\">\${num(i.value)}%</div></div>\`).join('');\n      return \`${'${style}'}<div><strong>Curva ABC - % Receita por Produto</strong>\${'${bars}'}</div>\`;\n    }\n    if (reportId === '6') {\n      const items = rows.map((r:any)=>({ label: String(r.customerName||'Cliente'), value: Number(r.totalSpent||0) })).slice(0,10);\n      const max = Math.max(1,...items.map(i=>i.value));\n      const bars = items.map(i=>\`<div class=\"row\"><div class=\"lbl\">\${i.label}</div><div class=\"bar-bg\"><div class=\"bar\" style=\"width:\${(i.value/max)*100}%\"></div></div><div class=\"val\">R$ \${num(i.value)}</div></div>\`).join('');\n      return \`${'${style}'}<div><strong>Ranking de Clientes (Valor Gasto)</strong>\${'${bars}'} </div>\`;\n    }\n`;
  s = s.slice(0, retIdx) + inject + s.slice(retIdx);
  fs.writeFileSync(p, s, 'utf8');
  console.log('Injected ABC and RFV into chart HTML');
} else {
  console.log('Could not locate injection point');
}
