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
  Camera, 
  Minus, 
  ShoppingCart,
  Filter,
  Search,
  X,
  Crown,
  Edit,
  Trash2
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { isPremium, enablePremium } from '@/lib/premium';
import { CameraView, useCameraPermissions } from 'expo-camera';

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
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestionsVisible, setCustomerSuggestionsVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'debit' | 'pix'>('credit');
  const [observation, setObservation] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

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

  // Função para filtrar vendas do dia atual
  const getTodaySales = () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    return sales.filter(sale => {
      try {
        // Verificar se timestamp é válido
        if (!sale.timestamp) return false;
        
        const saleDate = new Date(sale.timestamp);
        
        // Verificar se a data é válida
        if (isNaN(saleDate.getTime())) return false;
        
        const saleDateString = saleDate.toISOString().split('T')[0];
        return saleDateString === todayString;
      } catch (error) {
        console.error('Erro ao processar data da venda:', error);
        return false;
      }
    });
  };

  // Função para deletar venda
  const handleDeleteSale = (saleId: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            setSales(prevSales => prevSales.filter(sale => sale.id !== saleId));
            Alert.alert('Sucesso', 'Venda excluída com sucesso!');
          }
        }
      ]
    );
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { mockProducts, mockCustomers, mockSales } = await import('@/lib/mocks');
    setProducts(mockProducts as Product[]);
    setCustomers(mockCustomers);
    
    // Garantir que as vendas tenham timestamps válidos e converter para interface Sale
    const salesWithValidTimestamps = (mockSales as any[]).map(sale => ({
      id: sale.id,
      items: sale.items.map((item: any) => ({
        product: {
          id: item.product_id,
          name: item.product_name,
          price: item.unit_price,
          stock: 0,
          type: 'product' as const
        },
        quantity: item.quantity,
        total: item.total
      })),
      customer: sale.customer_name,
      paymentMethod: sale.payment_method.toLowerCase() as 'cash' | 'credit' | 'debit' | 'pix',
      total: sale.total,
      timestamp: sale.created_at,
      observation: sale.observation
    }));
    
    setSales(salesWithValidTimestamps);

    const p = await isPremium();
    setPremium(p);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer.name);
    setCustomerSearch(customer.name);
    setCustomerSuggestionsVisible(false);
  };

  const handleCustomerSearchChange = (text: string) => {
    setCustomerSearch(text);
    setSelectedCustomer(text);
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
              const newSale: Sale = {
                id: Date.now().toString(),
                items: saleItems,
                customer: selectedCustomer || undefined,
                paymentMethod,
                total: totalSale,
                timestamp: new Date().toISOString(),
                observation: observation || undefined,
              };

              setSales([newSale, ...sales]);

              setSaleItems([]);
              setSelectedCustomer('');
              setCustomerSearch('');
              setPaymentMethod('credit');
              setObservation('');

              Alert.alert('✅ Sucesso', `Venda de R$ ${totalSale.toFixed(2)} realizada com sucesso!`);
            } catch (error) {
              Alert.alert('❌ Erro', 'Não foi possível finalizar a venda. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    const product = products.find(p => p.barcode === data);
    if (product) {
      addItemToSale(product);
      setShowCamera(false);
    } else {
      Alert.alert('Produto Não Encontrado', 'Código de barras não encontrado no sistema.');
    }
  };

  const openCamera = async () => {
    if (!premium) {
      Alert.alert('Premium necessário', 'Escanear produtos por código de barras é uma funcionalidade premium. Deseja ativar o premium agora?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ativar', onPress: async () => {
          const ok = await enablePremium();
          if (ok) setPremium(true);
        } }
      ]);
      return;
    }

    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Permissão Negada', 'É necessário permitir o acesso à câmera para ler códigos de barras.');
        return;
      }
    }
    setShowCamera(true);
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
    scanButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 20,
      gap: 8,
    },
    scanButtonText: {
      color: colors.white,
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
    },
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
      borderColor: colors.border,
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
    
    // Camera Modal
    cameraModal: {
      flex: 1,
      backgroundColor: colors.black,
    },
    camera: {
      flex: 1,
    },
    cameraControls: {
      position: 'absolute',
      top: 50,
      right: 20,
    },
    closeButton: {
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 25,
    },
  });

  const NewSaleTab = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Barcode Scanner Button (premium only) */}
      <TouchableOpacity
        style={[styles.scanButton, !premium && { opacity: 0.6 }]}
        onPress={openCamera}
        disabled={!premium}
      >
        <Camera size={20} color={colors.white} />
        <Text style={styles.scanButtonText}>Escanear Código de Barras</Text>
      </TouchableOpacity>

      {/* If not premium, show a small chip under the scanner that links to premium page */}
      {!premium && (
        <TouchableOpacity onPress={() => router.push('/premium')} style={{ alignSelf: 'center', marginBottom: 12 }}>
            <Card style={{ paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }}>
            <Crown size={14} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.text }}>Assinar Premium</Text>
          </Card>
        </TouchableOpacity>
      )}

      {/* Product search / autocomplete */}
      <Card style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 8 }}>Buscar Produtos ou Serviços</Text>
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

      {/* Sale Items */}
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

      {/* Sale Form */}
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
              <ScrollView style={{ maxHeight: 150 }}>
                {filteredCustomers.map((customer) => (
                  <TouchableOpacity
                    key={customer.id}
                    style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleCustomerSelect(customer)}
                  >
                    <Text style={[styles.suggestionText, { color: colors.text }]}>{customer.name}</Text>
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

      {/* Total */}
      <View style={styles.totalSection}>
        <Text style={styles.totalText}>Total: R$ {totalSale.toFixed(2)}</Text>
      </View>

      {/* Finalize Sale Button */}
      <Button
        title="Finalizar Venda"
        onPress={finalizeSale}
        disabled={saleItems.length === 0}
        style={{ marginBottom: 40 }}
      />
    </ScrollView>
  );

  const SalesHistoryTab = () => {
    const todaySales = getTodaySales();
    
    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                    onPress={() => handleDeleteSale(sale.id)}
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
                {sale.items.map((item, index) => (
                  <Text key={index} style={{ fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textSecondary }}>
                    • {item.product.name} x{item.quantity} - R$ {item.total.toFixed(2)}
                  </Text>
                ))}
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textSecondary }}>
                  {(() => {
                    try {
                      const date = new Date(sale.timestamp);
                      if (isNaN(date.getTime())) return 'Horário inválido';
                      return date.toLocaleTimeString('pt-BR');
                    } catch (error) {
                      return 'Horário inválido';
                    }
                  })()}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={{ 
                    fontSize: 12, 
                    fontFamily: 'Inter-Medium', 
                    color: sale.paymentMethod === 'credit' ? colors.success : colors.primary 
                  }}>
                    {sale.paymentMethod === 'credit' ? 'Crédito' : 'Dinheiro'}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    );
  };

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
      {activeTab === 'new' ? <NewSaleTab /> : <SalesHistoryTab />}

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <View style={styles.cameraModal}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'ean8', 'code128'],
            }}
          >
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCamera(false)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>
    </View>
  );
}