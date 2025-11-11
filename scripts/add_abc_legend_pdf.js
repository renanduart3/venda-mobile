const fs = require('fs');
const p = 'lib/export.ts';
let s = fs.readFileSync(p, 'utf8');
const key = "if (reportId === '2') {";
const i = s.indexOf(key);
if (i < 0) { console.error('case 2 not found'); process.exit(1); }
let k = s.indexOf('{', i);
let depth = 0; let end = -1;
for (; k < s.length; k++) {
  const ch = s[k];
  if (ch === '{') depth++;
  else if (ch === '}') { depth--; if (depth === 0) { end = k + 1; break; } }
}
if (end < 0) { console.error('block end not found'); process.exit(1); }
const replacement = [
  "    if (reportId === '2') {",
  "      const items = rows.map((r:any)=>{",
  "        const perc = Number((r as any).percentage || 0);",
  "        const cum = Number((r as any).cumulativePercentage || 0);",
  "        const cat = (r as any).category || (cum <= 80 ? 'A' : (cum <= 95 ? 'B' : 'C'));",
  "        const color = cat === 'A' ? '#16a34a' : (cat === 'B' ? '#f59e0b' : '#6b7280');",
  "        return { label: String((r as any).productName || 'Produto'), value: perc, color };",
  "      });",
  "      const max = Math.max(1, ...items.map((i:any)=>i.value));",
  "      const bars = items.map((i:any)=>'"+
  "<div class=\\\"row\\\"><div class=\\\"lbl\\\">'+i.label+'</div><div class=\\\"bar-bg\\\"><div class=\\\"bar\\\" style=\\\"width:'+((i.value/max)*100).toFixed(2)+'%; background:'+i.color+'\\\"></div></div><div class=\\\"val\\\">'+num(i.value)+'%'+"+
  "'</div></div>').join('');",
  "      const legend = '<div style=\\\"margin-top:8px;font-size:12px;color:#374151\\\">' +",
  "        '<span style=\\\"display:inline-block;width:10px;height:10px;background:#16a34a;border-radius:2px;margin-right:6px\\\"></span>A (≤80%)  ' +",
  "        '<span style=\\\"display:inline-block;width:10px;height:10px;background:#f59e0b;border-radius:2px;margin:0 6px\\\"></span>B (≤95%)  ' +",
  "        '<span style=\\\"display:inline-block;width:10px;height:10px;background:#6b7280;border-radius:2px;margin:0 6px\\\"></span>C (>95%)' +",
  "      '</div>';",
  "      return style + '<div><strong>Curva ABC - % Receita por Produto</strong>' + bars + legend + '</div>';",
  "    }"
].join('\n');
const updated = s.slice(0, i) + replacement + s.slice(end);
fs.writeFileSync(p, updated, 'utf8');
console.log('Added legend to ABC in PDF');
