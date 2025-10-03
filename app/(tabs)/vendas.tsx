import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert
} from 'react-native';
import { 
  Plus, 
  Camera, 
  Minus, 
  ShoppingCart,
  Filter,
  Search,
  X,
  Crown
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

  // Mock products data
  const [products] = useState<Product[]>([
    { id: '1', name: 'Coca-Cola 350ml', price: 3.50, stock: 50, barcode: '123456789' },
    { id: '2', name: 'Pão de Açúcar', price: 0.50, stock: 100 },
    { id: '3', name: 'Leite Integral 1L', price: 4.80, stock: 25 },
  ]);

  const totalSale = saleItems.reduce((sum, item) => sum + item.total, 0);

  useEffect(() => {
    loadSalesHistory();
    loadPremium();
  }, []);

  const loadPremium = async () => {
    try {
      const p = await isPremium();
      setPremium(p);
    } catch (e) {
      console.error('Erro carregando premium', e);
    }
  };

  const loadSalesHistory = async () => {
    // TODO: Load from local storage and sync with Supabase
    const mockSales: Sale[] = [
      {
        id: '1',
        items: [
          { product: products[0], quantity: 2, total: 7.00 },
          { product: products[1], quantity: 4, total: 2.00 },
        ],
        paymentMethod: 'credit',
        total: 9.00,
        timestamp: new Date().toISOString(),
      },
    ];
    setSales(mockSales);
  };

  const addItemToSale = (product: Product) => {
    const existingItem = saleItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        updateItemQuantity(product.id, existingItem.quantity + 1);
      } else {
        Alert.alert('Estoque Insuficiente', 'Não há estoque suficiente para este produto.');
      }
    } else {
      if (product.stock > 0) {
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

      // TODO: Save to local storage and queue for sync
      setSales([newSale, ...sales]);
      
      // Reset form
      setSaleItems([]);
      setSelectedCustomer('');
      setPaymentMethod('credit');
      setObservation('');

      Alert.alert('Venda Finalizada', `Venda de R$ ${totalSale.toFixed(2)} realizada com sucesso!`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível finalizar a venda.');
    }
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
        <TextInput
          style={styles.input}
          placeholder="Cliente (opcional)"
          placeholderTextColor={colors.textSecondary}
          value={selectedCustomer}
          onChangeText={setSelectedCustomer}
        />

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

  const SalesHistoryTab = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 18, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 20 }}>
        Histórico de Vendas
      </Text>
      
      {/* TODO: Add filters and search */}
      
      {sales.map((sale) => (
        <Card key={sale.id} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontFamily: 'Inter-Medium', color: colors.text }}>
              {new Date(sale.timestamp).toLocaleDateString('pt-BR')}
            </Text>
            <Text style={{ fontSize: 16, fontFamily: 'Inter-Bold', color: colors.primary }}>
              R$ {sale.total.toFixed(2)}
            </Text>
          </View>
          <Text style={{ fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textSecondary }}>
            {sale.items.length} item(s) • {sale.paymentMethod}
          </Text>
        </Card>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <Header title="Vendas" />
      {/* crown icon top-right for non-premium users */}
      { !premium && (
        <TouchableOpacity onPress={() => router.push('/premium' as any)} style={{ position: 'absolute', top: 12, right: 12, padding: 6 }}>
          <Crown size={22} color={colors.primary} />
        </TouchableOpacity>
      )}
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