const fs = require('fs');
const p = 'app/relatorios.tsx';
let s = fs.readFileSync(p, 'utf8');
const target = 'const chartHtml = generateReportChartHTML(selectedReport.id, rows);';
if (!s.includes(target)) { console.error('target not found'); process.exit(1); }
const injection = `const chartHtml = generateReportChartHTML(selectedReport.id, rows);
        const summaryHtml = (function buildSummaryHtml(id, data){
          try {
            const rows = Array.isArray(data) ? data : (data ? [data] : []);
            const style = '<div style=\"margin-top:10px;font-size:12px;color:#374151\">';
            function num(n){ try { return Number(n||0).toLocaleString('pt-BR'); } catch { return String(n); } }
            if (id === '1') {
              const totalQty = rows.reduce((a,r)=>a+Number(r.totalSold||0),0);
              const totalRev = rows.reduce((a,r)=>a+Number(r.totalRevenue||0),0);
              return style+`Resumo: Quantidade total ${num(totalQty)} • Receita total R$ ${num(totalRev)}`+'</div>';
            }
            if (id === '2') {
              const toCat = (r)=>{ const cum = Number(r.cumulativePercentage||0); return r.category|| (cum <= 80 ? 'A' : (cum <= 95 ? 'B' : 'C')); };
              const a=rows.filter(r=> toCat(r) === 'A').length;
              const b=rows.filter(r=> toCat(r) === 'B').length;
              const c=rows.filter(r=> toCat(r) === 'C').length;
              return style+`Distribuição ABC: A=${a} • B=${b} • C=${c}`+'</div>';
            }
            if (id === '3') {
              const totalRev = rows.reduce((a,r)=>a+Number(r.total_sales||0),0);
              const totalTx = rows.reduce((a,r)=>a+Number(r.transactions||0),0);
              return style+`Resumo: Receita total R$ ${num(totalRev)} • Transações ${num(totalTx)}`+'</div>';
            }
            if (id === '4') {
              const top = rows.slice().sort((a,b)=>Number(b.percentage||0)-Number(a.percentage||0))[0];
              const label = top ? String(top.method||'N/A').toUpperCase() : 'N/A';
              const perc = top ? Number(top.percentage||0) : 0;
              return style+`Topo: ${label} (${num(perc)}%)`+'</div>';
            }
            if (id === '5') {
              const top = rows.slice().sort((a,b)=>Number(b.transactions||0)-Number(a.transactions||0))[0];
              const label = top ? `${String(top.hour).padStart(2,'0')}:00` : 'N/A';
              const tx = top ? Number(top.transactions||0) : 0;
              return style+`Hora de pico: ${label} • Transações ${num(tx)}`+'</div>';
            }
            if (id === '6') {
              const totalSpent = rows.reduce((a,r)=>a+Number(r.totalSpent||0),0);
              return style+`Resumo: Valor total gasto (todos) R$ ${num(totalSpent)}`+'</div>';
            }
            if (id === '7') {
              const days = rows.map(r=>{ try { const d=new Date(r.lastPurchase); if(!isNaN(d.getTime())){ const now=new Date(); return Math.max(0, Math.round((now.getTime()-d.getTime())/(1000*60*60*24))); } } catch{} return 0; });
              const avg = days.length ? (days.reduce((a,b)=>a+b,0)/days.length) : 0;
              return style+`Resumo: Média de inatividade ${num(Number(avg.toFixed(0))) } dias`+'</div>';
            }
            if (id === '8') {
              const avgMargin = rows.length ? (rows.reduce((a,r)=>a+Number(r.profitMarginPercentage||0),0)/rows.length) : 0;
              return style+`Resumo: Margem média ${num(Number(avgMargin.toFixed(2)))}%`+'</div>';
            }
            return '';
          } catch { return ''; }
        })(selectedReport.id, rows);
        const extraHtml = chartHtml + summaryHtml;`;
s = s.replace(target, injection);
s = s.replace('const html = generateReportHTML(selectedReport.title, tableRows, periodLabel, chartHtml);', 'const html = generateReportHTML(selectedReport.title, tableRows, periodLabel, extraHtml);');
// limit RFV table rows to Top 100
s = s.replace(/const chartHtml[\s\S]*?const html = generateReportHTML\(selectedReport.title, tableRows, periodLabel, extraHtml\);/, (m)=> m.replace(/const tableRows = [^;]+;/, 'const tableRows = selectedReport.id === \x276\x27 ? rows.slice(0, 100) : rows;'));
fs.writeFileSync(p, s, 'utf8');
console.log('Injected summaryHtml and limit RFV to Top 100 in PDF');
