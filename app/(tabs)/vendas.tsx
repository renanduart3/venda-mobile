import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { TextInput } from '@/components/ui/TextInput';
import {
  Plus,
  Minus,
  Edit,
  Trash2,
  Crown,
  Share2,
  Calculator
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getTodaySales as getTodaySalesUtil, filterCustomers, formatTimestamp, toTitleCase } from '@/lib/utils';
import db from '@/lib/db';
import { createVendasStyles } from './Vendas.styles';

interface Product {
  id: string;
  name: string;
  price: number;
  cost_price?: number;
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
  customerPhone?: string;
  paymentMethod: 'cash' | 'credit' | 'debit' | 'pix';
  total: number;
  discount?: number;
  timestamp: string;
  observation?: string;
}

export default function Vendas() {
  const { colors } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'new' | 'avulsa' | 'history'>('new');

  // Venda Avulsa State
  const [avulsaValue, setAvulsaValue] = useState('');
  const [avulsaDesc, setAvulsaDesc] = useState('Venda Avulsa / Diversos');

  // New Sale State
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestionsVisible, setCustomerSuggestionsVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'debit' | 'pix'>('credit');
  const [observation, setObservation] = useState('');
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editingSaleDate, setEditingSaleDate] = useState<string | null>(null);
  const [discountInput, setDiscountInput] = useState('');

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

  const roundMoney = (value: number) =>
    Math.round((value + Number.EPSILON) * 100) / 100;

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
    if (!premium) {
      Alert.alert(
        'Funcionalidade Premium',
        'A edição de vendas é exclusiva para assinantes premium. Faça upgrade para ter total controle do seu caixa.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Fazer Upgrade', onPress: () => router.push('/planos') }
        ]
      );
      return;
    }

    const freshSaleItems = sale.items.map(item => {
      const prod = products.find(p => p.id === item.product.id) || item.product;
      return {
        ...item,
        product: {
          ...prod,
          stock: prod.type === 'service' ? 0 : prod.stock + item.quantity
        }
      };
    });

    setSaleItems(freshSaleItems);
    if (sale.customer) {
      const match = customers.find(c => c.name === sale.customer);
      setSelectedCustomerId(match?.id || null);
      setSelectedCustomer(sale.customer);
      setCustomerSearch(sale.customer);
    } else {
      setSelectedCustomer('');
      setSelectedCustomerId(null);
      setCustomerSearch('');
    }
    setPaymentMethod(sale.paymentMethod);
    setObservation(sale.observation || '');
    setEditingSaleId(sale.id);
    setEditingSaleDate(sale.timestamp);
    
    // Calcula a porcentagem do desconto, se houver
    if (sale.discount && sale.discount > 0) {
      const saleSubtotal = Number(sale.total ?? 0) + Number(sale.discount ?? 0);
      if (saleSubtotal > 0) {
        const descPercent = (Number(sale.discount ?? 0) / saleSubtotal) * 100;
        setDiscountInput(descPercent.toFixed(2).replace('.', ','));
      } else {
        setDiscountInput('');
      }
    } else {
      setDiscountInput('');
    }

    setActiveTab('new');
  };

  const subtotalSale = roundMoney(saleItems.reduce((sum, item) => sum + item.total, 0));
  const discountPercentStr = discountInput.replace(',', '.');
  const discountPercentRaw = parseFloat(discountPercentStr);
  const discountPercent = Number.isFinite(discountPercentRaw)
    ? Math.min(100, Math.max(0, discountPercentRaw))
    : 0;
  const parsedDiscount = roundMoney((subtotalSale * discountPercent) / 100);
  const totalSale = roundMoney(Math.max(0, subtotalSale - parsedDiscount));

  const todaySales = React.useMemo(() => getTodaySalesUtil(sales), [sales]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

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
            cost_price: Number(item.unit_cost ?? 0),
            stock: 0,
            type: item.product_type === 'service' ? 'service' : 'product',
          },
          quantity: Number(item.quantity ?? 0),
          total: Number(item.total ?? 0),
        })),
        customer: sale.customer_name || '',
        customerPhone: sale.customer_phone || '',
        paymentMethod: ((sale.payment_method || 'cash').toLowerCase()) as 'cash' | 'credit' | 'debit' | 'pix',
        total: Number(sale.total ?? 0),
        discount: Number(sale.discount ?? 0),
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
      editingSaleId ? 'Salvar Alterações' : 'Confirmar Venda',
      `Valor Total: R$ ${totalSale.toFixed(2)}\nForma de Pagamento: ${paymentMethod === 'cash' ? 'Dinheiro' :
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
              const isoNow = now.toISOString();
              const brDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
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
                    created_at: isoNow,
                    updated_at: isoNow,
                  });
                  customerId = newCustomerId;
                }
              }

              let finalSaleId = Date.now().toString();
              let finalCreatedAt = isoNow;

              if (editingSaleId) {
                finalSaleId = editingSaleId;
                finalCreatedAt = editingSaleDate || isoNow;
                
                const oldSale = sales.find(s => s.id === editingSaleId);
                if (oldSale) {
                  for (const item of oldSale.items) {
                    if (item.product.type === 'service') continue;
                    await db.query(
                      'UPDATE products SET stock = stock + ? WHERE id = ?;',
                      [item.quantity, item.product.id]
                    );
                  }
                  await db.del('sale_items', 'sale_id = ?', [editingSaleId]);
                  await db.del('sales', 'id = ?', [editingSaleId]);
                }
              }

              await db.insert('sales', {
                id: finalSaleId,
                customer_id: customerId,
                total: totalSale,
                discount: parsedDiscount,
                payment_method: paymentMethod.toUpperCase(),
                observation: observation.trim() ? observation.trim() : null,
                created_at: finalCreatedAt,
              });

              await Promise.all(
                saleItems.map(async (item, index) => {
                  const saleItemId = `${finalSaleId}-${index}`;
                  await db.insert('sale_items', {
                    id: saleItemId,
                    sale_id: finalSaleId,
                    product_id: item.product.id,
                    quantity: item.quantity,
                    unit_price: item.product.price,
                    unit_cost: item.product.cost_price || 0,
                    total: item.total,
                  });

                  if (item.product.type !== 'service') {
                    const currentProduct = products.find(p => p.id === item.product.id);
                    const currentStock = currentProduct ? currentProduct.stock : 0;
                    const newStock = Math.max(0, currentStock - item.quantity);
                    await db.update(
                      'products',
                      { stock: newStock, updated_at: isoNow },
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
              setEditingSaleId(null);
              setEditingSaleDate(null);
              setDiscountInput('');

              Alert.alert('✅ Sucesso', `Venda de R$ ${totalSale.toFixed(2)} ${editingSaleId ? 'atualizada' : 'realizada'} com sucesso!`);
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
            setEditingSaleId(null);
            setEditingSaleDate(null);
            setDiscountInput('');
            setAvulsaValue('');
            setDiscountInput('');
            setAvulsaValue('');
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

  const handleShareReceipt = async (sale: Sale) => {
    if (!premium) {
      Alert.alert(
        'Funcionalidade Premium',
        'O envio de recibo direto para o WhatsApp do cliente é exclusivo para assinantes premium.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Fazer Upgrade', onPress: () => router.push('/planos') }
        ]
      );
      return;
    }

    const d = new Date(sale.timestamp);
    const dateStr = d.toLocaleDateString('pt-BR');
    const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let msg = `*RECIBO DE VENDA*\n`;
    msg += `Data: ${dateStr} às ${timeStr}\n`;
    msg += `------------------------\n`;
    for (const item of sale.items) {
      msg += `${item.quantity}x ${item.product.name} - R$ ${item.total.toFixed(2)}\n`;
    }
    msg += `------------------------\n`;
    if (sale.discount && sale.discount > 0) {
      msg += `Subtotal: R$ ${(sale.total + sale.discount).toFixed(2)}\n`;
      msg += `Desconto: R$ ${sale.discount.toFixed(2)}\n`;
    }
    msg += `*TOTAL A PAGAR: R$ ${sale.total.toFixed(2)}*\n\n`;
    msg += `Forma de pagamento: ${sale.paymentMethod}\n`;
    msg += `Obrigado pela preferência!`;

    const encodedMsg = encodeURIComponent(msg);
    // Let react-native handle the link to system share or whatsapp
    const { Share, Linking } = await import('react-native');

    if (sale.customerPhone) {
      const numericPhone = sale.customerPhone.replace(/\D/g, '');
      if (numericPhone.length >= 10 && numericPhone.length <= 13) {
        let finalPhone = numericPhone;
        if (!finalPhone.startsWith('55')) finalPhone = `55${finalPhone}`;
        
        const wpUrl = `whatsapp://send?phone=${finalPhone}&text=${encodedMsg}`;
        try {
          const canOpen = await Linking.canOpenURL(wpUrl);
          if (canOpen) {
            await Linking.openURL(wpUrl);
            return;
          }
        } catch (e) {
          console.log('Não foi possível abrir o WhatsApp (app não instalado?)', e);
        }
      }
    }

    try {
      await Share.share({
        message: msg,
        title: 'Recibo'
      });
    } catch (e) {
      console.log(e);
    }
  };

  const finalizeAvulsa = async () => {
    const val = parseFloat(avulsaValue.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      Alert.alert('Erro', 'Insira um valor válido para a venda.');
      return;
    }

    Alert.alert(
      'Confirmar Venda Avulsa',
      `Valor: R$ ${val.toFixed(2)}\nForma de Pagamento: ${
        paymentMethod === 'cash' ? 'Dinheiro' :
        paymentMethod === 'credit' ? 'Crédito' :
        paymentMethod === 'debit' ? 'Débito' : 'PIX'
      }`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const isoNow = new Date().toISOString();
              const finalSaleId = Date.now().toString();

              await db.insert('sales', {
                id: finalSaleId,
                customer_id: null,
                total: val,
                discount: 0,
                payment_method: paymentMethod.toUpperCase(),
                observation: avulsaDesc.trim(),
                created_at: isoNow,
              });

              // Add a dummy generic item
              await db.insert('sale_items', {
                id: `${finalSaleId}-0`,
                sale_id: finalSaleId,
                product_id: 'avulso', // requires it not to break Foreign key if sqlite enforcement is not strict, but it is text so it's fine
                quantity: 1,
                unit_price: val,
                total: val,
              });
              
              await loadData();
              setAvulsaValue('');
              setAvulsaDesc('Venda Avulsa / Diversos');
              Alert.alert('Sucesso', 'Venda avulsa registrada!');
            } catch (error) {
              console.error(error);
              Alert.alert('Erro', 'Não foi possível registrar a venda.');
            }
          }
        }
      ]
    );
  };

  const styles = createVendasStyles(colors);

  // NOTE: Avoid inline component definitions that remount on each render.

  return (
    <View style={styles.container}>
      <Header title="Vendas" showSettings />

      <View style={[styles.tabSelector, { marginBottom: 16 }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'avulsa' && styles.tabButtonActive, { flex: 1 }]}
          onPress={() => setActiveTab('avulsa')}
        >
          <Calculator size={16} color={activeTab === 'avulsa' ? colors.primary : colors.textSecondary} style={{ marginBottom: 4 }} />
          <Text style={[styles.tabButtonText, activeTab === 'avulsa' && styles.tabButtonTextActive, { fontSize: 12 }]}>
            Venda Avulsa
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'new' && styles.tabButtonActive, { flex: 1.2 }]}
          onPress={() => setActiveTab('new')}
        >
          <Plus size={16} color={activeTab === 'new' ? colors.primary : colors.textSecondary} style={{ marginBottom: 4 }} />
          <Text style={[styles.tabButtonText, activeTab === 'new' && styles.tabButtonTextActive, { fontSize: 12 }]}>
            Modo Carrinho
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive, { flex: 1 }]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive, { fontSize: 12 }]}>
            Histórico de hoje
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'avulsa' ? (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <Card style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 16, textAlign: 'center' }}>
              Venda Rápida (Avulsa)
            </Text>
            
            <Text style={styles.label}>Valor (R$)</Text>
            <TextInput
              style={[styles.input, { fontSize: 32, height: 70, textAlign: 'center', fontFamily: 'Inter-Bold', color: colors.primary, marginBottom: 16 }]}
              placeholder="0,00"
              placeholderTextColor={colors.textSecondary}
              value={avulsaValue}
              onChangeText={setAvulsaValue}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, { marginBottom: 24 }]}
              value={avulsaDesc}
              onChangeText={setAvulsaDesc}
            />

            <Text style={styles.label}>Forma de Pagamento</Text>
            <View style={[styles.paymentMethods, { marginBottom: 24 }]}>
              {[
                { key: 'cash', label: 'Dinheiro' },
                { key: 'credit', label: 'Crédito' },
                { key: 'debit', label: 'Débito' },
                { key: 'pix', label: 'PIX' },
              ].map((method) => (
                <TouchableOpacity
                  key={method.key}
                  style={[styles.paymentButton, paymentMethod === method.key && styles.paymentButtonActive]}
                  onPress={() => setPaymentMethod(method.key as any)}
                >
                  <Text style={[styles.paymentButtonText, paymentMethod === method.key && styles.paymentButtonTextActive]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Vender Agora"
              onPress={finalizeAvulsa}
            />
          </Card>
        </ScrollView>
      ) : activeTab === 'new' ? (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {editingSaleId ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Inter-SemiBold', color: colors.primary }}>
                Editando Venda #{editingSaleId.slice(-6)}
              </Text>
              <TouchableOpacity onPress={clearSale}>
                <Text style={{ color: colors.error, fontFamily: 'Inter-Medium', fontSize: 16 }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Button
              title="Limpar venda"
              onPress={clearSale}
              variant="outline"
              size="sm"
              textStyle={{ color: colors.error }}
              style={{ alignSelf: 'flex-end', marginTop: 8, marginBottom: 8 }}
            />
          )}

          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 8 }}>
              Buscar Produtos ou Serviços
            </Text>
            <TextInput
              style={[styles.input, { marginBottom: 8 }]}
              placeholder="Digite o nome do produto"
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
                        disabled={item.product.type !== 'service' && item.quantity >= item.product.stock}
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

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
             <Text style={{ fontSize: 16, fontFamily: 'Inter-Medium', color: colors.text }}>Desconto (%):</Text>
             <TextInput 
               style={[styles.input, { width: 120, height: 40 }]}
               keyboardType="numeric"
               placeholder="0,00"
               placeholderTextColor={colors.textSecondary}
               value={discountInput}
               onChangeText={setDiscountInput}
             />
          </View>

          <View style={styles.totalSection}>
             <Text style={[styles.totalText, { fontSize: 18, fontFamily: 'Inter-Medium', color: colors.textSecondary }]}>
               Subtotal: R$ {subtotalSale.toFixed(2)}
             </Text>
             {parsedDiscount > 0 && (
               <Text style={[styles.totalText, { color: colors.error, fontSize: 16, fontFamily: 'Inter-Medium' }]}>
                 - Desconto: R$ {parsedDiscount.toFixed(2)}
               </Text>
             )}
            <Text style={styles.totalText}>Total Venda: R$ {totalSale.toFixed(2)}</Text>
          </View>
          <Button
            title={editingSaleId ? "Salvar Alterações" : "Finalizar Venda"}
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
                      style={{ padding: 4, flexDirection: 'row', gap: 6, alignItems: 'center' }}
                    >
                      <Edit size={16} color={colors.primary} />
                      {!premium && <Crown size={12} color={colors.warning} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteSale(sale)}
                      style={{ padding: 4 }}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleShareReceipt(sale)}
                      style={{ padding: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <Share2 size={16} color={colors.secondary} />
                      {!premium && <Crown size={12} color={colors.warning} />}
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
                        color: sale.paymentMethod === 'credit' ? colors.success : 
                               sale.paymentMethod === 'pix' ? colors.secondary : colors.primary,
                      }}
                    >
                      {sale.paymentMethod === 'credit' ? 'Crédito' : 
                       sale.paymentMethod === 'debit' ? 'Débito' : 
                       sale.paymentMethod === 'pix' ? 'PIX' : 'Dinheiro'}
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
