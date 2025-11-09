import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert
} from 'react-native';
import { TextInput } from '@/components/ui/TextInput';
import { 
  Plus, 
  Minus, 
  ShoppingCart,
  Filter,
  Search,
  X,
  Edit,
  Trash2
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { isPremium } from '@/lib/premium';
import { getTodaySales as getTodaySalesUtil, filterCustomers, formatTimestamp, toTitleCase } from '@/lib/utils';
import db from '@/lib/db';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  barcode?: string;
  type?: 'product' | 'service';
  description?: string;
}

interface SaleItem {
  product: Product;
  quantity: number;
  total: number;
}

interface Sale {
  id: string;
  items: SaleItem[];
  customer?: string;
  paymentMethod: 'cash' | 'credit' | 'debit' | 'pix';
  total: number;
  timestamp: string;
  observation?: string;
}

export default function Vendas() {
  const { colors } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  
  // New Sale State
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestionsVisible, setCustomerSuggestionsVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'debit' | 'pix'>('credit');
  const [observation, setObservation] = useState('');

  // Sales History State
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [premium, setPremium] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);

  // Mock data
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Função para deletar venda
  const handleDeleteSale = (sale: Sale) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            confirmDeleteSale(sale);
          }
        }
      ]
    );
  };

  const confirmDeleteSale = async (sale: Sale) => {
    try {
      const timestamp = new Date().toISOString();
      for (const item of sale.items) {
        if (item.product.type === 'service') continue;
        await db.query(
          'UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?;',
          [item.quantity, timestamp, item.product.id]
        );
      }

      await db.del('sale_items', 'sale_id = ?', [sale.id]);
      await db.del('sales', 'id = ?', [sale.id]);
      await loadData();
      Alert.alert('Sucesso', 'Venda excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting sale:', error);
      Alert.alert('Erro', 'Não foi possível excluir a venda.');
    }
  };

  // Função para editar venda
  const handleEditSale = (sale: Sale) => {
    Alert.alert(
      'Editar Venda',
      'Funcionalidade de edição será implementada em breve.',
      [{ text: 'OK' }]
    );
  };

  const totalSale = saleItems.reduce((sum, item) => sum + item.total, 0);
  const todaySales = React.useMemo(() => getTodaySalesUtil(sales), [sales]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { loadProducts: loadProductsData, loadCustomers: loadCustomersData, loadSales: loadSalesData } = await import('@/lib/data-loader');
    
    const [productsData, customersData, salesData] = await Promise.all([
      loadProductsData(),
      loadCustomersData(),
      loadSalesData()
    ]);
    
    setProducts(productsData as Product[]);
    setCustomers(customersData);

    // Convert sales data to the expected format
    const salesWithValidTimestamps = (salesData as any[]).map(sale => {
      const items = Array.isArray(sale.items) ? sale.items : [];
      return {
        id: sale.id,
        items: items.map((item: any) => ({
          product: {
            id: item.product_id,
            name: item.product_name,
            price: Number(item.unit_price ?? 0),
            stock: 0,
            type: item.product_type === 'service' ? 'service' : 'product',
          },
          quantity: Number(item.quantity ?? 0),
          total: Number(item.total ?? 0),
        })),
        customer: sale.customer_name || '',
        paymentMethod: ((sale.payment_method || 'cash').toLowerCase()) as 'cash' | 'credit' | 'debit' | 'pix',
        total: Number(sale.total ?? 0),
        timestamp: sale.created_at,
        observation: sale.observation,
      };
    });

    setSales(salesWithValidTimestamps);

    const { isPremium } = await import('@/lib/premium');
    const p = await isPremium();
    setPremium(p);
  };

  const filteredCustomers = filterCustomers(customers, customerSearch);

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer.name);
    setSelectedCustomerId(customer.id ?? null);
    setCustomerSearch(customer.name);
    setCustomerSuggestionsVisible(false);
  };

  const handleCustomerSearchChange = (text: string) => {
    setCustomerSearch(text);
    setSelectedCustomer(text);
    setSelectedCustomerId(null);
    setCustomerSuggestionsVisible(text.length > 0);
  };

  const addItemToSale = (product: Product) => {
    const existingItem = saleItems.find(item => item.product.id === product.id);
    const isService = product.type === 'service';

    if (existingItem) {
      if (isService || existingItem.quantity < product.stock) {
        updateItemQuantity(product.id, existingItem.quantity + 1);
      } else {
        Alert.alert('Estoque Insuficiente', 'Não há estoque suficiente para este produto.');
      }
    } else {
      if (isService || product.stock > 0) {
        const newItem: SaleItem = {
          product,
          quantity: 1,
          total: product.price,
        };
        setSaleItems([...saleItems, newItem]);
      } else {
        Alert.alert('Produto Indisponível', 'Este produto está fora de estoque.');
      }
    }
  };

  const updateItemQuantity = (productId: string, newQuantity: number) => {
    setSaleItems(items =>
      items.map(item => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.product.price,
          };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeItemFromSale = (productId: string) => {
    setSaleItems(items => items.filter(item => item.product.id !== productId));
  };

  const finalizeSale = async () => {
    if (saleItems.length === 0) {
      Alert.alert('Venda Vazia', 'Adicione pelo menos um produto à venda.');
      return;
    }

    Alert.alert(
      'Confirmar Venda',
      `Valor Total: R$ ${totalSale.toFixed(2)}\nForma de Pagamento: ${
        paymentMethod === 'cash' ? 'Dinheiro' :
        paymentMethod === 'credit' ? 'Crédito' :
        paymentMethod === 'debit' ? 'Débito' : 'PIX'
      }${selectedCustomer ? `\nCliente: ${selectedCustomer}` : ''}`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const now = new Date();
              const timestamp = now.toISOString();
              const trimmedCustomer = selectedCustomer.trim();

              let customerId = selectedCustomerId;

              if (customerId) {
                const existingCustomer = customers.find((c: any) => c.id === customerId);
              } else if (trimmedCustomer) {
                const existingCustomer = customers.find(
                  (c: any) => c.name?.toLowerCase() === trimmedCustomer.toLowerCase()
                );
                if (existingCustomer) {
                  customerId = existingCustomer.id;
                } else {
                  const newCustomerId = `${Date.now()}-customer`;
                  await db.insert('customers', {
                    id: newCustomerId,
                    name: trimmedCustomer,
                    phone: null,
                    email: null,
                    whatsapp: false,
                    created_at: timestamp,
                    updated_at: timestamp,
                  });
                  customerId = newCustomerId;
                }
              }

              const saleId = Date.now().toString();
              await db.insert('sales', {
                id: saleId,
                customer_id: customerId,
                total: totalSale,
                payment_method: paymentMethod.toUpperCase(),
                observation: observation.trim() ? observation.trim() : null,
                created_at: timestamp,
              });

              await Promise.all(
                saleItems.map(async (item, index) => {
                  const saleItemId = `${saleId}-${index}`;
                  await db.insert('sale_items', {
                    id: saleItemId,
                    sale_id: saleId,
                    product_id: item.product.id,
                    quantity: item.quantity,
                    unit_price: item.product.price,
                    total: item.total,
                  });

                  if (item.product.type !== 'service') {
                    const currentProduct = products.find(p => p.id === item.product.id);
                    const currentStock = currentProduct ? currentProduct.stock : 0;
                    const newStock = Math.max(0, currentStock - item.quantity);
                    await db.update(
                      'products',
                      { stock: newStock, updated_at: timestamp },
                      'id = ?',
                      [item.product.id]
                    );
                  }
                })
              );

              await loadData();

              setSaleItems([]);
              setSelectedCustomer('');
              setSelectedCustomerId(null);
              setCustomerSearch('');
              setPaymentMethod('credit');
              setObservation('');
              setCustomerSuggestionsVisible(false);

              Alert.alert('✅ Sucesso', `Venda de R$ ${totalSale.toFixed(2)} realizada com sucesso!`);
            } catch (error) {
              console.error('Error finalizing sale:', error);
              Alert.alert('❌ Erro', 'Não foi possível finalizar a venda. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  const clearSale = () => {
    Alert.alert(
      'Limpar Venda',
      'Deseja remover todos os itens e limpar o formulário da venda?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: () => {
            setSaleItems([]);
            setSelectedCustomer('');
            setSelectedCustomerId(null);
            setCustomerSearch('');
            setPaymentMethod('credit');
            setObservation('');
            setCustomerSuggestionsVisible(false);
            setProductSearch('');
            setSuggestionsVisible(false);
          },
        },
      ]
    );
  };


  const handleProductSearchSelect = (product: Product) => {
    addItemToSale(product);
    setProductSearch('');
    setSuggestionsVisible(false);
  };

  const filteredProducts = products.filter(p => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.barcode || '').toLowerCase().includes(q) ||
      p.id === q
    );
  });

  const handleProductSearchSubmit = () => {
    const q = productSearch.trim();
    if (!q) return;
    // if matches exact barcode, add product
    const byBarcode = products.find(p => p.barcode === q);
    if (byBarcode) {
      if (!premium) {
        Alert.alert('Premium necessário', 'Escanear produtos por código de barras é premium.');
        return;
      }
      addItemToSale(byBarcode);
      setProductSearch('');
      setSuggestionsVisible(false);
      return;
    }

    // else try by name exact match
    const byName = products.find(p => p.name.toLowerCase() === q.toLowerCase());
    if (byName) {
      addItemToSale(byName);
      setProductSearch('');
      setSuggestionsVisible(false);
      return;
    }

    setSuggestionsVisible(true);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabSelector: {
      flexDirection: 'row',
      margin: 20,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 4,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 6,
    },
    tabButtonActive: {
      backgroundColor: colors.primary,
    },
    tabButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    tabButtonTextActive: {
      color: colors.white,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    
    // New Sale Styles
    productsList: {
      marginBottom: 20,
    },
    productItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    productPrice: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    stockInfo: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.warning,
      marginTop: 2,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    addButtonDisabled: {
      backgroundColor: colors.border,
    },
    addButtonText: {
      color: colors.white,
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
    },
    
    saleItems: {
      marginBottom: 20,
    },
    saleItemCard: {
      marginBottom: 8,
    },
    saleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    saleItemInfo: {
      flex: 1,
    },
    saleItemName: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    saleItemPrice: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    quantityButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quantityText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      minWidth: 20,
      textAlign: 'center',
    },
    itemTotal: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
      marginLeft: 12,
    },
    
    saleForm: {
      gap: 16,
      marginBottom: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      backgroundColor: colors.surface,
    },
    suggestionsContainer: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      borderWidth: 1,
      borderRadius: 8,
      marginTop: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    suggestionItem: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
    },
    suggestionText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      marginBottom: 2,
    },
    suggestionSubtext: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
    },
    paymentMethods: {
      flexDirection: 'row',
      gap: 8,
    },
    paymentButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    paymentButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    paymentButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    paymentButtonTextActive: {
      color: colors.white,
    },
    
    totalSection: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 8,
      marginBottom: 20,
    },
    totalText: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      textAlign: 'center',
    },
    
  });

  // NOTE: Avoid inline component definitions that remount on each render.

  return (
    <View style={styles.container}>
      <Header title="Vendas" showSettings />

      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'new' && styles.tabButtonActive]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'new' && styles.tabButtonTextActive]}>
            Nova Venda
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}>
            Histórico
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'new' ? (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Button
            title="Limpar venda"
            onPress={clearSale}
            variant="outline"
            size="sm"
            textStyle={{ color: colors.error }}
            style={{ alignSelf: 'flex-end', marginTop: 8, marginBottom: 8 }}
          />

          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 8 }}>
              Buscar Produtos ou Serviços
            </Text>
            <TextInput
              style={[styles.input, { marginBottom: 8 }]}
              placeholder="Digite nome, código ou código de barras"
              placeholderTextColor={colors.textSecondary}
              value={productSearch}
              onChangeText={(t) => { setProductSearch(t); setSuggestionsVisible(true); }}
              onSubmitEditing={handleProductSearchSubmit}
            />
            {suggestionsVisible && (
              <View>
                {filteredProducts.map(p => (
                  <TouchableOpacity key={p.id} onPress={() => handleProductSearchSelect(p)} style={{ paddingVertical: 8 }}>
                    <Text style={{ color: colors.text }}>{p.name} {p.barcode ? `• ${p.barcode}` : ''}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>

          {saleItems.length > 0 && (
            <View style={styles.saleItems}>
              <Text style={{ fontSize: 16, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 12 }}>
                Itens da Venda
              </Text>
              {saleItems.map((item) => (
                <Card key={item.product.id} style={styles.saleItemCard}>
                  <View style={styles.saleItem}>
                    <View style={styles.saleItemInfo}>
                      <Text style={styles.saleItemName}>{item.product.name}</Text>
                      <Text style={styles.saleItemPrice}>R$ {item.product.price.toFixed(2)} cada</Text>
                    </View>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus size={16} color={colors.white} />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus size={16} color={colors.white} />
                      </TouchableOpacity>
                      <Text style={styles.itemTotal}>R$ {item.total.toFixed(2)}</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

          <View style={styles.saleForm}>
            <View style={{ position: 'relative', zIndex: 1 }}>
              <TextInput
                style={styles.input}
                placeholder="Cliente (opcional)"
                placeholderTextColor={colors.textSecondary}
                value={customerSearch}
                onChangeText={handleCustomerSearchChange}
                onFocus={() => setCustomerSuggestionsVisible(customerSearch.length > 0)}
              />
              {customerSuggestionsVisible && filteredCustomers.length > 0 && (
                <View style={[styles.suggestionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ScrollView style={{ maxHeight: 150 }} keyboardShouldPersistTaps="handled">
                    {filteredCustomers.map((customer) => (
                      <TouchableOpacity
                        key={customer.id}
                        style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                        onPress={() => handleCustomerSelect(customer)}
                      >
                        <Text style={[styles.suggestionText, { color: colors.text }]}>{toTitleCase(customer.name)}</Text>
                        <Text style={[styles.suggestionSubtext, { color: colors.textSecondary }]}>{customer.phone}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View>
              <Text style={{ fontSize: 14, fontFamily: 'Inter-Medium', color: colors.text, marginBottom: 8 }}>
                Forma de Pagamento
              </Text>
              <View style={styles.paymentMethods}>
                {[
                  { key: 'cash', label: 'Dinheiro' },
                  { key: 'credit', label: 'Crédito' },
                  { key: 'debit', label: 'Débito' },
                  { key: 'pix', label: 'PIX' },
                ].map((method) => (
                  <TouchableOpacity
                    key={method.key}
                    style={[
                      styles.paymentButton,
                      paymentMethod === method.key && styles.paymentButtonActive,
                    ]}
                    onPress={() => setPaymentMethod(method.key as any)}
                  >
                    <Text
                      style={[
                        styles.paymentButtonText,
                        paymentMethod === method.key && styles.paymentButtonTextActive,
                      ]}
                    >
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Observação (opcional)"
              placeholderTextColor={colors.textSecondary}
              value={observation}
              onChangeText={setObservation}
              multiline
            />
          </View>

          <View style={styles.totalSection}>
            <Text style={styles.totalText}>Total: R$ {totalSale.toFixed(2)}</Text>
          </View>
          <Button
            title="Finalizar Venda"
            onPress={finalizeSale}
            disabled={saleItems.length === 0}
            style={{ marginBottom: 40 }}
          />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 18, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 20 }}>
            Histórico de Vendas do Dia
          </Text>
          {todaySales.length === 0 ? (
            <Card style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontFamily: 'Inter-Medium', color: colors.textSecondary, textAlign: 'center' }}>
                Nenhuma venda realizada hoje
              </Text>
              <Text style={{ fontSize: 14, fontFamily: 'Inter-Regular', color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
                As vendas do dia aparecerão aqui
              </Text>
            </Card>
          ) : (
            todaySales.map((sale) => (
              <Card key={sale.id} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 16, fontFamily: 'Inter-SemiBold', color: colors.text }}>
                    Venda #{sale.id.slice(-6)}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleEditSale(sale)}
                      style={{ padding: 4 }}
                    >
                      <Edit size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteSale(sale)}
                      style={{ padding: 4 }}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, fontFamily: 'Inter-Medium', color: colors.text }}>
                    Cliente: {sale.customer || 'Cliente não informado'}
                  </Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Inter-Medium', color: colors.text }}>
                    Total: R$ {sale.total.toFixed(2)}
                  </Text>
                </View>

                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textSecondary }}>
                    Itens:
                  </Text>
                  {sale.items.map((item: SaleItem, index: number) => (
                    <Text key={index} style={{ fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textSecondary }}>
                      • {item.product.name} x{item.quantity} - R$ {item.total.toFixed(2)}
                    </Text>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textSecondary }}>
                    {formatTimestamp(sale.timestamp)}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Inter-Medium',
                        color: sale.paymentMethod === 'credit' ? colors.success : colors.primary,
                      }}
                    >
                      {sale.paymentMethod === 'credit' ? 'Crédito' : 'Dinheiro'}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}

    </View>
  );
}
