import db from './db';
import { isPremium } from './premium';
import { getUseReportsMock } from './dev-flags';
import { getReportData as getReportDataMock } from './advanced-reports.mock';

export type Period = 'monthly' | 'yearly' | 'custom';

export interface ReportOptions {
  period: Period;
  start?: string; // ISO date
  end?: string; // ISO date
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

const MAX_MONTHS = 6;

async function checkPremiumAccess(): Promise<void> {
  const premium = await isPremium();
  if (!premium) {
    throw new Error('Funcionalidade premium disponível apenas para usuários Premium.');
  }
}

function calculatePeriod(opts: ReportOptions): { start: Date; end: Date } {
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
    if (!opts.start || !opts.end) throw new Error('Período custom exige início e fim');
    start = new Date(opts.start);
    end = new Date(opts.end);
  }

  // mínimo 1 mês e máximo 6 meses
  const msInMonth = 1000 * 60 * 60 * 24 * 30;
  if (end.getTime() - start.getTime() < msInMonth) {
    throw new Error('Período deve ter pelo menos 1 mês.');
  }
  if ((end.getTime() - start.getTime()) / msInMonth > MAX_MONTHS) {
    end = new Date(start.getTime() + MAX_MONTHS * msInMonth - 1);
  }

  return { start, end };
}

// 1. Produtos Mais Vendidos
export async function getTopSellingProducts(opts: ReportOptions): Promise<ProductSalesData[]> {
  await checkPremiumAccess();
  const { start, end } = calculatePeriod(opts);

  const query = `
    SELECT 
      si.product_id,
      p.name as product_name,
      SUM(si.quantity) as total_sold,
      SUM(si.total) as total_revenue,
      AVG(si.unit_price) as average_price
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    JOIN sales s ON si.sale_id = s.id
    WHERE datetime(s.created_at) BETWEEN datetime(?) AND datetime(?)
    GROUP BY si.product_id, p.name
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
  // frequency approximation: purchases per month in range
  const msInMonth = 1000 * 60 * 60 * 24 * 30;
  const months = Math.max(1, (new Date(end).getTime() - new Date(start).getTime()) / msInMonth);
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
export async function getInactiveCustomers(opts: ReportOptions): Promise<CustomerData[]> {
  await checkPremiumAccess();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const query = `
    SELECT 
      c.id as customer_id,
      c.name as customer_name,
      COUNT(s.id) as total_purchases,
      SUM(s.total) as total_spent,
      MAX(s.created_at) as last_purchase
    FROM customers c
    LEFT JOIN sales s ON c.id = s.customer_id
    WHERE s.created_at IS NULL OR datetime(s.created_at) < datetime(?)
    GROUP BY c.id, c.name
    HAVING total_purchases > 0
    ORDER BY last_purchase ASC
    LIMIT 500
  `;

  const results: any[] = await db.query(query, [thirtyDaysAgo.toISOString()]);
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
    SELECT 
      p.id as product_id,
      p.name as product_name,
      p.price as cost_price,
      AVG(si.unit_price) as selling_price,
      SUM(si.quantity) as total_sold,
      SUM(si.total) as total_revenue,
      (AVG(si.unit_price) - p.price) as profit_per_unit,
      ((AVG(si.unit_price) - p.price) / AVG(si.unit_price)) * 100 as profit_margin_percentage
    FROM products p
    JOIN sale_items si ON p.id = si.product_id
    JOIN sales s ON si.sale_id = s.id
    WHERE datetime(s.created_at) BETWEEN datetime(?) AND datetime(?)
    GROUP BY p.id, p.name, p.price
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
  if (getUseReportsMock() || process.env.EXPO_PUBLIC_USE_REPORTS_MOCK === '1') {
    return getReportDataMock(reportId, opts);
  }
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
      throw new Error('Relat?rio n?o encontrado');
  }
  const isEmpty = !result || (Array.isArray(result) && result.length === 0);
  if (isEmpty && process.env.EXPO_PUBLIC_USE_REPORTS_MOCK !== '0') {
    return getReportDataMock(reportId, opts);
  }
  return result;
}





