export const baseCSS = `
  .container { font-family: Arial, Helvetica, sans-serif; color:#111827; }
  .header { margin-bottom: 12px; }
  .title { font-size:20px; font-weight:700; }
  .subtitle, .date { font-size:12px; color:#4b5563; }
  .summary { margin: 10px 0 16px; font-size:12px; color:#374151; }

  /* Table */
  table.tbl { width:100%; border-collapse:collapse; }
  .tbl th, .tbl td { border:1px solid #e5e7eb; padding:8px; font-size:12px; }
  .tbl thead th { background:#f3f4f6; text-align:left; }

  /* Chart */
  .chart-section { margin: 12px 0 16px; }
  .chart-title { font-size:16px; font-weight:600; margin-bottom:8px; }
  .row { display:flex; align-items:center; gap:8px; margin:6px 0; }
  .lbl { width:180px; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .val { width:80px; font-size:12px; text-align:right; }
  .bar-bg { height:12px; border-radius:6px; background:#e5e7eb; overflow:hidden; flex:1; }
  .bar { height:12px; border-radius:6px; background: var(--bar-color, #4f46e5); width: var(--w, 0%); }
  .chart-legend { margin-top:6px; font-size:12px; color:#374151; }
`;

export function htmlShell(params: { title: string; period: string; currentDate: string; body: string }): string {
  const { title, period, currentDate, body } = params;
  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
    <style>${baseCSS}</style>
  </head>
  <body class="container">
    <div class="header">
      <div class="title">${title}</div>
      <div class="subtitle">Período: ${period}</div>
      <div class="date">Gerado em: ${currentDate}</div>
    </div>
    ${body}
  </body>
  </html>`;
}

export function renderSummary(text: string) {
  return `<div class="summary">${text}</div>`;
}

export function renderTable(data: any[], labelMap: Record<string, string>) {
  if (!Array.isArray(data) || data.length === 0) return '<div class="summary">Nenhum dado encontrado.</div>';
  const headers = Object.keys(data[0] || {});
  const thead = headers.map((h) => `<th>${labelMap[h] || h}</th>`).join('');
  const rows = data
    .map((row) => {
      const cells = headers
        .map((h) => `<td>${formatCell(h, (row as any)[h])}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  return `<table class="tbl"><thead><tr>${thead}</tr></thead><tbody>${rows}</tbody></table>`;
}

function formatCell(header: string, value: any) {
  if (typeof value === 'number') return value.toLocaleString('pt-BR');
  const s = String(value ?? '');
  const lower = header.toLowerCase();
  // ID-like columns: keep only digits
  if (lower.includes('id')) {
    const digits = s.replace(/\D+/g, '');
    if (digits) return digits;
  }
  // ISO Date formatting => DD/MM/YYYY HH:mm (if time) or DD/MM/YYYY
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return s.includes('T') || s.includes(':') ? `${dd}/${mm}/${yyyy} ${hh}:${mi}` : `${dd}/${mm}/${yyyy}`;
  }
  return s;
}

export function renderHBarChart(params: {
  title: string;
  items: { label: string; value: number; color?: string }[];
  legend?: string;
  summary?: string;
}) {
  const { title, items, legend, summary } = params;
  const max = Math.max(1, ...items.map((i) => Math.max(0, Number(i.value || 0))));
  const rows = items
    .map((i) => {
      const pct = Math.max(0, Number(i.value || 0)) / max * 100;
      const css = `--w:${pct.toFixed(2)}%;${i.color ? `--bar-color:${i.color};` : ''}`;
      return `<div class="row"><div class="lbl">${i.label}</div><div class="bar-bg"><div class="bar" style="${css}"></div></div><div class="val">${Number(i.value || 0).toLocaleString('pt-BR')}</div></div>`;
    })
    .join('');
  return `<div class="chart-section"><div class="chart-title">${title}</div>${rows}${
    legend ? `<div class="chart-legend">${legend}</div>` : ''
  }${summary ? `<div class="summary">${summary}</div>` : ''}</div>`;
}

