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
