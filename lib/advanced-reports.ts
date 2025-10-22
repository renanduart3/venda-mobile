import db from './db';
import { isPremium } from './premium';

type Period = 'monthly' | 'yearly' | 'custom';

interface ReportOptions {
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

// Função auxiliar para verificar premium
async function checkPremiumAccess(): Promise<void> {
  const premium = await isPremium();
  if (!premium) {
    throw new Error('Funcionalidade premium: relatórios avançados disponíveis apenas para usuários premium.');
  }
}

// Função auxiliar para calcular período
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
    if (!opts.start || !opts.end) throw new Error('Custom period requires start and end');
    start = new Date(opts.start);
    end = new Date(opts.end);
  }

  // Verificar se o período é de pelo menos 1 mês
  const msInMonth = 1000 * 60 * 60 * 24 * 30;
  if ((end.getTime() - start.getTime()) < msInMonth) {
    throw new Error('Período deve ser de no mínimo 1 mês');
  }

  return { start, end };
}

// 1. Relatório de Produtos Mais Vendidos
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

  const results = await db.query(query, [start.toISOString(), end.toISOString()]);
  return results.map(row => ({
    productId: row.product_id,
    productName: row.product_name,
    totalSold: Number(row.total_sold),
    totalRevenue: Number(row.total_revenue),
    averagePrice: Number(row.average_price)
  }));
}

// 2. Curva ABC de Produtos
export async function getProductABCAnalysis(opts: ReportOptions): Promise<any[]> {
  await checkPremiumAccess();
  
  const products = await getTopSellingProducts(opts);
  const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);
  
  let cumulativePercentage = 0;
  return products.map((product, index) => {
    const percentage = (product.totalRevenue / totalRevenue) * 100;
    cumulativePercentage += percentage;
    
    let category = 'C';
    if (cumulativePercentage <= 80) category = 'A';
    else if (cumulativePercentage <= 95) category = 'B';
    
    return {
      ...product,
      percentage: Number(percentage.toFixed(2)),
      cumulativePercentage: Number(cumulativePercentage.toFixed(2)),
      category
    };
  });
}

// 3. Análise de Vendas por Período
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

  return await db.query(query, [start.toISOString(), end.toISOString()]);
}

// 4. Performance de Meios de Pagamento
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

  const results = await db.query(query, [start.toISOString(), end.toISOString()]);
  const totalAmount = results.reduce((sum, row) => sum + Number(row.total_amount), 0);
  
  return results.map(row => ({
    method: row.payment_method,
    totalAmount: Number(row.total_amount),
    transactionCount: Number(row.transaction_count),
    percentage: Number(((Number(row.total_amount) / totalAmount) * 100).toFixed(2))
  }));
}

// 5. Horários de Pico de Vendas
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

  const results = await db.query(query, [start.toISOString(), end.toISOString()]);
  return results.map(row => ({
    hour: Number(row.hour),
    sales: Number(row.sales),
    transactions: Number(row.transactions)
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

  const results = await db.query(query, [start.toISOString(), end.toISOString()]);
  return results.map(row => ({
    customerId: row.customer_id,
    customerName: row.customer_name,
    totalPurchases: Number(row.total_purchases),
    totalSpent: Number(row.total_spent),
    lastPurchase: row.last_purchase,
    purchaseFrequency: Number(row.total_purchases) / 30 // Aproximação
  }));
}

// 7. Clientes Inativos
export async function getInactiveCustomers(opts: ReportOptions): Promise<CustomerData[]> {
  await checkPremiumAccess();
  
  // Clientes que não compraram nos últimos 30 dias
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
  `;

  const results = await db.query(query, [thirtyDaysAgo.toISOString()]);
  return results.map(row => ({
    customerId: row.customer_id,
    customerName: row.customer_name,
    totalPurchases: Number(row.total_purchases),
    totalSpent: Number(row.total_spent),
    lastPurchase: row.last_purchase,
    purchaseFrequency: 0
  }));
}

// 8. Análise de Margem de Lucro
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
  `;

  const results = await db.query(query, [start.toISOString(), end.toISOString()]);
  return results.map(row => ({
    productId: row.product_id,
    productName: row.product_name,
    costPrice: Number(row.cost_price),
    sellingPrice: Number(row.selling_price),
    totalSold: Number(row.total_sold),
    totalRevenue: Number(row.total_revenue),
    profitPerUnit: Number(row.profit_per_unit),
    profitMarginPercentage: Number(row.profit_margin_percentage)
  }));
}

// Função para obter dados de um relatório específico
export async function getReportData(reportId: string, opts: ReportOptions): Promise<any> {
  switch (reportId) {
    case '1': // Produtos Mais Vendidos
      return await getTopSellingProducts(opts);
    case '2': // Curva ABC
      return await getProductABCAnalysis(opts);
    case '3': // Análise de Vendas por Período
      return await getSalesTrendAnalysis(opts);
    case '4': // Performance de Meios de Pagamento
      return await getPaymentMethodAnalysis(opts);
    case '5': // Horários de Pico
      return await getPeakSalesHours(opts);
    case '6': // Ranking de Clientes (RFV)
      return await getCustomerRFVAnalysis(opts);
    case '7': // Clientes Inativos
      return await getInactiveCustomers(opts);
    case '8': // Análise de Margem de Lucro
      return await getProfitMarginAnalysis(opts);
    default:
      throw new Error('Relatório não encontrado');
  }
}
