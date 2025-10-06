import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as DocumentPicker from 'expo-document-picker';
import db from './db';
import { isPremium } from './premium';

function toCSV(rows: any[]) {
  if (!rows || rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const header = keys.join(',');
  const body = rows.map(r => keys.map(k => {
    const v = r[k];
    if (v === null || v === undefined) return '';
    const stringValue = String(v);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }).join(','));
  return [header].concat(body).join('\n');
}

function parseCSV(csvString: string): any[] {
  const lines = csvString.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return [];

  const keys = lines[0].split(',').map(k => k.trim());
  const rows = lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const obj: any = {};
    keys.forEach((k, i) => {
      const value = values[i] || '';
      if (value === '' || value === 'null' || value === 'undefined') {
        obj[k] = null;
      } else if (k === 'price' || k === 'stock' || k === 'min_stock' || k === 'whatsapp' || k === 'paid' || k === 'recurring' || k === 'quantity' || k === 'unit_price' || k === 'total' || k === 'amount') {
        obj[k] = parseFloat(value) || 0;
      } else {
        obj[k] = value;
      }
    });
    return obj;
  });

  return rows;
}

export async function exportDatabaseToCSV() {
  const premium = await isPremium();
  if (!premium) throw new Error('Funcionalidade premium: exportar banco de dados.');

  const tables = ['products', 'customers', 'sales', 'sale_items', 'expenses', 'store_settings'];
  const exports: { [key: string]: string } = {};

  for (const table of tables) {
    const rows = await db.all(table);
    exports[table] = toCSV(rows);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `database_export_${timestamp}.json`;
  const path = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(
    path,
    JSON.stringify(exports, null, 2),
    { encoding: FileSystem.EncodingType.UTF8 }
  );

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'application/json' });
  }

  return path;
}

export async function exportTableToCSV(table: string) {
  const premium = await isPremium();
  if (!premium) throw new Error('Funcionalidade premium: exportar dados.');
  const rows = await db.all(table);
  const csv = toCSV(rows);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${table}_${timestamp}.csv`;
  const path = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'text/csv' });
  }
  return path;
}

export async function importDatabaseFromFile() {
  const premium = await isPremium();
  if (!premium) throw new Error('Funcionalidade premium: importar banco de dados.');

  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    throw new Error('Importação cancelada.');
  }

  const fileUri = result.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const exports = JSON.parse(content);
  let totalImported = 0;

  for (const [table, csvString] of Object.entries(exports)) {
    if (typeof csvString === 'string') {
      const rows = parseCSV(csvString);
      for (const row of rows) {
        await db.insert(table, row);
        totalImported++;
      }
    }
  }

  return totalImported;
}

export async function importCSVFromFile(table: string) {
  const premium = await isPremium();
  if (!premium) throw new Error('Funcionalidade premium: importar dados.');

  const result = await DocumentPicker.getDocumentAsync({
    type: 'text/csv',
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    throw new Error('Importação cancelada.');
  }

  const fileUri = result.assets[0].uri;
  const csvString = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const rows = parseCSV(csvString);

  for (const row of rows) {
    await db.insert(table, row);
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
