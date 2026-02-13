import * as SQLite from 'expo-sqlite';

// We support both the new expo-sqlite v15+ API (openDatabaseSync + runAsync/getAllAsync)
// and the legacy WebSQL-style API (openDatabase + transaction/executeSql).
// The execSql helper normalizes results into a common shape used elsewhere.

let db: SQLite.SQLiteDatabase | null = null;
const DB_NAME = 'venda.db';

function initializeDatabase(): SQLite.SQLiteDatabase | null {
  try {
    if (SQLite.openDatabaseSync) {
      // New synchronous open (RN only). Returns an object with async helpers.
      return SQLite.openDatabaseSync(DB_NAME);
    }
    if ((SQLite as any).openDatabase) {
      // Legacy WebSQL style (returns DB with transaction()).
      return (SQLite as any).openDatabase(DB_NAME);
    }
    console.warn('No valid SQLite database method available');
    return null;
  } catch (e) {
    console.warn('Could not open SQLite database:', e);
    return null;
  }
}

async function execSql(sql: string, params: any[] = []): Promise<any> {
  if (!db) {
    console.warn('Database not available');
    return { rows: { length: 0, item: () => null, _array: [] } };
  }

  const isSelect = /^\s*SELECT/i.test(sql);

  // New API detection: runAsync/getAllAsync/withTransactionAsync
  const hasNewApi = typeof (db as any).runAsync === 'function' && typeof (db as any).getAllAsync === 'function';

  if (hasNewApi) {
    try {
      if (isSelect) {
        // Use getAllAsync directly without prepared statements to avoid "shared object already released" error
        const rows: any[] = await (db as any).getAllAsync(sql, ...params);
        return {
          rows: {
            length: rows.length,
            item: (i: number) => rows[i],
            _array: rows,
          },
        };
      } else {
        // Mutating statement - use runAsync directly
        const result = await (db as any).runAsync(sql, ...params);
        return {
          rows: { length: 0, item: () => null, _array: [] },
          insertId: result?.lastInsertRowId,
          rowsAffected: result?.changes || 0
        };
      }
    } catch (error: any) {
      console.error('SQL execution error (new API):', error, sql);
      // Log more details about the error
      if (error.message) {
        console.error('Error message:', error.message);
      }
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  // Legacy transaction path
  return new Promise((resolve, reject) => {
    const legacyDb: any = db as any;
    if (!legacyDb.transaction) {
      console.error('Database transaction method not available');
      reject(new Error('Database transaction method not available'));
      return;
    }

    legacyDb.transaction(
      (tx: any) => {
        if (!tx.executeSql) {
          console.error('Transaction executeSql method not available');
          reject(new Error('Transaction executeSql method not available'));
          return;
        }

        tx.executeSql(
          sql,
          params,
          (_: any, result: any) => {
            resolve({
              rows: {
                length: result.rows.length,
                item: (i: number) => result.rows.item(i),
                _array: result.rows._array || [],
              },
            });
          },
          (_: any, error: any) => {
            console.error('SQL execution error (legacy):', error, sql);
            reject(error);
            return false;
          }
        );
      },
      (error: any) => {
        console.error('Transaction error:', error);
        reject(error);
      }
    );
  });
}

export async function initDB() {
  if (!db) {
    db = initializeDatabase();
    if (!db) {
      console.warn('Database not available - skipping initialization');
      return;
    }
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

    // Lightweight migration: add paid_at column iff missing
    // Approach: probe the column; if SELECT fails, add the column.
    try {
      await execSql(`SELECT paid_at FROM expenses LIMIT 1;`);
    } catch (_err) {
      try {
        await execSql(`ALTER TABLE expenses ADD COLUMN paid_at TEXT;`);
      } catch (_e) {
        // ignore if another race added it
      }
    }

    // --- Data normalization/migration for date formats (DD/MM/YYYY standard) ---
    try {
      const res: any = await execSql(`SELECT id, due_date, created_at, updated_at, paid_at FROM expenses;`);
      const rows: any[] = res.rows._array || [];
      const updates: Promise<any>[] = [];
      const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);

      const normalizeBr = (raw: string | null): string | null => {
        if (!raw) return null;
        const trimmed = raw.trim();
        // Already DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
        // DD-MM-YYYY -> convert
        if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
          const [dd, mm, yyyy] = trimmed.split('-');
          return `${dd}/${mm}/${yyyy}`;
        }
        // ISO or YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
          const [yyyy, mm, dd] = trimmed.slice(0, 10).split('-');
          return `${dd}/${mm}/${yyyy}`;
        }
        return trimmed; // leave as is; parser later can decide
      };

      const fixInvalidDay = (br: string | null): string | null => {
        if (!br) return null;
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(br)) return br; // ignore non-br format
        let [ddStr, mmStr, yyyyStr] = br.split('/');
        let dd = parseInt(ddStr, 10);
        const mm = parseInt(mmStr, 10);
        const yyyy = parseInt(yyyyStr, 10);
        const thirty = new Set([4, 6, 9, 11]);
        if (mm === 2) {
          const max = isLeap(yyyy) ? 29 : 28;
          if (dd > max) dd = max; // clamp invalid Feb date
        } else if (thirty.has(mm) && dd > 30) {
          dd = 30;
        } else if (dd > 31) {
          dd = 31;
        }
        return `${String(dd).padStart(2, '0')}/${mmStr}/${yyyyStr}`;
      };

      for (const r of rows) {
        const newDue = fixInvalidDay(normalizeBr(r.due_date));
        const newCreated = normalizeBr(r.created_at);
        const newUpdated = normalizeBr(r.updated_at);
        const newPaidAt = normalizeBr(r.paid_at);
        if (newDue !== r.due_date || newCreated !== r.created_at || newUpdated !== r.updated_at || newPaidAt !== r.paid_at) {
          updates.push(execSql(`UPDATE expenses SET due_date = ?, created_at = ?, updated_at = ?, paid_at = ? WHERE id = ?;`, [newDue, newCreated, newUpdated, newPaidAt, r.id]));
        }
      }
      if (updates.length) {
        await Promise.all(updates);
        console.log(`[DB] Normalized ${updates.length} expense date rows to DD/MM/YYYY format.`);
      }
    } catch (normErr) {
      console.warn('Expense date normalization skipped:', normErr);
    }

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


