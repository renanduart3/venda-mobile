// Configuração para ativar/desativar mocks
export const USE_MOCKS = false; // Ativado para visualizar relatórios premium

export const mockProducts = [
  {
    id: '1',
    name: 'Coca-Cola 350ml',
    price: 3.50,
    stock: 50,
    min_stock: 10,
    barcode: '123456789',
    image_url: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400',
    type: 'product',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Pão de Açúcar',
    price: 0.50,
    stock: 100,
    min_stock: 20,
    type: 'product',
    image_url: 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Leite Integral 1L',
    price: 4.80,
    stock: 5,
    min_stock: 15,
    type: 'product',
    image_url: 'https://images.pexels.com/photos/416354/pexels-photo-416354.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Sabonete Líquido',
    price: 8.90,
    stock: 0,
    min_stock: 5,
    type: 'product',
    image_url: 'https://images.pexels.com/photos/4465831/pexels-photo-4465831.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Corte de Cabelo',
    price: 35.00,
    stock: 0,
    min_stock: 0,
    type: 'service',
    description: 'Corte de cabelo tradicional',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Manicure',
    price: 25.00,
    stock: 0,
    min_stock: 0,
    type: 'service',
    description: 'Serviço de manicure completo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Cerveja Skol 350ml',
    price: 2.50,
    stock: 80,
    min_stock: 15,
    type: 'product',
    image_url: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Chocolate Nestlé',
    price: 5.90,
    stock: 25,
    min_stock: 8,
    type: 'product',
    image_url: 'https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '9',
    name: 'Café Pilão 500g',
    price: 12.90,
    stock: 15,
    min_stock: 5,
    type: 'product',
    image_url: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '10',
    name: 'Açúcar Cristal 1kg',
    price: 3.20,
    stock: 30,
    min_stock: 10,
    type: 'product',
    image_url: 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '11',
    name: 'Açúcar Cristal 2kg',
    price: 6.20,
    stock: 10,
    min_stock: 6,
    type: 'product',
    image_url: 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockCustomers = [
  {
    id: '1',
    name: 'João Silva',
    phone: '(11) 98765-4321',
    email: 'joao.silva@email.com',
    whatsapp: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Maria Santos',
    phone: '(11) 91234-5678',
    email: 'maria.santos@email.com',
    whatsapp: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Pedro Costa',
    phone: '(11) 99988-7766',
    email: 'pedro.costa@email.com',
    whatsapp: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Ana Oliveira',
    phone: '(11) 95544-3322',
    email: 'ana.oliveira@email.com',
    whatsapp: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Carlos Mendes',
    phone: '(11) 98877-6655',
    email: 'carlos.mendes@email.com',
    whatsapp: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Fernanda Lima',
    phone: '(11) 94433-2211',
    email: 'fernanda.lima@email.com',
    whatsapp: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Roberto Alves',
    phone: '(11) 93322-1100',
    email: 'roberto.alves@email.com',
    whatsapp: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Lucia Ferreira',
    phone: '(11) 92211-0099',
    email: 'lucia.ferreira@email.com',
    whatsapp: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockSales = [
  // Vendas de hoje (diferentes horários)
  {
    id: '1',
    customer_id: '1',
    customer_name: 'João Silva',
    total: 14.30,
    payment_method: 'Dinheiro',
    observation: '',
    created_at: new Date(new Date().setHours(8, 30)).toISOString(),
    items: [
      { product_id: '1', product_name: 'Coca-Cola 350ml', quantity: 2, unit_price: 3.50, total: 7.00 },
      { product_id: '2', product_name: 'Pão de Açúcar', quantity: 10, unit_price: 0.50, total: 5.00 },
      { product_id: '3', product_name: 'Leite Integral 1L', quantity: 1, unit_price: 4.80, total: 4.80 },
    ],
  },
  {
    id: '2',
    customer_id: '2',
    customer_name: 'Maria Santos',
    total: 35.00,
    payment_method: 'PIX',
    observation: 'Pagamento via PIX',
    created_at: new Date(new Date().setHours(10, 15)).toISOString(),
    items: [
      { product_id: '5', product_name: 'Corte de Cabelo', quantity: 1, unit_price: 35.00, total: 35.00 },
    ],
  },
  {
    id: '3',
    customer_id: '3',
    customer_name: 'Pedro Costa',
    total: 17.80,
    payment_method: 'Cartão',
    observation: '',
    created_at: new Date(new Date().setHours(14, 45)).toISOString(),
    items: [
      { product_id: '4', product_name: 'Sabonete Líquido', quantity: 2, unit_price: 8.90, total: 17.80 },
    ],
  },
  {
    id: '4',
    customer_id: '4',
    customer_name: 'Ana Oliveira',
    total: 25.00,
    payment_method: 'PIX',
    observation: '',
    created_at: new Date(new Date().setHours(16, 20)).toISOString(),
    items: [
      { product_id: '6', product_name: 'Manicure', quantity: 1, unit_price: 25.00, total: 25.00 },
    ],
  },
  {
    id: '5',
    customer_id: '5',
    customer_name: 'Carlos Mendes',
    total: 8.40,
    payment_method: 'Dinheiro',
    observation: '',
    created_at: new Date(new Date().setHours(18, 10)).toISOString(),
    items: [
      { product_id: '7', product_name: 'Cerveja Skol 350ml', quantity: 3, unit_price: 2.50, total: 7.50 },
      { product_id: '8', product_name: 'Chocolate Nestlé', quantity: 1, unit_price: 5.90, total: 5.90 },
    ],
  },
  // Vendas de ontem
  {
    id: '6',
    customer_id: '6',
    customer_name: 'Fernanda Lima',
    total: 45.80,
    payment_method: 'Cartão',
    observation: '',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
    items: [
      { product_id: '1', product_name: 'Coca-Cola 350ml', quantity: 4, unit_price: 3.50, total: 14.00 },
      { product_id: '9', product_name: 'Café Pilão 500g', quantity: 2, unit_price: 12.90, total: 25.80 },
      { product_id: '10', product_name: 'Açúcar Cristal 1kg', quantity: 2, unit_price: 3.20, total: 6.40 },
    ],
  },
  {
    id: '7',
    customer_id: '7',
    customer_name: 'Roberto Alves',
    total: 12.50,
    payment_method: 'PIX',
    observation: '',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(),
    items: [
      { product_id: '7', product_name: 'Cerveja Skol 350ml', quantity: 5, unit_price: 2.50, total: 12.50 },
    ],
  },
  // Vendas da semana passada
  {
    id: '8',
    customer_id: '8',
    customer_name: 'Lucia Ferreira',
    total: 67.50,
    payment_method: 'Cartão',
    observation: '',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(),
    items: [
      { product_id: '5', product_name: 'Corte de Cabelo', quantity: 1, unit_price: 35.00, total: 35.00 },
      { product_id: '6', product_name: 'Manicure', quantity: 1, unit_price: 25.00, total: 25.00 },
      { product_id: '8', product_name: 'Chocolate Nestlé', quantity: 1, unit_price: 5.90, total: 5.90 },
      { product_id: '9', product_name: 'Café Pilão 500g', quantity: 1, unit_price: 12.90, total: 12.90 },
    ],
  },
  {
    id: '9',
    customer_id: '1',
    customer_name: 'João Silva',
    total: 15.60,
    payment_method: 'Dinheiro',
    observation: '',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000).toISOString(),
    items: [
      { product_id: '2', product_name: 'Pão de Açúcar', quantity: 20, unit_price: 0.50, total: 10.00 },
      { product_id: '3', product_name: 'Leite Integral 1L', quantity: 1, unit_price: 4.80, total: 4.80 },
      { product_id: '10', product_name: 'Açúcar Cristal 1kg', quantity: 1, unit_price: 3.20, total: 3.20 },
    ],
  },
  {
    id: '10',
    customer_id: '2',
    customer_name: 'Maria Santos',
    total: 28.40,
    payment_method: 'PIX',
    observation: '',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000).toISOString(),
    items: [
      { product_id: '1', product_name: 'Coca-Cola 350ml', quantity: 3, unit_price: 3.50, total: 10.50 },
      { product_id: '4', product_name: 'Sabonete Líquido', quantity: 2, unit_price: 8.90, total: 17.80 },
    ],
  },
];

export const mockExpenses = [
  {
    id: '1',
    name: 'Aluguel',
    amount: 2500.00,
    due_date: new Date(2025, 9, 10).toISOString(),
    paid: 1,
    recurring: 1,
    customer_id: null,
    created_month: new Date().toISOString().slice(0, 7), // Mês atual
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Energia Elétrica',
    amount: 450.00,
    due_date: new Date(2025, 9, 15).toISOString(),
    paid: 0,
    recurring: 1,
    customer_id: null,
    created_month: new Date().toISOString().slice(0, 7), // Mês atual
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Fornecedor - Produtos',
    amount: 3200.00,
    due_date: new Date(2025, 9, 20).toISOString(),
    paid: 0,
    recurring: 0,
    customer_id: null,
    created_month: new Date().toISOString().slice(0, 7), // Mês atual
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Serviço de Limpeza',
    amount: 150.00,
    due_date: new Date(2025, 9, 25).toISOString(),
    paid: 0,
    recurring: 0,
    customer_id: '1', // João Silva
    created_month: new Date().toISOString().slice(0, 7), // Mês atual
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Manutenção de Equipamentos',
    amount: 300.00,
    due_date: new Date(2025, 9, 30).toISOString(),
    paid: 0,
    recurring: 0,
    customer_id: '2', // Maria Santos
    created_month: new Date().toISOString().slice(0, 7), // Mês atual
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Salário Funcionário',
    amount: 1800.00,
    due_date: new Date(2025, 9, 5).toISOString(),
    paid: 1,
    recurring: 1,
    customer_id: null,
    created_month: new Date().toISOString().slice(0, 7), // Mês atual
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Compra fiado - João Silva',
    amount: 150.00,
    due_date: new Date(2025, 9, 25).toISOString(),
    paid: 0,
    recurring: 0,
    customer_id: '1',
    created_month: new Date().toISOString().slice(0, 7), // Mês atual
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Compra fiado - João Silva',
    amount: 85.50,
    due_date: new Date(2025, 9, 28).toISOString(),
    paid: 0,
    recurring: 0,
    customer_id: '1',
    created_month: new Date().toISOString().slice(0, 7), // Mês atual
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '9',
    name: 'Compra fiado - Maria Santos',
    amount: 220.00,
    due_date: new Date(2025, 9, 22).toISOString(),
    paid: 0,
    recurring: 0,
    customer_id: '2',
    created_month: new Date().toISOString().slice(0, 7), // Mês atual
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '10',
    name: 'Dívida Aberta - Pedro Costa',
    amount: 75.00,
    due_date: null, // Sem data de vencimento
    paid: 0,
    recurring: 0,
    customer_id: '3',
    created_month: new Date().toISOString().slice(0, 7), // Mês atual
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Dashboard mock data
export const mockDashboardStats = {
  dailySales: 5, // 5 vendas hoje
  dailyRevenue: 100.50, // R$ 100,50 em vendas hoje
  lowStockCount: 2, // 2 produtos com estoque baixo (Leite e Sabonete)
  totalCustomers: 8, // 8 clientes cadastrados
  monthlyExpenses: 3500.00, // R$ 3.500 em despesas do mês
  topProducts: [
    { name: 'Coca-Cola 350ml', sales: 9 }, // 9 unidades vendidas
    { name: 'Cerveja Skol 350ml', sales: 8 }, // 8 unidades vendidas
    { name: 'Pão de Açúcar', sales: 30 }, // 30 unidades vendidas
    { name: 'Café Pilão 500g', sales: 3 }, // 3 unidades vendidas
    { name: 'Chocolate Nestlé', sales: 2 }, // 2 unidades vendidas
  ],
  peakHours: [
    { hour: '08:00', sales: 14.30 },
    { hour: '10:00', sales: 35.00 },
    { hour: '14:00', sales: 17.80 },
    { hour: '16:00', sales: 25.00 },
    { hour: '18:00', sales: 8.40 },
  ],
};

// Store settings mock data
export const mockStoreSettings = {
  storeName: 'Loja do João',
  ownerName: 'João Silva',
  pixKeys: [
    'joao.silva@email.com',
    '(11) 98765-4321',
    '123.456.789-00',
    'Banco do Brasil - 12345-6'
  ],
};