import db from './db';
import { isPremium } from './premium';

export type Period = '7days' | '30days' | '6months' | 'yearly' | 'custom';

export interface ReportOptions {
  period: Period;
  start?: string; // ISO date (usado apenas para 'custom')
  end?: string;   // ISO date (usado apenas para 'custom')
}

interface ProductSalesData {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
  averagePrice: number;
}

interface CustomerData {
  customerId: string;
  customerName: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: string;
  purchaseFrequency: number;
}

interface PaymentMethodData {
  method: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

interface HourlySalesData {
  hour: number;
  sales: number;
  transactions: number;
}

async function checkPremiumAccess(): Promise<void> {
  const premium = await isPremium();
  if (!premium) {
    throw new Error('Funcionalidade premium disponível apenas para usuários Premium.');
  }
}

function calculatePeriod(opts: ReportOptions): { start: Date; end: Date } {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let start: Date;
  let end: Date = todayEnd;

  switch (opts.period) {
    case '7days':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      break;
    case '30days':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      break;
    case '6months': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      break;
    }
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case 'custom':
    default:
      if (!opts.start || !opts.end) throw new Error('Período customizado exige início e fim.');
      start = new Date(opts.start);
      end = new Date(opts.end);
  }

  return { start, end };
}

// 1. Produtos Mais Vendidos
export async function getTopSellingProducts(opts: ReportOptions): Promise<ProductSalesData[]> {
  await checkPremiumAccess();
  const { start, end } = calculatePeriod(opts);

  const query = `
    WITH sale_totals AS (
      SELECT sale_id, SUM(total) AS sale_gross_total
      FROM sale_items
      GROUP BY sale_id
    ),
    line_net AS (
      SELECT
        si.product_id,
        si.quantity,
        si.total * (
          CASE
            WHEN COALESCE(st.sale_gross_total, 0) > 0 THEN COALESCE(s.total, 0) / st.sale_gross_total
            ELSE 1
          END
        ) AS net_line_total
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN sale_totals st ON st.sale_id = si.sale_id
      WHERE datetime(s.created_at) BETWEEN datetime(?) AND datetime(?)
    )
    SELECT
      ln.product_id,
      p.name as product_name,
      SUM(ln.quantity) as total_sold,
      SUM(ln.net_line_total) as total_revenue,
      COALESCE(SUM(ln.net_line_total) / NULLIF(SUM(ln.quantity), 0), 0) as average_price
    FROM line_net ln
    JOIN products p ON ln.product_id = p.id
    GROUP BY ln.product_id, p.name
    ORDER BY total_sold DESC
    LIMIT 20
  `;

  const results: any[] = await db.query(query, [start.toISOString(), end.toISOString()]);
  return results.map((row: any) => ({
    productId: row.product_id,
    productName: row.product_name,
    totalSold: Number(row.total_sold),
    totalRevenue: Number(row.total_revenue),
    averagePrice: Number(row.average_price),
  }));
}

// 2. Curva ABC de Produtos
export async function getProductABCAnalysis(opts: ReportOptions): Promise<any[]> {
  await checkPremiumAccess();
  const products = await getTopSellingProducts(opts);
  const totalRevenue = products.reduce((sum: number, p) => sum + p.totalRevenue, 0) || 1;

  let cumulative = 0;
  return products.map((product) => {
    const percentage = (product.totalRevenue / totalRevenue) * 100;
    cumulative += percentage;
    let category: 'A' | 'B' | 'C' = 'C';
    if (cumulative <= 80) category = 'A';
    else if (cumulative <= 95) category = 'B';
    return {
      ...product,
      percentage: Number(percentage.toFixed(2)),
      cumulativePercentage: Number(cumulative.toFixed(2)),
      category,
    };
  });
}

