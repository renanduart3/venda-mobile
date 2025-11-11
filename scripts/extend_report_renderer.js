const fs = require('fs');
const p = 'components/ReportChartRenderer.tsx';
let s = fs.readFileSync(p, 'utf8');
if (s.includes("case '2':") && s.includes("case '6':")) { console.log('Already updated'); process.exit(0); }
const re = /default:\n\s*return \{ title: 'Gráfico',[\s\S]*?\};/m;
const replacement = `case '2': {\n      const items = (data || []).map((r:any)=>({ label: String(r.productName||'Produto'), value: Number(r.percentage||0) }));\n      return { title: 'Curva ABC - % Receita por Produto', items, orientation: 'horizontal', hint: 'Percentual de receita por produto (ordem cumulativa define A/B/C)' };\n    }\n    case '6': {\n      const items = (data || []).map((r:any)=>({ label: String(r.customerName||'Cliente'), value: Number(r.totalSpent||0) }))\n        .slice(0,10);\n      return { title: 'Ranking de Clientes (Valor Gasto)', items, orientation: 'horizontal', hint: 'Top 10 por valor gasto' };\n    }\n    default:\n      return { title: 'Gráfico', items: [], orientation: 'vertical' };`;
s = s.replace(re, replacement);
fs.writeFileSync(p, s, 'utf8');
console.log('ReportChartRenderer extended for 2 and 6');
