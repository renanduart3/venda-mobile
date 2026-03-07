import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client configurado com persistência de sessão no AsyncStorage.
 * A sessão é restaurada automaticamente ao reiniciar o app — o usuário
 * só precisa autenticar uma única vez.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // necessário para interceptar o token via deep link lojaapp://
  },
});

// ─── Tipos locais ──────────────────────────────────────────────────────────────

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