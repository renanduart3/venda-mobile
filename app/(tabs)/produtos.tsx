import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Image
} from 'react-native';
import { TextInput } from '@/components/ui/TextInput';
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
import { SkeletonCard, EmptyState } from '@/components/ui/Skeleton';
import db from '@/lib/db';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const { loadProducts: loadProductsData } = await import('@/lib/data-loader');
      const data = await loadProductsData();
      setProducts(data as Product[]);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

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
    if (!formData.name.trim() || !formData.price) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    if (formData.type === 'product' && !formData.stock) {
      Alert.alert('Erro', 'Produtos precisam ter estoque informado.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const priceValue = parseFloat(formData.price.replace(',', '.'));
      if (Number.isNaN(priceValue)) {
        Alert.alert('Erro', 'Informe um preço válido.');
        return;
      }

      const stockValue = formData.type === 'service' ? 0 : parseInt(formData.stock, 10);
      if (formData.type === 'product' && Number.isNaN(stockValue)) {
        Alert.alert('Erro', 'Informe um estoque válido.');
        return;
      }

      const minStockValue = formData.type === 'service'
        ? 0
        : Math.max(0, parseInt(formData.min_stock, 10) || 0);

      const productPayload = {
        name: formData.name.trim(),
        price: priceValue,
        stock: formData.type === 'service' ? 0 : Math.max(0, stockValue),
        min_stock: minStockValue,
        barcode: formData.barcode.trim() ? formData.barcode.trim() : null,
        type: formData.type,
        description: formData.description.trim() ? formData.description.trim() : null,
        image_url: editingProduct?.image_url || null,
        updated_at: now,
      };

      if (editingProduct) {
        await db.update('products', productPayload, 'id = ?', [editingProduct.id]);
      } else {
        const id = Date.now().toString();
        await db.insert('products', {
          id,
          ...productPayload,
          created_at: now,
        });
      }

      await loadProducts();
      closeProductModal();
      Alert.alert('Sucesso', 'Produto salvo com sucesso!');
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Erro', 'Não foi possível salvar o produto.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await db.del('products', 'id = ?', [productId]);
      await loadProducts();
      Alert.alert('Sucesso', 'Produto excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert('Erro', 'Não foi possível excluir o produto.');
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
            handleDeleteProduct(product.id);
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
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      marginLeft: 8,
      backgroundColor: 'transparent',
      borderWidth: 0,
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

    // Pagination styles
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 20,
      paddingVertical: 16,
    },
    paginationButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    paginationButtonDisabled: {
      backgroundColor: colors.border,
    },
    paginationText: {
      color: colors.white,
      fontSize: 12,
      fontFamily: 'Inter-Medium',
    },
    paginationTextDisabled: {
      color: colors.textSecondary,
    },
    paginationInfo: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
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
                onPress={() => handleItemsPerPageChange(count)}
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
        {isLoading ? (
          // Skeleton loading state
          <View>
            {[1, 2, 3].map((index) => (
              <SkeletonCard key={index} />
            ))}
          </View>
        ) : filteredProducts.length === 0 ? (
          // Empty state
          <EmptyState
            icon={<Package size={32} color={colors.primary} />}
            title={searchQuery ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            subtitle={searchQuery 
              ? `Não encontramos produtos que correspondam a "${searchQuery}"`
              : "Comece adicionando seus primeiros produtos ou serviços"
            }
            actionText="Adicionar Produto"
            onAction={() => openProductModal()}
          />
        ) : (
          <FlatList
            data={paginatedProducts}
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
                      <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">
                        {product.name}
                      </Text>
                      {product.type === 'service' && product.description && (
                        <Text style={[styles.stockText, { color: colors.textSecondary, marginBottom: 4 }]} numberOfLines={2} ellipsizeMode="tail">
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
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                currentPage === 1 && styles.paginationButtonDisabled
              ]}
              onPress={goToPreviousPage}
              disabled={currentPage === 1}
            >
              <Text style={[
                styles.paginationText,
                currentPage === 1 && styles.paginationTextDisabled
              ]}>
                Anterior
              </Text>
            </TouchableOpacity>

            <Text style={styles.paginationInfo}>
              Página {currentPage} de {totalPages}
            </Text>

            <TouchableOpacity
              style={[
                styles.paginationButton,
                currentPage === totalPages && styles.paginationButtonDisabled
              ]}
              onPress={goToNextPage}
              disabled={currentPage === totalPages}
            >
              <Text style={[
                styles.paginationText,
                currentPage === totalPages && styles.paginationTextDisabled
              ]}>
                Próxima
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ProductModal />
    </View>
  );
}