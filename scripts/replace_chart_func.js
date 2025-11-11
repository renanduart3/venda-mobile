const fs = require('fs');
const path = 'lib/export.ts';
let s = fs.readFileSync(path, 'utf8');
const startToken = 'export function generateReportChartHTML(';
const start = s.indexOf(startToken);
if (start < 0) { console.error('Function start not found'); process.exit(1); }
// find opening brace of function
const braceStart = s.indexOf('{', start);
if (braceStart < 0) { console.error('Opening brace not found'); process.exit(1); }
let i = braceStart;
let depth = 0;
for (; i < s.length; i++) {
  const ch = s[i];
  if (ch === '{') depth++;
  else if (ch === '}') { depth--; if (depth === 0) { i++; break; } }
}
if (depth !== 0) { console.error('Could not balance braces'); process.exit(1); }
const end = i; // slice end index
const newFunc = `export function generateReportChartHTML(reportId: string, reportData: any[]): string {
  try {
    const rows = Array.isArray(reportData) ? reportData : (reportData ? [reportData] : []);
    const style = `<style>
      .bar { height:12px;border-radius:6px;background:#4f46e5;}
      .bar-bg { height:12px;border-radius:6px;background:#e5e7eb;overflow:hidden;}
      .row { display:flex;align-items:center;gap:8px;margin:6px 0;}
      .lbl { width:140px; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
      .val { width:60px; font-size:12px; text-align:right;}
      .vwrap { display:flex; align-items:flex-end; gap:8px; height:140px; }
      .vbar { width:18px; background:#4f46e5; border-radius:6px 6px 0 0; display:inline-block;}
      .vlabel { font-size:10px; text-align:center; }
    </style>`;
    if (reportId === '1') {
      const items = rows.map((r:any)=>({ label: String(r.productName||'Produto'), value: Number(r.totalSold||0) })).slice(0,10);
      const max = Math.max(1,...items.map((i:any)=>i.value));
      const bars = items.map((i:any)=>`<div class="row"><div class="lbl">${i.label}</div><div class="bar-bg"><div class="bar" style="width:${(i.value/max)*100}%"></div></div><div class="val">${num(i.value)}</div></div>`).join('');
      return `${style}<div><strong>Top Produtos (Quantidade)</strong>${bars}</div>`;
    }
    if (reportId === '2') {
      const items = rows.map((r:any)=>({ label: String(r.productName||'Produto'), value: Number(r.percentage||0) }));
      const max = Math.max(1,...items.map((i:any)=>i.value));
      const bars = items.map((i:any)=>`<div class="row"><div class="lbl">${i.label}</div><div class="bar-bg"><div class="bar" style="width:${(i.value/max)*100}%"></div></div><div class="val">${num(i.value)}%</div></div>`).join('');
      return `${style}<div><strong>Curva ABC - % Receita por Produto</strong>${bars}</div>`;
    }
    if (reportId === '3') {
      const items = rows.map((r:any)=>({ label: dateLbl(r.date), value: Number(r.total_sales||0) }));
      const max = Math.max(1,...items.map((i:any)=>i.value));
      const bars = items.map((i:any)=>`<div style="display:inline-block;text-align:center"><div class="vbar" style="height:${Math.max(4,Math.round((i.value/max)*120))}px"></div><div class="vlabel">${i.label}</div></div>`).join('');
      return `${style}<div><strong>Tendência de Vendas (Receita)</strong><div class="vwrap">${bars}</div></div>`;
    }
    if (reportId === '4') {
      const items = rows.map((r:any)=>({ label: String(r.method||'N/A'), value: Number(r.percentage||0) }));
      const max = Math.max(1,...items.map((i:any)=>i.value));
      const bars = items.map((i:any)=>`<div class="row"><div class="lbl">${(i.label||'').toUpperCase()}</div><div class="bar-bg"><div class="bar" style="width:${(i.value/max)*100}%"></div></div><div class="val">${num(i.value)}%</div></div>`).join('');
      return `${style}<div><strong>Participação por Método de Pagamento (%)</strong>${bars}</div>`;
    }
    if (reportId === '5') {
      const items = rows.map((r:any)=>({ label: hourLbl(r.hour), value: Number(r.transactions||0) }));
      const max = Math.max(1,...items.map((i:any)=>i.value));
      const bars = items.map((i:any)=>`<div style="display:inline-block;text-align:center"><div class="vbar" style="height:${Math.max(4,Math.round((i.value/max)*120))}px"></div><div class="vlabel">${i.label}</div></div>`).join('');
      return `${style}<div><strong>Transações por Hora</strong><div class="vwrap">${bars}</div></div>`;
    }
    if (reportId === '6') {
      const items = rows.map((r:any)=>({ label: String(r.customerName||'Cliente'), value: Number(r.totalSpent||0) })).slice(0,10);
      const max = Math.max(1,...items.map((i:any)=>i.value));
      const bars = items.map((i:any)=>`<div class="row"><div class="lbl">${i.label}</div><div class="bar-bg"><div class="bar" style="width:${(i.value/max)*100}%"></div></div><div class="val">R$ ${num(i.value)}</div></div>`).join('');
      return `${style}<div><strong>Ranking de Clientes (Valor Gasto)</strong>${bars}</div>`;
    }
    if (reportId === '7') {
      const items = rows.map((r:any)=>{
        let days = 0; try { const d = new Date(r.lastPurchase); if(!isNaN(d.getTime())){ const now=new Date(); days = Math.max(0, Math.round((now.getTime()-d.getTime())/(1000*60*60*24))); } } catch {}
        return { label: String(r.customerName||'Cliente'), value: days };
      }).sort((a:any,b:any)=>b.value-a.value).slice(0,10);
      const max = Math.max(1,...items.map((i:any)=>i.value));
      const bars = items.map((i:any)=>`<div class="row"><div class="lbl">${i.label}</div><div class="bar-bg"><div class="bar" style="width:${(i.value/max)*100}%"></div></div><div class="val">${num(i.value)}</div></div>`).join('');
      return `${style}<div><strong>Clientes Inativos (dias)</strong>${bars}</div>`;
    }
    if (reportId === '8') {
      const items = rows.map((r:any)=>({ label: String(r.productName||'Produto'), value: Number(r.profitMarginPercentage||0) })).slice(0,10);
      const max = Math.max(1,...items.map((i:any)=>i.value));
      const bars = items.map((i:any)=>`<div class="row"><div class="lbl">${i.label}</div><div class="bar-bg"><div class="bar" style="width:${(i.value/max)*100}%"></div></div><div class="val">${num(i.value)}%</div></div>`).join('');
      return `${style}<div><strong>Margem de Lucro por Produto (%)</strong>${bars}</div>`;
    }
    return '';
  } catch {
    return '';
  }
  function num(n:number){ try { return Number(n||0).toLocaleString('pt-BR'); } catch { return String(n); } }
  function hourLbl(h:any){ const n=Number(h||0); return (n<10?`0${n}`:String(n))+':00'; }
  function dateLbl(v:any){ try{ const d=new Date(v); if(!isNaN(d.getTime())) return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}`; const m=String(v).match(/^(\\d{4})-(\\d{2})-(\\d{2})/); if(m) return `${m[3]}/${m[2]}`; }catch{} return String(v);}
  function pad2(n:number){ return String(n).padStart(2,'0'); }
}
`;
const updated = s.slice(0, start) + newFunc + s.slice(end);
fs.writeFileSync(path, updated, 'utf8');
console.log('generateReportChartHTML replaced cleanly');
