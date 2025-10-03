import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import db from './db';
import { isPremium } from './premium';

function toCSV(rows: any[]) {
  if (!rows || rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const header = keys.join(',');
  const body = rows.map(r => keys.map(k => {
    const v = r[k];
    if (v === null || v === undefined) return '';
    return String(v).replace(/"/g, '""');
  }).join(','));
  return [header].concat(body).join('\n');
}

export async function exportTableToCSV(table: string) {
  const premium = await isPremium();
  if (!premium) throw new Error('Funcionalidade premium: exportar dados.');
  const rows = await db.all(table);
  const csv = toCSV(rows);
  const path = `${FileSystem.documentDirectory}${table}.csv`;
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'text/csv' });
  }
  return path;
}

export async function importCSV(table: string, csvString: string) {
  const premium = await isPremium();
  if (!premium) throw new Error('Funcionalidade premium: importar dados.');
  const lines = csvString.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return 0;
  const keys = lines[0].split(',');
  const rows = lines.slice(1).map(line => {
    const parts = line.split(',');
    const obj: any = {};
    keys.forEach((k, i) => {
      obj[k] = parts[i] ?? null;
    });
    return obj;
  });

  for (const r of rows) {
    await db.insert(table, r);
  }

  return rows.length;
}

// Placeholder for Google Sheets export. Full integration requires OAuth credentials or a server-side proxy.
export async function exportToGoogleSheets(_: string, __: any[]) {
  const premium = await isPremium();
  if (!premium) throw new Error('Funcionalidade premium: exportar para Google Sheets.');
  throw new Error('Google Sheets export requires server-side credentials or OAuth flow. Implement a backend endpoint to accept CSV or rows and push to Google Sheets via Sheets API.');
}

export async function reportToPDF(html: string) {
  const premium = await isPremium();
  if (!premium) throw new Error('Funcionalidade premium: gerar relatório em PDF.');

  const { uri } = await Print.printToFileAsync({ html });
  // Optionally share the PDF
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
  }
  return uri;
}
