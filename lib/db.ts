import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
const DB_NAME = 'venda.db';

// Initialize database for mobile
try {
  // Use the correct API for expo-sqlite
  if (SQLite.openDatabaseSync) {
    db = SQLite.openDatabaseSync(DB_NAME);
  } else if (SQLite.openDatabase) {
    db = SQLite.openDatabase(DB_NAME);
  } else {
    console.warn('No valid SQLite database method available');
    db = null;
  }
} catch (e) {
  console.warn('Could not open SQLite database:', e);
  db = null;
}

async function execSql(sql: string, params: any[] = []): Promise<any> {
  if (!db) {
    console.warn('Database not available');
    return { rows: { length: 0, item: () => null, _array: [] } };
  }

  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          sql,
          params,
          (_, result) => {
            resolve({
              rows: {
                length: result.rows.length,
                item: (i: number) => result.rows.item(i),
                _array: result.rows._array || []
              }
            });
          },
          (_, error) => {
            console.error('SQL execution error:', error);
            reject(error);
            return false;
          }
        );
      },
      (error) => {
        console.error('Transaction error:', error);
        reject(error);
      }
    );
  });
}

export async function initDB() {
  if (!db) {
    console.warn('Database not available - skipping initialization');
    return;
  }

  try {
    await execSql(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT,
        price REAL,
        stock INTEGER,
        min_stock INTEGER,
        barcode TEXT,
        image_url TEXT,
        type TEXT DEFAULT 'product',
        description TEXT,
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
        customer_id TEXT,
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
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
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
  if (!db) {
    console.warn('Database not available');
    return [];
  }

  const sql = `SELECT * FROM ${table} ${whereClause ? 'WHERE ' + whereClause : ''};`;
  const res = await execSql(sql, params);
  const rows = res.rows;

  if (rows._array) {
    return rows._array;
  }

  const result: any[] = [];
  for (let i = 0; i < rows.length; i++) result.push(rows.item(i));
  return result;
}

export async function query(sql: string, params: any[] = []) {
  if (!db) {
    console.warn('Database not available');
    return [];
  }

  const res = await execSql(sql, params);
  const rows = res.rows;

  if (rows._array) {
    return rows._array;
  }

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
