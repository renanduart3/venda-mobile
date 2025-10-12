// Local database types (kept for compatibility with existing imports)
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  min_stock: number;
  barcode?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  whatsapp: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  customer_id?: string;
  total: number;
  payment_method: 'cash' | 'credit' | 'debit' | 'pix';
  observation?: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  paid: boolean;
  recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  owner_name: string;
  pix_key?: string;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
}

export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
  },
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        order: (column: string, options: any) => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  }),
} as any;