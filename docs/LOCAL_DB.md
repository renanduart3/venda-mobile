This project now uses a local SQLite database (via `expo-sqlite`) instead of Supabase online.

What was changed
- `lib/db.ts`: SQLite wrapper and initialization (`initDB`, `insert`, `update`, `del`, `all`, `query`).
- `contexts/OfflineContext.tsx`: was updated to queue and apply local actions to the local DB instead of calling Supabase.
- `lib/export.ts`: helpers to export/import CSV and a placeholder note for Google Sheets integration.
- `lib/reports.ts`: report generation (sales/expenses) by period with minimum 1 month validation.

How it works
- On app start you should call `await db.initDB()` to ensure tables are created. The app should call this from the root (e.g., in the `useFrameworkReady` hook or main layout).
- All data is stored locally in `venda.db` inside app storage. When the user installs the app, the DB will be created automatically on first run.

Premium features
- Export to CSV: implemented (`lib/export.ts`). Shares or writes a CSV to the device.
- Import from CSV: implemented (`lib/export.ts`). The CSV parser is simple and expects comma-separated values with headers.
- Google Sheets export: placeholder. Full integration requires server-side credentials or OAuth flow. Recommended approach: implement a backend endpoint that accepts CSV/rows and pushes to Google Sheets via the Google Sheets API using a service account or per-user OAuth.
- Reports: `lib/reports.ts` provides `generateSalesReport` and `generateExpenseReport`. These accept `period` = `monthly`, `yearly` or `custom` (requires start/end) and enforce at least 1 month duration.

Notes and next steps
- Add `expo-sqlite` to `package.json` dependencies.
- Ensure `initDB()` is called early in app lifecycle.
- Improve CSV parsing to handle quoted commas/newlines if needed.
- Implement secure Google Sheets export workflow if required.
