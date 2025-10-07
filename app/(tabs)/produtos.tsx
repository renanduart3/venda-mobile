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
  Alert,
  Image
} from 'react-native';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  AlertTriangle
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  min_stock: number;
  barcode?: string;
  image_url?: string;
  type: 'product' | 'service';
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function Produtos() {
  const { colors } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    min_stock: '',
    barcode: '',
    type: 'product' as 'product' | 'service',
    description: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { mockProducts } = await import('@/lib/mocks');
    setProducts(mockProducts as Product[]);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.includes(searchQuery)
  );

  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        min_stock: product.min_stock.toString(),
        barcode: product.barcode || '',
        type: product.type || 'product',
        description: product.description || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        stock: '',
        min_stock: '',
        barcode: '',
        type: 'product',
        description: '',
      });
    }
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      stock: '',
      min_stock: '',
      barcode: '',
      type: 'product',
      description: '',
    });
  };

  const saveProduct = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    if (formData.type === 'product' && !formData.stock) {
      Alert.alert('Erro', 'Produtos precisam ter estoque informado.');
      return;
    }

    try {
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        stock: formData.type === 'service' ? 0 : parseInt(formData.stock),
        min_stock: formData.type === 'service' ? 0 : (parseInt(formData.min_stock) || 0),
        barcode: formData.barcode || undefined,
        type: formData.type,
        description: formData.description || undefined,
      };

      if (editingProduct) {
        // Update existing product
        const updatedProduct: Product = {
          ...editingProduct,
          ...productData,
          updated_at: new Date().toISOString(),
        };
        setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
      } else {
        // Create new product
        const newProduct: Product = {
          id: Date.now().toString(),
          ...productData,
          image_url: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProducts([...products, newProduct]);
      }

      closeProductModal();
      Alert.alert('Sucesso', 'Produto salvo com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o produto.');
    }
  };

  const deleteProduct = (product: Product) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o produto "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            setProducts(products.filter(p => p.id !== product.id));
          },
        },
      ]
    );
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) {
      return { status: 'out', color: colors.error, text: 'Sem estoque' };
    } else if (product.stock <= product.min_stock) {
      return { status: 'low', color: colors.warning, text: 'Estoque baixo' };
    } else {
      return { status: 'ok', color: colors.success, text: 'Estoque OK' };
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    controls: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      marginLeft: 8,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemsPerPageContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    itemsPerPageText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    itemsPerPageButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    itemsPerPageButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemsPerPageButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    itemsPerPageButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    itemsPerPageButtonTextActive: {
      color: colors.white,
    },
    productCard: {
      marginBottom: 12,
    },
    productItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    productImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: colors.border,
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    productPrice: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
      marginBottom: 4,
    },
    stockInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    stockText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
    },
    stockAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    stockAlertText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      width: '100%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 6,
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
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
    },
  });

  const ProductModal = () => (
    <Modal visible={showProductModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingProduct ? 'Editar Produto' : 'Novo Produto'}
          </Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo *</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.input,
                    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
                    formData.type === 'product' && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'product' })}
                >
                  <Text style={[{ color: colors.text }, formData.type === 'product' && { color: colors.white }]}>Produto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.input,
                    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
                    formData.type === 'service' && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'service' })}
                >
                  <Text style={[{ color: colors.text }, formData.type === 'service' && { color: colors.white }]}>Serviço</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder={formData.type === 'service' ? 'Nome do serviço' : 'Nome do produto'}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {formData.type === 'service' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Descrição</Text>
                <TextInput
                  style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Descrição do serviço"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Preço *</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="0,00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            {formData.type === 'product' && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Quantidade em Estoque *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.stock}
                    onChangeText={(text) => setFormData({ ...formData, stock: text })}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Estoque Mínimo</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.min_stock}
                    onChangeText={(text) => setFormData({ ...formData, min_stock: text })}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Código de Barras</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.barcode}
                    onChangeText={(text) => setFormData({ ...formData, barcode: text })}
                    placeholder="Código de barras"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalButtons}>
            <Button
              title="Cancelar"
              onPress={closeProductModal}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Salvar"
              onPress={saveProduct}
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header title="Produtos" showSettings />
      
      <View style={styles.content}>
        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar produtos..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => openProductModal()}
          >
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Items per page selector */}
        <View style={styles.itemsPerPageContainer}>
          <Text style={styles.itemsPerPageText}>Itens por página:</Text>
          <View style={styles.itemsPerPageButtons}>
            {[10, 50, 100].map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.itemsPerPageButton,
                  itemsPerPage === count && styles.itemsPerPageButtonActive,
                ]}
                onPress={() => setItemsPerPage(count)}
              >
                <Text
                  style={[
                    styles.itemsPerPageButtonText,
                    itemsPerPage === count && styles.itemsPerPageButtonTextActive,
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Products List */}
        <FlatList
          data={filteredProducts.slice(0, itemsPerPage)}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: product }) => {
            const stockStatus = getStockStatus(product);
            
            return (
              <Card style={styles.productCard}>
                <View style={styles.productItem}>
                  <Image
                    source={{ uri: product.image_url || 'https://images.pexels.com/photos/264547/pexels-photo-264547.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                    style={styles.productImage}
                    defaultSource={{ uri: 'https://images.pexels.com/photos/264547/pexels-photo-264547.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                  />
                  
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    {product.type === 'service' && product.description && (
                      <Text style={[styles.stockText, { color: colors.textSecondary, marginBottom: 4 }]} numberOfLines={1}>
                        {product.description}
                      </Text>
                    )}
                    <Text style={styles.productPrice}>
                      R$ {product.price.toFixed(2)}
                    </Text>
                    {product.type !== 'service' && (
                      <>
                        <View style={styles.stockInfo}>
                          <Package size={12} color={stockStatus.color} />
                          <Text style={[styles.stockText, { color: stockStatus.color }]}>
                            {product.stock} em estoque
                          </Text>
                        </View>
                        {stockStatus.status !== 'ok' && (
                          <View style={styles.stockAlert}>
                            <AlertTriangle size={12} color={stockStatus.color} />
                            <Text style={[styles.stockAlertText, { color: stockStatus.color }]}>
                              {stockStatus.text}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openProductModal(product)}
                    >
                      <Edit size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deleteProduct(product)}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          }}
        />
      </View>

      <ProductModal />
    </View>
  );
}