// expo-sqlite does not ship TS types in this project; import as any to avoid type errors
let db: any = null;
try {
  const SQLite: any = require('expo-sqlite');
  const DB_NAME = 'venda.db';
  db = SQLite.openDatabase(DB_NAME);
} catch (err) {
  // Provide a clearer error for native module issues
  console.error('Failed to initialize expo-sqlite. Ensure native modules are linked and you are running on a device/emulator (not web).', err);
  throw err;
}

function execSql(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        (_: any, result: any) => resolve(result),
        (_: any, error: any) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

export async function initDB() {
  // Create tables if they don't exist
  await execSql(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT,
      price REAL,
      stock INTEGER,
      min_stock INTEGER,
      barcode TEXT,
      image_url TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  await execSql(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      email TEXT,
      whatsapp INTEGER,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  await execSql(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      total REAL,
      payment_method TEXT,
      observation TEXT,
      created_at TEXT
    );
  `);

  await execSql(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT,
      product_id TEXT,
      quantity INTEGER,
      unit_price REAL,
      total REAL
    );
  `);

  await execSql(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      name TEXT,
      amount REAL,
      due_date TEXT,
      paid INTEGER,
      recurring INTEGER,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  await execSql(`
    CREATE TABLE IF NOT EXISTS store_settings (
      id TEXT PRIMARY KEY,
      store_name TEXT,
      owner_name TEXT,
      pix_key TEXT,
      primary_color TEXT,
      secondary_color TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);
}

// Generic helpers
export async function insert(table: string, data: Record<string, any>) {
  const columns = Object.keys(data);
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(',')}) VALUES (${placeholders});`;
  const params = columns.map(k => (typeof data[k] === 'boolean' ? (data[k] ? 1 : 0) : data[k]));
  return execSql(sql, params);
}

export async function update(table: string, data: Record<string, any>, whereClause = 'id = ?', whereParams: any[] = []) {
  const columns = Object.keys(data);
  const setSql = columns.map(c => `${c} = ?`).join(', ');
  const sql = `UPDATE ${table} SET ${setSql} WHERE ${whereClause};`;
  const params = columns.map(k => (typeof data[k] === 'boolean' ? (data[k] ? 1 : 0) : data[k])).concat(whereParams);
  return execSql(sql, params);
}

export async function del(table: string, whereClause = 'id = ?', whereParams: any[] = []) {
  const sql = `DELETE FROM ${table} WHERE ${whereClause};`;
  return execSql(sql, whereParams);
}

export async function all(table: string, whereClause = '', params: any[] = []) {
  const sql = `SELECT * FROM ${table} ${whereClause ? 'WHERE ' + whereClause : ''};`;
  const res = await execSql(sql, params);
  const rows = res.rows;
  const result: any[] = [];
  for (let i = 0; i < rows.length; i++) result.push(rows.item(i));
  return result;
}

export async function query(sql: string, params: any[] = []) {
  const res = await execSql(sql, params);
  const rows = res.rows;
  const result: any[] = [];
  for (let i = 0; i < rows.length; i++) result.push(rows.item(i));
  return result;
}

export default {
  initDB,
  insert,
  update,
  del,
  all,
  query,
};
