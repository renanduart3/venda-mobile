/**
 * Centralized data loading utilities to avoid code duplication
 */

import { USE_MOCKS, mockProducts, mockCustomers, mockSales, mockExpenses, mockDashboardStats, mockStoreSettings } from './mocks';
import db from './db';

/**
 * Generic data loader that handles mock vs real data
 */
async function loadData<T>(mockData: T, realDataLoader?: () => Promise<T>): Promise<T> {
  if (USE_MOCKS) {
    return mockData;
  }

  if (realDataLoader) {
    return await realDataLoader();
  }

  // Return empty array or default value for the type
  return (Array.isArray(mockData) ? [] : {}) as T;
}

/**
 * Load products from mock or database
 */
export async function loadProducts() {
  return loadData(mockProducts, async () => {
    const rows = await db.all('products');
    return rows.map((row: any) => ({
      ...row,
      price: Number(row.price ?? 0),
      cost_price: Number(row.cost_price ?? 0),
      stock: Number(row.stock ?? 0),
      min_stock: Number(row.min_stock ?? 0),
      type: row.type || 'product',
    }));
  });
}

/**
 * Load customers from mock or database
 */
export async function loadCustomers() {
  return loadData(mockCustomers, async () => {
    const rows = await db.all('customers');
    return rows.map((row: any) => ({
      ...row,
      whatsapp: Boolean(row.whatsapp),
    }));
  });
}

/**
 * Load sales from mock or database
 */
export async function loadSales() {
  return loadData(mockSales, async () => {
    const sales = await db.query(
      `SELECT s.*, c.name as customer_name, c.phone as customer_phone
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       ORDER BY datetime(s.created_at) DESC;`
    );

    const salesWithItems = await Promise.all(
      sales.map(async (sale: any) => {
        const items = await db.query(
          `SELECT si.*, p.name as product_name, p.type as product_type
           FROM sale_items si
           LEFT JOIN products p ON p.id = si.product_id
           WHERE si.sale_id = ?;`,
          [sale.id]
        );

        return {
          ...sale,
          total: Number(sale.total ?? 0),
          discount: Number(sale.discount ?? 0),
          customer_phone: sale.customer_phone || '',
          items: items.map((item: any) => ({
            product_id: item.product_id,
            product_name: item.product_name || '',
            quantity: Number(item.quantity ?? 0),
            unit_price: Number(item.unit_price ?? 0),
            unit_cost: Number(item.unit_cost ?? 0),
            total: Number(item.total ?? 0),
            product_type: item.product_type || 'product',
          })),
        };
      })
    );

    return salesWithItems;
  });
}

/**
 * Load expenses from mock or database
 */
export async function loadExpenses() {
  return loadData(mockExpenses, async () => {
    const rows = await db.all('expenses');
    return rows.map((row: any) => ({
      ...row,
      amount: Number(row.amount ?? 0),
      original_amount:
        Number(row.original_amount ?? 0) > 0
          ? Number(row.original_amount)
          : Number(row.amount ?? 0),
      paid: Boolean(row.paid),
      recurring: Boolean(row.recurring),
    }));
  });
}

/**
 * Load dashboard stats from mock or database
 */
