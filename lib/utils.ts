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
  const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
  
  return sales.filter(sale => {
    try {
      if (!sale.timestamp && !sale.created_at) return false;
      
      const timestamp = sale.timestamp || sale.created_at;
      const saleDate = new Date(timestamp);
      
      if (isNaN(saleDate.getTime())) return false;
      
      const saleDateString = saleDate.toISOString().split('T')[0];
      return saleDateString === todayString;
    } catch (error) {
      console.error('Error processing sale date:', error);
      return false;
    }
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
