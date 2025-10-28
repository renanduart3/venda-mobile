# Utility Libraries Documentation

This directory contains centralized utility functions and helpers to avoid code duplication and improve performance.

## Files Overview

### `data-loader.ts`
Centralized data loading utilities that handle both mock and real database data.

**Functions:**
- `loadProducts()` - Load products from data source
- `loadCustomers()` - Load customers from data source
- `loadSales()` - Load sales from data source
- `loadExpenses()` - Load expenses from data source
- `loadDashboardStats()` - Load dashboard statistics
- `loadStoreSettings()` - Load store configuration

**Usage:**
```typescript
import { loadProducts } from '@/lib/data-loader';

const products = await loadProducts();
```

### `utils.ts`
Common utility functions for filtering, formatting, and data manipulation.

**Functions:**
- `filterCustomers(customers, searchQuery)` - Filter customers by name/phone/email
- `filterProducts(products, searchQuery)` - Filter products by name/barcode
- `getTodaySales(sales)` - Get only today's sales
- `formatTimestamp(timestamp)` - Format timestamp with error handling
- `paginateItems(items, page, perPage)` - Paginate any array of items

**Usage:**
```typescript
import { filterCustomers, formatTimestamp } from '@/lib/utils';

const filtered = filterCustomers(allCustomers, 'john');
const time = formatTimestamp(sale.timestamp);
```

### `shared-styles.ts`
Reusable style creators for common UI patterns.

**Functions:**
- `createModalStyles(colors)` - Create modal dialog styles
- `createListStyles(colors)` - Create list/card view styles

**Usage:**
```typescript
import { createModalStyles } from '@/lib/shared-styles';

const modalStyles = createModalStyles(colors);
```

### `mocks.ts`
Mock data for testing and development.

**Exports:**
- `USE_MOCKS` - Flag to enable/disable mock data
- `mockProducts` - Sample product data
- `mockCustomers` - Sample customer data
- `mockSales` - Sample sales data
- `mockExpenses` - Sample expense data
- `mockDashboardStats` - Sample dashboard statistics
- `mockStoreSettings` - Sample store configuration

**Note:** Uses cached timestamps for better performance.

### `db.ts`
SQLite database utilities and helpers.

**Functions:**
- `initDB()` - Initialize database schema
- `insert(table, data)` - Insert or replace record
- `update(table, data, where, params)` - Update records
- `del(table, where, params)` - Delete records
- `all(table, where, params)` - Query all records
- `query(sql, params)` - Execute custom SQL query

## Best Practices

1. **Always use data loaders** instead of directly importing from `mocks.ts`
2. **Reuse utility functions** instead of duplicating filtering logic
3. **Handle errors** - All utilities include proper error handling
4. **Type safety** - All functions are properly typed with TypeScript
5. **Performance** - Utilities are optimized for performance

## Migration Guide

### Before (Duplicated Code):
```typescript
const { USE_MOCKS, mockProducts } = await import('@/lib/mocks');

if (USE_MOCKS) {
  setProducts(mockProducts);
} else {
  // Load from database
  setProducts([]);
}
```

### After (Using Data Loader):
```typescript
const { loadProducts } = await import('@/lib/data-loader');
const products = await loadProducts();
setProducts(products);
```

### Before (Duplicated Filtering):
```typescript
const filtered = customers.filter(c =>
  c.name.toLowerCase().includes(query.toLowerCase()) ||
  c.phone.includes(query)
);
```

### After (Using Utility):
```typescript
const { filterCustomers } = require('@/lib/utils');
const filtered = filterCustomers(customers, query);
```

## Contributing

When adding new utilities:

1. Keep functions pure and side-effect free when possible
2. Add proper TypeScript types
3. Include error handling
4. Add JSDoc comments
5. Update this README
6. Add tests if applicable

## Performance Considerations

- Data loaders use lazy imports to reduce initial bundle size
- Utilities are tree-shakeable
- Mock data uses cached timestamps to avoid repeated Date creation
- All functions are optimized for common use cases