export async function loadDashboardStats() {
  return loadData(mockDashboardStats, async () => {
    const [products, customers, expenses, sales, saleItems] = await Promise.all([
      loadProducts(),
      loadCustomers(),
      loadExpenses(),
      db.query('SELECT * FROM sales;'),
      db.query(
        `SELECT si.product_id, si.quantity, si.unit_cost, si.sale_id, p.name as product_name
         FROM sale_items si
         LEFT JOIN products p ON p.id = si.product_id;`
      ),
    ]);

    const now = new Date();

    const formatMonthKey = (date: Date): string =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const formatDayKey = (date: Date): string =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const parseDate = (dateValue: any): Date | null => {
      if (!dateValue) return null;

      if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
        return dateValue;
      }

      if (typeof dateValue === 'string') {
        const legacyDateMatch = dateValue.match(
          /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
        );

        if (legacyDateMatch) {
          const [, dd, mm, yyyy, hh = '0', min = '0', ss = '0'] = legacyDateMatch;
          const parsedLegacy = new Date(
            Number(yyyy),
            Number(mm) - 1,
            Number(dd),
            Number(hh),
            Number(min),
            Number(ss)
          );

          if (!isNaN(parsedLegacy.getTime())) {
            return parsedLegacy;
          }
        }

        const parsedIso = new Date(dateValue);
        if (!isNaN(parsedIso.getTime())) {
          return parsedIso;
        }
      }

      return null;
    };

    const toMonthKey = (dateValue: any): string | null => {
      const parsed = parseDate(dateValue);
      return parsed ? formatMonthKey(parsed) : null;
    };

    const toDayKey = (dateValue: any): string | null => {
      const parsed = parseDate(dateValue);
      return parsed ? formatDayKey(parsed) : null;
    };

    const currentMonth = formatMonthKey(now);
    const todayKey = formatDayKey(now);
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayKey = formatDayKey(yesterdayDate);

    const saleCogsBySaleId = new Map<string, number>();
    for (const item of saleItems) {
      const saleId = String(item.sale_id ?? '');
      if (!saleId) continue;
      const currentCogs = saleCogsBySaleId.get(saleId) || 0;
      saleCogsBySaleId.set(
        saleId,
        currentCogs + Number(item.quantity ?? 0) * Number(item.unit_cost ?? 0)
      );
    }

    type DailyBucket = {
      sales: number;
      revenue: number;
      discounts: number;
      gross: number;
      cogs: number;
      profit: number;
    };

    const emptyDailyBucket = (): DailyBucket => ({
      sales: 0,
      revenue: 0,
      discounts: 0,
      gross: 0,
      cogs: 0,
      profit: 0,
    });

    const dailyTotals: Record<string, DailyBucket> = {};

    const getDailyBucket = (dayKey: string): DailyBucket => {
      if (!dailyTotals[dayKey]) {
        dailyTotals[dayKey] = emptyDailyBucket();
      }
      return dailyTotals[dayKey];
    };

    for (const sale of sales) {
      const dayKey = toDayKey(sale.created_at);
      if (!dayKey) continue;

      const saleId = String(sale.id ?? '');
      const netRevenue = Number(sale.total ?? 0);
      const discounts = Number(sale.discount ?? 0);
      const grossRevenue = netRevenue + discounts;
      const cogs = saleCogsBySaleId.get(saleId) || 0;
      const profit = netRevenue - cogs;

      const bucket = getDailyBucket(dayKey);
      bucket.sales += 1;
      bucket.revenue += netRevenue;
      bucket.discounts += discounts;
      bucket.gross += grossRevenue;
      bucket.cogs += cogs;
      bucket.profit += profit;
    }

    // Filtra vendas do mês — suporta ISO e dd/mm/yyyy legado
    const monthlySales = sales.filter((sale: any) =>
      toMonthKey(sale.created_at) === currentMonth
    );
    const monthlyNetRevenue = monthlySales.reduce(
      (sum: number, sale: any) => sum + Number(sale.total ?? 0),
      0
    );
    const monthlyDiscounts = monthlySales.reduce(
      (sum: number, sale: any) => sum + Number(sale.discount ?? 0),
      0
    );
    const monthlyGrossRevenue = monthlyNetRevenue + monthlyDiscounts;

    const monthlySalesIds = new Set(monthlySales.map((s: any) => String(s.id ?? '')));
    let monthlyCogs = 0;
    for (const saleId of monthlySalesIds) {
      monthlyCogs += saleCogsBySaleId.get(saleId) || 0;
    }
    const monthlyProfit = monthlyNetRevenue - monthlyCogs;

    const todayTotals = dailyTotals[todayKey] || emptyDailyBucket();
    const yesterdayTotals = dailyTotals[yesterdayKey] || emptyDailyBucket();

    const percentChange = (currentValue: number, previousValue: number): number => {
      if (previousValue === 0) {
        return currentValue === 0 ? 0 : 100;
      }
      return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
    };

    const todayMarginPct =
      todayTotals.revenue > 0 ? (todayTotals.profit / todayTotals.revenue) * 100 : 0;
    const todayDiscountPct =
      todayTotals.gross > 0 ? (todayTotals.discounts / todayTotals.gross) * 100 : 0;

    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));

      const dayKey = formatDayKey(date);
      const totals = dailyTotals[dayKey] || emptyDailyBucket();
      const dayLabel = date
        .toLocaleDateString('pt-BR', { weekday: 'short' })
        .replace('.', '')
        .trim();

      return {
        label: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1, 3),
        revenue: Number(totals.revenue.toFixed(2)),
        profit: Number(totals.profit.toFixed(2)),
      };
    });

    const lowStockCount = products.filter(
      (product: any) =>
        product.type !== 'service' &&
        typeof product.stock === 'number' &&
        typeof product.min_stock === 'number' &&
        product.stock <= product.min_stock
    ).length;



    const monthlyExpensesTotal = expenses
      .filter((expense: any) => {
        const monthKey = toMonthKey(expense.due_date) || expense.created_month || toMonthKey(expense.created_at);
        return monthKey === currentMonth;
      })
      .reduce((sum: number, expense: any) => sum + Number(expense.amount ?? 0), 0);

    const productSalesMap = saleItems.reduce((acc: Record<string, { name: string; sales: number }>, item: any) => {
      if (!monthlySalesIds.has(String(item.sale_id ?? ''))) {
        return acc;
      }
      if (!item.product_id) {
        return acc;
      }
      const entry = acc[item.product_id] || { name: item.product_name || 'Produto', sales: 0 };
      entry.sales += Number(item.quantity ?? 0);
      acc[item.product_id] = entry;
      return acc;
    }, {} as Record<string, { name: string; sales: number }>);

    const topProducts = (Object.values(productSalesMap) as { name: string; sales: number }[])
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    const peakHourMap = monthlySales.reduce((acc: Record<string, number>, sale: any) => {
      const date = parseDate(sale.created_at);
      if (!date) {
        return acc;
      }
      const hourLabel = `${String(date.getHours()).padStart(2, '0')}:00`;
      acc[hourLabel] = (acc[hourLabel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const peakHours = (Object.entries(peakHourMap) as [string, number][])
      .map(([hour, salesCount]) => ({ hour, sales: salesCount }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6);

    return {
      dailySales: todayTotals.sales,
      dailyRevenue: monthlyNetRevenue,
      monthlyGrossRevenue,
      monthlyDiscounts,
      monthlyCogs,
      monthlyProfit,
      todayRevenue: todayTotals.revenue,
      todayProfit: todayTotals.profit,
      todayDiscounts: todayTotals.discounts,
      todayGrossRevenue: todayTotals.gross,
      todayCogs: todayTotals.cogs,
      todayMarginPct,
      todayDiscountPct,
      revenueChangePct: percentChange(todayTotals.revenue, yesterdayTotals.revenue),
      profitChangePct: percentChange(todayTotals.profit, yesterdayTotals.profit),
      discountChangePct: percentChange(todayTotals.discounts, yesterdayTotals.discounts),
      last7Days,
      lowStockCount,
      totalCustomers: customers.length,
      monthlyExpenses: monthlyExpensesTotal,
      topProducts,
      peakHours,
    };
  });
}

/**
 * Load store settings from mock or database
 */
export async function loadStoreSettings() {
  return loadData(mockStoreSettings, async () => {
    const rows = await db.all('store_settings');
    if (!rows.length) {
      return {
        storeName: '',
        ownerName: '',
        pixKeys: [''],
      };
    }
    const row = rows[0];
    let pixKeys: string[] = [];

    if (row.pix_key) {
      if (Array.isArray(row.pix_key)) {
        pixKeys = row.pix_key;
      } else {
        try {
          const parsed = JSON.parse(row.pix_key);
          if (Array.isArray(parsed)) {
            pixKeys = parsed.map((value) => String(value));
          } else if (typeof parsed === 'string') {
            pixKeys = parsed.split(',').map((value: string) => value.trim()).filter(Boolean);
          }
        } catch {
          pixKeys = String(row.pix_key)
            .split(',')
            .map((value: string) => value.trim())
            .filter(Boolean);
        }
      }
    }

    if (!pixKeys.length) {
      pixKeys = [''];
    }

    return {
      storeName: row.store_name || '',
      ownerName: row.owner_name || '',
      pixKeys,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
    };
  });
}
