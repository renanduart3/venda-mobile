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
      `SELECT s.*, c.name as customer_name
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
          items: items.map((item: any) => ({
            product_id: item.product_id,
            product_name: item.product_name || '',
            quantity: Number(item.quantity ?? 0),
            unit_price: Number(item.unit_price ?? 0),
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
        `SELECT si.product_id, si.quantity, p.name as product_name
         FROM sale_items si
         LEFT JOIN products p ON p.id = si.product_id;`
      ),
    ]);

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    const monthlySales = sales.filter((sale: any) =>
      typeof sale.created_at === 'string' && sale.created_at.startsWith(currentMonth)
    );
    const monthlyRevenue = monthlySales.reduce(
      (sum: number, sale: any) => sum + Number(sale.total ?? 0),
      0
    );

    const lowStockCount = products.filter(
      (product: any) =>
        typeof product.stock === 'number' &&
        typeof product.min_stock === 'number' &&
        product.stock <= product.min_stock
    ).length;

    const monthlyExpensesTotal = expenses
      .filter((expense: any) => {
        if (expense.created_month) {
          return expense.created_month === currentMonth;
        }
        if (typeof expense.created_at === 'string') {
          return expense.created_at.startsWith(currentMonth);
        }
        return false;
      })
      .reduce((sum: number, expense: any) => sum + Number(expense.amount ?? 0), 0);

    const productSalesMap = saleItems.reduce((acc: Record<string, { name: string; sales: number }>, item: any) => {
      if (!item.product_id) {
        return acc;
      }
      const entry = acc[item.product_id] || { name: item.product_name || 'Produto', sales: 0 };
      entry.sales += Number(item.quantity ?? 0);
      acc[item.product_id] = entry;
      return acc;
    }, {} as Record<string, { name: string; sales: number }>);

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    const peakHourMap = monthlySales.reduce((acc: Record<string, number>, sale: any) => {
      if (typeof sale.created_at !== 'string') {
        return acc;
      }
      const date = new Date(sale.created_at);
      if (isNaN(date.getTime())) {
        return acc;
      }
      const hourLabel = `${String(date.getHours()).padStart(2, '0')}:00`;
      acc[hourLabel] = (acc[hourLabel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const peakHours = Object.entries(peakHourMap)
      .map(([hour, salesCount]) => ({ hour, sales: salesCount }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6);

    return {
      dailySales: monthlySales.length,
      dailyRevenue: monthlyRevenue,
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
        } catch (error) {
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