// 3. Tendência de Vendas por período (por dia)
export async function getSalesTrendAnalysis(opts: ReportOptions): Promise<any[]> {
  await checkPremiumAccess();
  const { start, end } = calculatePeriod(opts);

  const query = `
    SELECT
      DATE(s.created_at) as date,
      COUNT(*) as transactions,
      SUM(s.total) as total_sales,
      AVG(s.total) as average_ticket
    FROM sales s
    WHERE datetime(s.created_at) BETWEEN datetime(?) AND datetime(?)
    GROUP BY DATE(s.created_at)
    ORDER BY date
  `;

  const rows: any[] = await db.query(query, [start.toISOString(), end.toISOString()]);
  return rows;
}

// 4. Meios de Pagamento
export async function getPaymentMethodAnalysis(opts: ReportOptions): Promise<PaymentMethodData[]> {
  await checkPremiumAccess();
  const { start, end } = calculatePeriod(opts);

  const query = `
    SELECT
      payment_method,
      COUNT(*) as transaction_count,
      SUM(total) as total_amount
    FROM sales
    WHERE datetime(created_at) BETWEEN datetime(?) AND datetime(?)
    GROUP BY payment_method
    ORDER BY total_amount DESC
  `;

  const results: any[] = await db.query(query, [start.toISOString(), end.toISOString()]);
  const totalAmount = results.reduce((sum: number, row: any) => sum + Number(row.total_amount || 0), 0) || 1;

  return results.map((row: any) => ({
    method: row.payment_method,
    totalAmount: Number(row.total_amount || 0),
    transactionCount: Number(row.transaction_count || 0),
    percentage: Number((((Number(row.total_amount || 0)) / totalAmount) * 100).toFixed(2)),
  }));
}

// 5. Horários de Pico
export async function getPeakSalesHours(opts: ReportOptions): Promise<HourlySalesData[]> {
  await checkPremiumAccess();
  const { start, end } = calculatePeriod(opts);

  const query = `
    SELECT
      CAST(strftime('%H', created_at) AS INTEGER) as hour,
      COUNT(*) as transactions,
      SUM(total) as sales
    FROM sales
    WHERE datetime(created_at) BETWEEN datetime(?) AND datetime(?)
    GROUP BY CAST(strftime('%H', created_at) AS INTEGER)
    ORDER BY hour
  `;

  const results: any[] = await db.query(query, [start.toISOString(), end.toISOString()]);
  return results.map((row: any) => ({
    hour: Number(row.hour),
    sales: Number(row.sales),
    transactions: Number(row.transactions),
  }));
}

// 6. Ranking de Clientes (RFV)
export async function getCustomerRFVAnalysis(opts: ReportOptions): Promise<CustomerData[]> {
  await checkPremiumAccess();
  const { start, end } = calculatePeriod(opts);

  const query = `
    SELECT
      s.customer_id,
      c.name as customer_name,
      COUNT(*) as total_purchases,
      SUM(s.total) as total_spent,
      MAX(s.created_at) as last_purchase
    FROM sales s
    JOIN customers c ON s.customer_id = c.id
    WHERE datetime(s.created_at) BETWEEN datetime(?) AND datetime(?)
    GROUP BY s.customer_id, c.name
    ORDER BY total_spent DESC
  `;

  const results: any[] = await db.query(query, [start.toISOString(), end.toISOString()]);
  const msInMonth = 1000 * 60 * 60 * 24 * 30;
  const months = Math.max(1, (end.getTime() - start.getTime()) / msInMonth);
  return results.map((row: any) => ({
    customerId: row.customer_id,
    customerName: row.customer_name,
    totalPurchases: Number(row.total_purchases),
    totalSpent: Number(row.total_spent),
    lastPurchase: row.last_purchase,
    purchaseFrequency: Number(row.total_purchases) / months,
  }));
}

