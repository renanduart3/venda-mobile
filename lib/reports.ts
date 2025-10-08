
import db from './db';

type Period = 'monthly' | 'yearly' | 'custom';

interface ReportOptions {
  period: Period;
  start?: string; // ISO date
  end?: string; // ISO date
}

function ensureMinOneMonth(start: Date, end: Date) {
  const msInMonth = 1000 * 60 * 60 * 24 * 30;
  return (end.getTime() - start.getTime()) >= msInMonth;
}

export async function generateSalesReport(opts: ReportOptions) {
  let start: Date;
  let end: Date;

  const now = new Date();
  if (opts.period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (opts.period === 'yearly') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  } else {
    if (!opts.start || !opts.end) throw new Error('Custom period requires start and end');
    start = new Date(opts.start);
    end = new Date(opts.end);
  }

  if (!ensureMinOneMonth(start, end)) throw new Error('Período deve ser de no mínimo 1 mês');

  // Aggregate sales total and count, grouped by month
  const rows = await db.query(
    `SELECT created_at, total FROM sales WHERE datetime(created_at) BETWEEN datetime(?) AND datetime(?)`,
    [start.toISOString(), end.toISOString()]
  );

  // Prepare aggregation per month
  const map: Record<string, { total: number; count: number }> = {};
  for (const r of rows) {
    const date = new Date(r.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) map[key] = { total: 0, count: 0 };
    map[key].total += Number(r.total || 0);
    map[key].count += 1;
  }

  const result = Object.keys(map).sort().map(k => ({ period: k, ...map[k] }));
  return result;
}

export async function generateExpenseReport(opts: ReportOptions) {
  let start: Date;
  let end: Date;

  const now = new Date();
  if (opts.period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (opts.period === 'yearly') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  } else {
    if (!opts.start || !opts.end) throw new Error('Custom period requires start and end');
    start = new Date(opts.start);
    end = new Date(opts.end);
  }

  if (!ensureMinOneMonth(start, end)) throw new Error('Período deve ser de no mínimo 1 mês');

  const rows = await db.query(
    `SELECT created_at, amount FROM expenses WHERE datetime(created_at) BETWEEN datetime(?) AND datetime(?)`,
    [start.toISOString(), end.toISOString()]
  );

  const map: Record<string, { total: number; count: number }> = {};
  for (const r of rows) {
    const date = new Date(r.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) map[key] = { total: 0, count: 0 };
    map[key].total += Number(r.amount || 0);
    map[key].count += 1;
  }

  const result = Object.keys(map).sort().map(k => ({ period: k, ...map[k] }));
  return result;
}

export function generateDashboardHTML(data: any) {
  const { totalRevenue, totalExpenses, netIncome, topProducts, recentSales, topClients } = data;
  
  const topProductsRows = topProducts.map((p: any) => `<tr><td>${p.name}</td><td>${p.total_sold}</td><td>R$ ${p.total_revenue.toFixed(2)}</td></tr>`).join('');
  const recentSalesRows = recentSales.map((s: any) => `<tr><td>${new Date(s.timestamp).toLocaleDateString('pt-BR')}</td><td>${s.customer || 'N/A'}</td><td>R$ ${s.total.toFixed(2)}</td></tr>`).join('');
  const topClientsRows = topClients.map((c: any) => `<tr><td>${c.name}</td><td>${c.total_purchases}</td><td>R$ ${c.total_spent.toFixed(2)}</td></tr>`).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório do Dashboard</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; }
        .container { padding: 20px; }
        h1, h2 { color: #222; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .summary { display: flex; justify-content: space-around; margin: 20px 0; }
        .summary-box { flex: 1; text-align: center; padding: 10px; margin: 5px; background-color: #f7f7f7; border-radius: 8px; }
        .summary-box h3 { margin: 0; font-size: 14px; color: #555; }
        .summary-box p { margin: 5px 0 0; font-size: 20px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Relatório de Desempenho</h1>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>

        <div class="summary">
          <div class="summary-box">
            <h3>Receita Total</h3>
            <p>R$ ${totalRevenue.toFixed(2)}</p>
          </div>
          <div class="summary-box">
            <h3>Despesas Totais</h3>
            <p>R$ ${totalExpenses.toFixed(2)}</p>
          </div>
          <div class="summary-box">
            <h3>Lucro Líquido</h3>
            <p>R$ ${netIncome.toFixed(2)}</p>
          </div>
        </div>

        <h2>Top Produtos Vendidos</h2>
        <table>
          <thead><tr><th>Produto</th><th>Unidades Vendidas</th><th>Receita Gerada</th></tr></thead>
          <tbody>${topProductsRows}</tbody>
        </table>

        <h2>Vendas Recentes</h2>
        <table>
          <thead><tr><th>Data</th><th>Cliente</th><th>Valor Total</th></tr></thead>
          <tbody>${recentSalesRows}</tbody>
        </table>

        <h2>Top Clientes</h2>
        <table>
          <thead><tr><th>Cliente</th><th>Total de Compras</th><th>Valor Gasto</th></tr></thead>
          <tbody>${topClientsRows}</tbody>
        </table>
        
        <div class="footer">
          <p>Relatório gerado pelo seu App de Gestão. &copy; ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
