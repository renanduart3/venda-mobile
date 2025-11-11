import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import BarChart from './charts/BarChart';

type ChartItem = { label: string; value: number; color?: string };
type ChartData = {
  title: string;
  items: ChartItem[];
  orientation: 'vertical' | 'horizontal';
  hint?: string;
};

export default function ReportChartRenderer({ reportId, data }: { reportId: string; data: any[] }) {
  const { title, items, orientation, hint } = useMemo<ChartData>(
    () => mapData(reportId, Array.isArray(data) ? data : []),
    [reportId, data]
  );

  if (!items.length) {
    return (
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>Sem dados suficientes para exibir o gráfico.</Text>
      </View>
    );
  }

  return (
    <View style={{ paddingVertical: 8, width: '100%', overflow: 'hidden' }}>
      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>{title}</Text>
      <BarChart data={items} orientation={orientation} />
      {!!hint && <Text style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>{hint}</Text>}
    </View>
  );
}

function mapData(reportId: string, data: any[]): ChartData {
  switch (reportId) {
    case '1': {
      const items = data
        .map((r: any) => ({ label: String(r.productName || 'Produto'), value: Number(r.totalSold || 0) }))
        .slice(0, 10);
      return { title: 'Top Produtos (Quantidade)', items, orientation: 'horizontal', hint: 'Top 10 por quantidade vendida' };
    }
    case '2': {
      let cumulative = 0;
      const items = data.map((r: any) => {
        const perc = Number(r.percentage || 0);
        cumulative += perc;
        const cat = r.category || (cumulative <= 80 ? 'A' : cumulative <= 95 ? 'B' : 'C');
        const color = cat === 'A' ? '#16a34a' : cat === 'B' ? '#f59e0b' : '#6b7280';
        return { label: String(r.productName || 'Produto'), value: perc, color };
      });
      return { title: 'Curva ABC - % Receita por Produto', items, orientation: 'horizontal', hint: 'A (≤80%), B (≤95%), C (>95%)' };
    }
    case '3': {
      const items = data.map((r: any) => ({ label: formatDateLabel(r.date), value: Number(r.total_sales || 0) }));
      return { title: 'Tendência de Vendas (Receita)', items, orientation: 'vertical' };
    }
    case '4': {
      const items = data.map((r: any) => ({ label: formatMethod(r.method), value: Number(r.percentage || 0) }));
      return { title: 'Participação por Metodo de Pagamento (%)', items, orientation: 'horizontal' };
    }
    case '5': {
      const items = data.map((r: any) => ({ label: `:${pad2(Number(r.hour) || 0)}:00`, value: Number(r.transactions || 0) }));
      return { title: 'Transações por Hora', items, orientation: 'vertical' };
    }
    case '6': {
      const items = data
        .map((r: any) => ({ label: String(r.customerName || 'Cliente'), value: Number(r.totalSpent || 0) }))
        .slice(0, 10);
      return { title: 'Ranking de Clientes (Valor Gasto)', items, orientation: 'horizontal', hint: 'Top 10 por valor gasto' };
    }
    case '7': {
      const daysSinceLast = data.map((r: any) => daysFromNow(r.lastPurchase));
      const items: ChartItem[] = [
        { label: '0-30', value: daysSinceLast.filter((d) => d >= 0 && d <= 30).length, color: '#16a34a' },
        { label: '30-60', value: daysSinceLast.filter((d) => d > 30 && d <= 60).length, color: '#f59e0b' },
        { label: '60-90', value: daysSinceLast.filter((d) => d > 60 && d <= 90).length, color: '#6b7280' },
      ];
      return { title: 'Inativos por Faixa (dias)', items, orientation: 'horizontal', hint: 'Faixas: 0-30, 30-60, 60-90 dias' };
    }
    case '8': {
      const items = data
        .map((r: any) => ({ label: String(r.productName || 'Produto'), value: Number(r.profitMarginPercentage || 0) }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 10);
      return { title: 'Margem de Lucro por Produto (%)', items, orientation: 'horizontal', hint: 'Top 10 por % de margem' };
    }
    default:
      return { title: 'Gráfico', items: [], orientation: 'vertical' };
  }
}

function formatDateLabel(value: any) {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  } catch {}
  return String(value);
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}
function formatMethod(m: string) {
  return (m || '').toUpperCase();
}
function daysFromNow(iso: any) {
  try {
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      const now = new Date();
      return Math.max(0, Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
    }
  } catch {}
  return 0;
}