// 7. Clientes Inativos
// Mostra clientes com ao menos 1 compra cuja última compra é anterior ao início do período selecionado.
export async function getInactiveCustomers(opts: ReportOptions): Promise<CustomerData[]> {
  await checkPremiumAccess();
  const { start } = calculatePeriod(opts);

  const query = `
    SELECT
      c.id as customer_id,
      c.name as customer_name,
      COUNT(s.id) as total_purchases,
      COALESCE(SUM(s.total), 0) as total_spent,
      MAX(s.created_at) as last_purchase
    FROM customers c
    LEFT JOIN sales s ON c.id = s.customer_id
    GROUP BY c.id, c.name
    HAVING total_purchases > 0
      AND (last_purchase IS NULL OR datetime(last_purchase) < datetime(?))
    ORDER BY last_purchase ASC
    LIMIT 500
  `;

  const results: any[] = await db.query(query, [start.toISOString()]);
  return results.map((row: any) => ({
    customerId: row.customer_id,
    customerName: row.customer_name,
    totalPurchases: Number(row.total_purchases || 0),
    totalSpent: Number(row.total_spent || 0),
    lastPurchase: row.last_purchase,
    purchaseFrequency: 0,
  }));
}

// 8. Margem de Lucro
export async function getProfitMarginAnalysis(opts: ReportOptions): Promise<any[]> {
  await checkPremiumAccess();
  const { start, end } = calculatePeriod(opts);

  const query = `
    WITH sale_totals AS (
      SELECT sale_id, SUM(total) AS sale_gross_total
      FROM sale_items
      GROUP BY sale_id
    ),
    line_net AS (
      SELECT
        si.product_id,
        si.quantity,
        si.total * (
          CASE
            WHEN COALESCE(st.sale_gross_total, 0) > 0 THEN COALESCE(s.total, 0) / st.sale_gross_total
            ELSE 1
          END
        ) AS net_line_total
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN sale_totals st ON st.sale_id = si.sale_id
      WHERE datetime(s.created_at) BETWEEN datetime(?) AND datetime(?)
    ),
    product_net AS (
      SELECT
        product_id,
        SUM(quantity) AS total_sold,
        SUM(net_line_total) AS total_revenue
      FROM line_net
      GROUP BY product_id
    )
    SELECT
      p.id as product_id,
      p.name as product_name,
      COALESCE(p.cost_price, 0) as cost_price,
      COALESCE(pn.total_revenue / NULLIF(pn.total_sold, 0), 0) as selling_price,
      COALESCE(pn.total_sold, 0) as total_sold,
      COALESCE(pn.total_revenue, 0) as total_revenue,
      COALESCE((pn.total_revenue / NULLIF(pn.total_sold, 0)) - COALESCE(p.cost_price, 0), 0) as profit_per_unit,
      CASE
        WHEN COALESCE(pn.total_revenue / NULLIF(pn.total_sold, 0), 0) > 0
        THEN (
          (
            (pn.total_revenue / NULLIF(pn.total_sold, 0)) - COALESCE(p.cost_price, 0)
          ) /
          (pn.total_revenue / NULLIF(pn.total_sold, 0))
        ) * 100
        ELSE 0
      END as profit_margin_percentage
    FROM products p
    JOIN product_net pn ON p.id = pn.product_id
    ORDER BY profit_margin_percentage DESC
    LIMIT 200
  `;

  const results: any[] = await db.query(query, [start.toISOString(), end.toISOString()]);
  return results.map((row: any) => ({
    productId: row.product_id,
    productName: row.product_name,
    costPrice: Number(row.cost_price),
    sellingPrice: Number(row.selling_price),
    totalSold: Number(row.total_sold),
    totalRevenue: Number(row.total_revenue),
    profitPerUnit: Number(row.profit_per_unit),
    profitMarginPercentage: Number(row.profit_margin_percentage),
  }));
}

export async function getReportData(reportId: string, opts: ReportOptions): Promise<any> {
  let result: any;
  switch (reportId) {
    case '1':
      result = await getTopSellingProducts(opts);
      break;
    case '2':
      result = await getProductABCAnalysis(opts);
      break;
    case '3':
      result = await getSalesTrendAnalysis(opts);
      break;
    case '4':
      result = await getPaymentMethodAnalysis(opts);
      break;
    case '5':
      result = await getPeakSalesHours(opts);
      break;
    case '6':
      result = await getCustomerRFVAnalysis(opts);
      break;
    case '7':
      result = await getInactiveCustomers(opts);
      break;
    case '8':
      result = await getProfitMarginAnalysis(opts);
      break;
    default:
      throw new Error('Relatório não encontrado');
  }

  return result;
}
