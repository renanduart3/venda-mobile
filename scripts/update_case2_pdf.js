const fs = require('fs');
const path = 'lib/export.ts';
let s = fs.readFileSync(path, 'utf8');
const key = "if (reportId === '2') {";
const i = s.indexOf(key);
if (i < 0) { console.error('case 2 not found'); process.exit(1); }
// find end of this if block by brace counting
let k = s.indexOf('{', i);
let depth = 0; let end = -1;
for (; k < s.length; k++) {
  const ch = s[k];
  if (ch === '{') depth++;
  else if (ch === '}') { depth--; if (depth === 0) { end = k + 1; break; } }
}
if (end < 0) { console.error('block end not found'); process.exit(1); }
const replacementLines = [
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
  "<div class=\\\"row\\\"><div class=\\\"lbl\\\">'+i.label+'</div><div class=\\\"bar-bg\\\"><div class=\\\"bar\\\" style=\\\"width:'+"+
  "((i.value/max)*100).toFixed(2)+'%; background:'+i.color+'\\\"></div></div><div class=\\\"val\\\">'+num(i.value)+'%'+"+
  "'</div></div>').join('');",
  "      return style + '<div><strong>Curva ABC - % Receita por Produto</strong>' + bars + '</div>';",
  "    }"
];
const updated = s.slice(0, i) + replacementLines.join('\n') + s.slice(end);
fs.writeFileSync(path, updated, 'utf8');
console.log('Updated PDF ABC colors');
