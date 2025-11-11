import type { ReportOptions } from './advanced-reports';

function clampRange(opts: ReportOptions) {
  const now = new Date();
  let start: Date;
  let end: Date;
  if (opts.period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (opts.period === 'yearly') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  } else {
    start = new Date(opts.start || now);
    end = new Date(opts.end || now);
  }
  // keep max 6 months for parity with real
  const msInMonth = 1000 * 60 * 60 * 24 * 30;
  if ((end.getTime() - start.getTime()) / msInMonth > 6) {
    end = new Date(start.getTime() + 6 * msInMonth - 1);
  }
  return { start, end };
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function pick<T>(arr: T[], rnd: () => number) {
  return arr[Math.floor(rnd() * arr.length)];
}

export async function getReportData(reportId: string, opts: ReportOptions): Promise<any> {
  const { start, end } = clampRange(opts);
  const seed = start.getTime() ^ end.getTime() ^ Number(reportId);
  const rnd = seededRandom(seed);

  switch (reportId) {
    case '1': { // Top produtos
      const products = Array.from({ length: 15 }).map((_, i) => {
        const qty = Math.floor(rnd() * 300) + 10;
        const price = Math.round((rnd() * 90 + 10) * 100) / 100;
        return {
          productId: `P${i + 1}`,
          productName: `Produto ${i + 1}`,
          totalSold: qty,
          totalRevenue: Math.round(qty * price * 100) / 100,
          averagePrice: price,
        };
      });
      products.sort((a, b) => b.totalSold - a.totalSold);
      return products;
    }
    case '2': { // Curva ABC
      const top = (await getReportData('1', opts)) as any[];
      const total = top.reduce((s, r) => s + Number(r.totalRevenue || 0), 0) || 1;
      let cumulative = 0;
      return top.map((p) => {
        const percentage = (p.totalRevenue / total) * 100;
        cumulative += percentage;
        let category: 'A' | 'B' | 'C' = 'C';
        if (cumulative <= 80) category = 'A';
        else if (cumulative <= 95) category = 'B';
        return {
          ...p,
          percentage: Number(percentage.toFixed(2)),
          cumulativePercentage: Number(cumulative.toFixed(2)),
          category,
        };
      });
    }
    case '3': { // Tendência por dia
      const days: any[] = [];
      const d = new Date(start);
      while (d <= end) {
        const base = 200 + Math.floor(rnd() * 400);
        days.push({
          date: d.toISOString().slice(0, 10),
          transactions: Math.floor(base / 50) + Math.floor(rnd() * 10),
          total_sales: base + Math.floor(rnd() * 200),
          average_ticket: Math.round((base / Math.max(1, Math.floor(base / 50))) * 100) / 100,
        });
        d.setDate(d.getDate() + 1);
      }
      return days;
    }
    case '4': { // Meios de pagamento
      const methods = ['dinheiro', 'pix', 'credito', 'debito'];
      const raw = methods.map((m) => ({ method: m, total_amount: Math.floor(rnd() * 5000) + 500 }));
      const total = raw.reduce((s, r) => s + r.total_amount, 0) || 1;
      return raw.map((r) => ({
        method: r.method,
        transactionCount: Math.floor(r.total_amount / 50),
        totalAmount: r.total_amount,
        percentage: Number(((r.total_amount / total) * 100).toFixed(2)),
      }));
    }
    case '5': { // Horários de pico
      return Array.from({ length: 24 }).map((_, h) => ({
        hour: h,
        transactions: Math.max(0, Math.floor((Math.sin((h / 24) * Math.PI * 2) + 1) * 30 + rnd() * 10)),
        sales: Math.max(0, Math.floor((Math.sin((h / 24) * Math.PI * 2) + 1) * 100 + rnd() * 40)),
      }));
    }
    case '6': { // RFV
      const customers = Array.from({ length: 200 }).map((_, i) => {
        const purchases = Math.floor(rnd() * 15) + 1;
        const spent = Math.floor(rnd() * 6000) + 100;
        const last = new Date(end.getTime() - Math.floor(rnd() * 80) * 86400000);
        return {
          customerId: `C${i + 1}`,
          customerName: `Cliente ${i + 1}`,
          totalPurchases: purchases,
          totalSpent: spent,
          lastPurchase: last.toISOString(),
          purchaseFrequency: purchases / 3,
        };
      });
      customers.sort((a, b) => b.totalSpent - a.totalSpent);
      return customers;
    }
    case '7': { // Inativos
      const customers = Array.from({ length: 150 }).map((_, i) => {
        const daysAgo = Math.floor(rnd() * 120); // espalha até 120
        const last = new Date(end.getTime() - daysAgo * 86400000);
        return {
          customerId: `I${i + 1}`,
          customerName: `Cliente ${i + 1}`,
          totalPurchases: Math.floor(rnd() * 10) + 1,
          totalSpent: Math.floor(rnd() * 3000) + 50,
          lastPurchase: last.toISOString(),
          purchaseFrequency: 0,
        };
      });
      customers.sort((a, b) => new Date(a.lastPurchase).getTime() - new Date(b.lastPurchase).getTime());
      return customers;
    }
    case '8': { // Margem
      const items = Array.from({ length: 50 }).map((_, i) => {
        const cost = Math.floor(rnd() * 90) + 10;
        const price = cost + Math.floor(rnd() * 90) + 10;
        const marginPct = ((price - cost) / price) * 100;
        return {
          productId: `PM${i + 1}`,
          productName: `Produto ${i + 1}`,
          costPrice: cost,
          sellingPrice: price,
          totalSold: Math.floor(rnd() * 500) + 10,
          totalRevenue: price * (Math.floor(rnd() * 500) + 10),
          profitPerUnit: price - cost,
          profitMarginPercentage: Number(marginPct.toFixed(2)),
        };
      });
      items.sort((a, b) => b.profitMarginPercentage - a.profitMarginPercentage);
      return items;
    }
    default:
      return [];
  }
}

