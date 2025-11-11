/**
 * Common filtering utilities to avoid code duplication
 */

/**
 * Filter customers by search query (name, phone, or email)
 */
export function filterCustomers(customers: any[], searchQuery: string) {
  if (!searchQuery || !searchQuery.trim()) {
    return customers;
  }
  
  const query = searchQuery.toLowerCase().trim();
  
  return customers.filter(customer =>
    customer.name?.toLowerCase().includes(query) ||
    customer.phone?.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(query)
  );
}

/**
 * Filter products by search query (name or barcode)
 */
export function filterProducts(products: any[], searchQuery: string) {
  if (!searchQuery || !searchQuery.trim()) {
    return products;
  }
  
  const query = searchQuery.toLowerCase().trim();
  
  return products.filter(product =>
    product.name?.toLowerCase().includes(query) ||
    product.barcode?.toLowerCase().includes(query)
  );
}

/**
 * Get sales for today only
 */
export function getTodaySales(sales: any[]) {
  const today = new Date();
  const todayBr = formatBrDate(today); // DD/MM/YYYY
  return sales.filter(sale => {
    const raw = sale.timestamp || sale.created_at;
    if (!raw) return false;
    // Accept already BR format or ISO
    let br: string;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      br = raw;
    } else if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const [y,m,d] = raw.slice(0,10).split('-');
      br = `${d}/${m}/${y}`;
    } else {
      try {
        const d = new Date(raw);
        if (isNaN(d.getTime())) return false;
        br = formatBrDate(d);
      } catch { return false; }
    }
    return br === todayBr;
  });
}

/**
 * Format timestamp to locale time string with error handling
 */
export function formatTimestamp(timestamp: string | undefined): string {
  if (!timestamp) return 'Horário inválido';
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Horário inválido';
    return date.toLocaleTimeString('pt-BR');
  } catch (error) {
    return 'Horário inválido';
  }
}

/**
 * Paginate array of items
 */
export function paginateItems<T>(items: T[], currentPage: number, itemsPerPage: number): {
  paginatedItems: T[];
  totalPages: number;
  startIndex: number;
  endIndex: number;
} {
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);
  
  return {
    paginatedItems,
    totalPages,
    startIndex,
    endIndex,
  };
}

/**
 * Convert a string to Title Case (Capital Case) with simple PT-BR tweaks.
 * - Capitalizes first letter of each word
 * - Keeps common short prepositions/conjunctions in lowercase unless first or last
 */
export function toTitleCase(input: string): string {
  if (!input) return '';
  const lower = input.toLowerCase().trim().replace(/\s+/g, ' ');
  const smallWords = new Set([
    'da','de','do','das','dos','e','em','para','por','a','o','as','os','no','na','nos','nas','du','d\'','di'
  ]);
  const words = lower.split(' ');
  const result = words.map((w, i) => {
    if (!w) return w;
    const isEdge = i === 0 || i === words.length - 1;
    if (!isEdge && smallWords.has(w)) return w;
    // handle hyphenated words: ana-maria -> Ana-Maria
    return w.split('-').map(part => part ? part[0].toUpperCase() + part.slice(1) : part).join('-');
  });
  return result.join(' ');
}

// === Datas (PT-BR) ===
export function formatBrDate(d: Date): string {
  const day = String(d.getDate()).padStart(2,'0');
  const month = String(d.getMonth()+1).padStart(2,'0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function parseBrDate(str: string): Date | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return null;
  const [dd, mm, yyyy] = str.split('/').map(Number);
  const d = new Date(yyyy, (mm||1)-1, dd||1);
  return isNaN(d.getTime()) ? null : d;
}

// Normaliza entrada que pode vir em DD-MM-YYYY, YYYY-MM-DD ou ISO para DD/MM/YYYY
export function normalizeToBrDate(raw: string): string {
  if (!raw) return formatBrDate(new Date());
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [dd,mm,yyyy] = raw.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y,m,d] = raw.slice(0,10).split('-');
    return `${d}/${m}/${y}`;
  }
  // Fallback: Date parse
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return formatBrDate(d);
  } catch {}
  return formatBrDate(new Date());
}
