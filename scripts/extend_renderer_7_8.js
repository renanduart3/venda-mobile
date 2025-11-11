const fs = require('fs');
const p = 'components/ReportChartRenderer.tsx';
let s = fs.readFileSync(p, 'utf8');
if (s.includes("case '7':") && s.includes("case '8':")) { console.log('Already updated 7/8'); process.exit(0); }
const re = /default:\n\s*return \{ title: 'Gr[íi]fico',[\s\S]*?\};/m;
const replacement = `case '7': {\n      // Inativos: dias desde última compra (Top 10)\n      const items = (data || [])\n        .map((r:any)=>({ label: String(r.customerName||'Cliente'), value: daysSince(r.lastPurchase) }))\n        .sort((a:any,b:any)=>b.value-a.value)\n        .slice(0,10);\n      return { title: 'Clientes Inativos (dias desde última compra)', items, orientation: 'horizontal', hint: 'Top 10 mais inativos' };\n    }\n    case '8': {\n      // Margem de lucro % por produto (Top 10)\n      const items = (data || [])\n        .map((r:any)=>({ label: String(r.productName||'Produto'), value: Number(r.profitMarginPercentage||0) }))\n        .sort((a:any,b:any)=>b.value-a.value)\n        .slice(0,10);\n      return { title: 'Margem de Lucro por Produto (%)', items, orientation: 'horizontal', hint: 'Top 10 por % de margem' };\n    }\n    default:\n      return { title: 'Gráfico', items: [], orientation: 'vertical' };`;
if (!re.test(s)) { console.error('Default block not found'); process.exit(1); }
s = s.replace(re, replacement);
s = s.replace(/function mapData\([\s\S]*?\) \{/, match => match + `\n  function daysSince(value:any){ try{ const d=new Date(value); if(!isNaN(d.getTime())){ const now=new Date(); return Math.max(0, Math.round((now.getTime()-d.getTime())/(1000*60*60*24))); } }catch{} return 0; }\n`);
fs.writeFileSync(p, s, 'utf8');
console.log('ReportChartRenderer extended for 7 and 8');
