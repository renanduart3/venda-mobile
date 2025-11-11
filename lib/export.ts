import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { htmlShell, renderSummary, renderTable, renderHBarChart } from './report-templates';

export async function reportToPDF(html: string, fileName?: string) {
  const { uri } = await Print.printToFileAsync({ html });
  let finalUri = uri;
  try {
    if (fileName) {
      const safe = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      const dest = (FileSystem as any).documentDirectory + safe;
      await FileSystem.copyAsync({ from: uri, to: dest });
      try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {}
      finalUri = dest;
    }
  } catch {}
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(finalUri, { mimeType: 'application/pdf' });
    }
  } catch {}
  return finalUri;
}

const LABEL_PT: Record<string, string> = {
  productId: 'ID',
  productName: 'Nome',
  totalSold: 'Total',
  totalRevenue: 'Lucro',
  averagePrice: 'Média',
  percentage: 'Percentual',
  cumulativePercentage: 'Percentual Acumulado',
  category: 'Categoria',
  date: 'Data',
  transactions: 'Transações',
  total_sales: 'Receita',
  average_ticket: 'Ticket Médio',
  method: 'Método',
  totalAmount: 'Valor Total',
  transactionCount: 'Transações',
  hour: 'Hora',
  sales: 'Vendas',
  customerId: 'Cliente ID',
  customerName: 'Cliente',
  totalPurchases: 'Compras',
  totalSpent: 'Total Gasto',
  lastPurchase: 'Última Compra',
  purchaseFrequency: 'Frequência',
  costPrice: 'Custo',
  sellingPrice: 'Preço Venda',
  profitPerUnit: 'Lucro/Un',
  profitMarginPercentage: 'Margem %',
};

export function generateReportHTML(reportTitle: string, reportData: any[], period: string, extraHtml?: string): string {
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const sections: string[] = [];
  if (extraHtml) sections.push(extraHtml);
  sections.push(renderSummary(`<strong>Resumo:</strong> ${Array.isArray(reportData) ? reportData.length : 0} registros`));
  sections.push(renderTable(reportData, LABEL_PT));
  const body = sections.join('');
  return htmlShell({ title: reportTitle, period, currentDate, body });
}

export function generateReportChartHTML(reportId: string, reportData: any[]): string {
  const rows = Array.isArray(reportData) ? reportData : (reportData ? [reportData] : []);
  switch (reportId) {
    case '1': {
      const items = rows.map((r:any)=>({ label: String(r.productName||'Produto'), value: Number(r.totalSold||0) })).slice(0,10);
      const totalQty = rows.reduce((a,r)=> a + Number((r as any).totalSold||0),0);
      const totalRev = rows.reduce((a,r)=> a + Number((r as any).totalRevenue||0),0);
      return renderHBarChart({ title: 'Top Produtos (Quantidade)', items, summary: `Quantidade total ${totalQty.toLocaleString('pt-BR')} · Receita total R$ ${totalRev.toLocaleString('pt-BR')}` });
    }
    case '2': {
      let cumulative = 0;
      const items = rows.map((r:any)=>{
        const p = Number(r.percentage||0); cumulative += p;
        const cat = r.category || (cumulative<=80?'A': cumulative<=95?'B':'C');
        const color = cat==='A'?'#16a34a': cat==='B'?'#f59e0b':'#6b7280';
        return { label: String(r.productName||'Produto'), value: p, color };
      }).slice(0,10);
      return renderHBarChart({ title: 'Curva ABC - % Receita por Produto', items, legend: 'Legenda: A (≤80%), B (≤95%), C (>95%)' });
    }
    case '3': {
      const items = rows.map((r:any)=>({ label: formatDate(r.date), value: Number(r.total_sales||0) }));
      return renderHBarChart({ title: 'Tendência de Vendas (Receita)', items });
    }
    case '4': {
      const items = rows.map((r:any)=>({ label: String(r.method||'Método').toUpperCase(), value: Number(r.percentage||0) }));
      return renderHBarChart({ title: 'Participação por Método de Pagamento (%)', items });
    }
    case '5': {
      const items = rows.map((r:any)=>({ label: `${pad2(Number(r.hour)||0)}:00`, value: Number(r.transactions||0) }));
      return renderHBarChart({ title: 'Transações por Hora', items });
    }
    case '6': {
      const items = rows.map((r:any)=>({ label: String(r.customerName||'Cliente'), value: Number(r.totalSpent||0) })).slice(0,10);
      return renderHBarChart({ title: 'Ranking de Clientes (Valor Gasto)', items });
    }
    case '7': {
      const days = rows.map((r:any)=>{ try{ const d=new Date(r.lastPurchase); if(!isNaN(d.getTime())){ const now=new Date(); return Math.max(0, Math.round((now.getTime()-d.getTime())/(1000*60*60*24))); } }catch{} return 0; });
      const items = [
        { label: '0-30', value: days.filter(d=> d<=30).length, color: '#16a34a' },
        { label: '30-60', value: days.filter(d=> d>30 && d<=60).length, color: '#f59e0b' },
        { label: '60-90', value: days.filter(d=> d>60 && d<=90).length, color: '#6b7280' },
      ];
      return renderHBarChart({ title: 'Inativos por Faixa (dias)', items, legend: 'Faixas: 0-30, 30-60, 60-90 dias' });
    }
    case '8': {
      const items = rows.map((r:any)=>({ label: String(r.productName||'Produto'), value: Number(r.profitMarginPercentage||0) }))
        .sort((a,b)=> b.value-a.value).slice(0,10);
      return renderHBarChart({ title: 'Margem de Lucro por Produto (%)', items });
    }
    default:
      return '';
  }
}

function pad2(n:number){ return String(n).padStart(2,'0'); }
function formatDate(v:any){ try{ const d=new Date(v); if(!isNaN(d.getTime())){ const dd=pad2(d.getDate()); const mm=pad2(d.getMonth()+1); const yyyy=d.getFullYear(); return `${dd}/${mm}/${yyyy}`;} }catch{} return String(v); }