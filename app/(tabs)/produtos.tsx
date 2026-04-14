import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { TextInput } from '@/components/ui/TextInput';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Wrench,
  Calculator,
  Clock,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonCard, EmptyState } from '@/components/ui/Skeleton';
import db from '@/lib/db';
import { createProdutosStyles } from './Produtos.styles';

interface Product {
  id: string;
  name: string;
  price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  barcode?: string;
  image_url?: string;
  type: 'product' | 'service';
  description?: string;
  time_minutes?: number;
  material_cost?: number;
  created_at: string;
  updated_at: string;
}

export default function Produtos() {
  const { colors } = useTheme();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // ── Product modal state ───────────────────────────────────────────────────
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost_price: '',
    stock: '',
    min_stock: '',
    barcode: '',
    description: '',
  });
  const [lotCost, setLotCost] = useState('');
  const [lotYield, setLotYield] = useState('');

  // ── Service modal state ───────────────────────────────────────────────────
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Product | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    time_value: '',
    time_unit: 'minutes' as 'hours' | 'minutes',
    has_material: false,
    material_cost: '',
    price: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

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
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const goToPreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const handleItemsPerPageChange = (n: number) => { setItemsPerPage(n); setCurrentPage(1); };

  // ── Product CRUD ──────────────────────────────────────────────────────────
  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        cost_price: (product.cost_price || 0).toString(),
        stock: product.stock.toString(),
        min_stock: product.min_stock.toString(),
        barcode: product.barcode || '',
        description: product.description || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: '', cost_price: '', stock: '', min_stock: '', barcode: '', description: '' });
    }
    setLotCost('');
    setLotYield('');
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setLotCost('');
    setLotYield('');
    setFormData({ name: '', price: '', cost_price: '', stock: '', min_stock: '', barcode: '', description: '' });
  };

  const saveProduct = async () => {
    if (!formData.name.trim() || !formData.price) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }
    if (!formData.stock) {
      Alert.alert('Erro', 'Informe o estoque do produto.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const priceValue = parseFloat(formData.price.replace(',', '.'));
      if (Number.isNaN(priceValue)) { Alert.alert('Erro', 'Informe um preço válido.'); return; }

      const costPriceValue = formData.cost_price ? parseFloat(formData.cost_price.replace(',', '.')) : 0;
      const stockValue = parseInt(formData.stock, 10);
      if (Number.isNaN(stockValue)) { Alert.alert('Erro', 'Informe um estoque válido.'); return; }

      const payload = {
        name: formData.name.trim(),
        price: priceValue,
        cost_price: Number.isNaN(costPriceValue) ? 0 : costPriceValue,
        stock: Math.max(0, stockValue),
        min_stock: Math.max(0, parseInt(formData.min_stock, 10) || 0),
        barcode: formData.barcode.trim() || null,
        type: 'product',
        description: formData.description.trim() || null,
        image_url: editingProduct?.image_url || null,
        updated_at: now,
      };

      if (editingProduct) {
        await db.update('products', payload, 'id = ?', [editingProduct.id]);
      } else {
        await db.insert('products', { id: Date.now().toString(), ...payload, created_at: now });
      }

      await loadProducts();
      closeProductModal();
      Alert.alert('Sucesso', 'Produto salvo com sucesso!');
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Erro', 'Não foi possível salvar o produto.');
    }
  };

  // ── Service CRUD ──────────────────────────────────────────────────────────
  const openServiceModal = (product?: Product) => {
    if (product) {
      const rawTime = product.time_minutes || 0;
      const useHours = rawTime > 0 && rawTime % 60 === 0 && rawTime >= 60;
      setEditingService(product);
      setServiceFormData({
        name: product.name,
        description: product.description || '',
        time_value: rawTime === 0 ? '' : useHours ? String(rawTime / 60) : String(rawTime),
        time_unit: useHours ? 'hours' : 'minutes',
        has_material: (product.material_cost || 0) > 0,
        material_cost: product.material_cost ? product.material_cost.toFixed(2) : '',
        price: product.price.toString(),
      });
    } else {
      setEditingService(null);
      setServiceFormData({
        name: '',
        description: '',
        time_value: '',
        time_unit: 'minutes',
        has_material: false,
        material_cost: '',
        price: '',
      });
    }
    setShowServiceModal(true);
  };

  const closeServiceModal = () => {
    setShowServiceModal(false);
    setEditingService(null);
    setServiceFormData({
      name: '',
      description: '',
      time_value: '',
      time_unit: 'minutes',
      has_material: false,
      material_cost: '',
      price: '',
    });
  };

  const saveService = async () => {
    if (!serviceFormData.name.trim() || !serviceFormData.price) {
      Alert.alert('Erro', 'Preencha nome e preço do serviço.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const priceValue = parseFloat(serviceFormData.price.replace(',', '.'));
      if (Number.isNaN(priceValue)) { Alert.alert('Erro', 'Informe um preço válido.'); return; }

      const timeRaw = parseInt(serviceFormData.time_value, 10) || 0;
      const timeMinutes = serviceFormData.time_unit === 'hours' ? timeRaw * 60 : timeRaw;

      const materialCost = serviceFormData.has_material
        ? parseFloat(serviceFormData.material_cost.replace(',', '.')) || 0
        : 0;

      const payload = {
        name: serviceFormData.name.trim(),
        price: priceValue,
        cost_price: 0,
        stock: 0,
        min_stock: 0,
        barcode: null,
        type: 'service',
        description: serviceFormData.description.trim() || null,
        time_minutes: timeMinutes,
        material_cost: materialCost,
        image_url: editingService?.image_url || null,
        updated_at: now,
      };

      if (editingService) {
        await db.update('products', payload, 'id = ?', [editingService.id]);
      } else {
        await db.insert('products', { id: Date.now().toString(), ...payload, created_at: now });
      }

      await loadProducts();
      closeServiceModal();
      Alert.alert('Sucesso', 'Serviço salvo com sucesso!');
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Erro', 'Não foi possível salvar o serviço.');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteProduct = (product: Product) => {
    const label = product.type === 'service' ? 'serviço' : 'produto';
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o ${label} "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.del('products', 'id = ?', [product.id]);
              await loadProducts();
              Alert.alert('Sucesso', `${label.charAt(0).toUpperCase() + label.slice(1)} excluído com sucesso!`);
            } catch {
              Alert.alert('Erro', `Não foi possível excluir o ${label}.`);
            }
          },
        },
      ]
    );
  };

  // ── Edit router (product or service) ─────────────────────────────────────
  const handleEdit = (product: Product) => {
    if (product.type === 'service') {
      openServiceModal(product);
    } else {
      openProductModal(product);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { status: 'out', color: colors.error, text: 'Sem estoque' };
    if (product.stock <= product.min_stock) return { status: 'low', color: colors.warning, text: 'Estoque baixo' };
    return { status: 'ok', color: colors.success, text: 'Estoque OK' };
  };

  const styles = createProdutosStyles(colors);

  // ── Time display helper ───────────────────────────────────────────────────
  const formatTime = (minutes: number) => {
    if (!minutes || minutes === 0) return null;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}min`;
  };

  return (
    <View style={styles.container}>
      <Header title="Produtos & Serviços" showSettings />

      <View style={styles.content}>
        {/* ── Controls bar ─────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          {/* Search — takes ~half the horizontal space */}
          <View style={[styles.searchContainer, { flex: 2 }]}>
            <Search size={16} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { fontSize: 14 }]}
              placeholder="Buscar..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* ➕ Produto */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: colors.primary,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
            }}
            onPress={() => openProductModal()}
            activeOpacity={0.8}
          >
            <Plus size={14} color={colors.white} />
            <Text style={{ color: colors.white, fontFamily: 'Inter-SemiBold', fontSize: 13 }}>
              Produto
            </Text>
          </TouchableOpacity>

          {/* ➕ Serviço */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: colors.success,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
            }}
            onPress={() => openServiceModal()}
            activeOpacity={0.8}
          >
            <Plus size={14} color={colors.white} />
            <Text style={{ color: colors.white, fontFamily: 'Inter-SemiBold', fontSize: 13 }}>
              Serviço
            </Text>
          </TouchableOpacity>
        </View>

        {/* Items per page */}
        <View style={styles.itemsPerPageContainer}>
          <Text style={styles.itemsPerPageText}>Itens por página:</Text>
          <View style={styles.itemsPerPageButtons}>
            {[10, 50, 100].map((count) => (
              <TouchableOpacity
                key={count}
                style={[styles.itemsPerPageButton, itemsPerPage === count && styles.itemsPerPageButtonActive]}
                onPress={() => handleItemsPerPageChange(count)}
              >
                <Text style={[styles.itemsPerPageButtonText, itemsPerPage === count && styles.itemsPerPageButtonTextActive]}>
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* List */}
        {isLoading ? (
          <View>{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</View>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Package size={32} color={colors.primary} />}
            title={searchQuery ? 'Nenhum item encontrado' : 'Nenhum produto ou serviço cadastrado'}
            subtitle={
              searchQuery
                ? `Nada encontrado para "${searchQuery}"`
                : 'Comece adicionando seus primeiros produtos ou serviços'
            }
            actionText="Adicionar Produto"
            onAction={() => openProductModal()}
          />
        ) : (
          <FlashList
            data={paginatedProducts}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            estimatedItemSize={90}
            renderItem={({ item: product }) => {
              const stockStatus = getStockStatus(product);
              const isService = product.type === 'service';
              const timeLabel = isService ? formatTime(product.time_minutes || 0) : null;

              return (
                <Card style={styles.productCard}>
                  <View style={styles.productItem}>
                    <View style={[styles.productTypeIcon, isService ? styles.productTypeIconService : styles.productTypeIconProduct]}>
                      {isService
                        ? <Wrench size={24} color={colors.success} />
                        : <Package size={24} color={colors.primary} />}
                    </View>

                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">
                        {product.name}
                      </Text>
                      {isService && product.description ? (
                        <Text style={[styles.stockText, { color: colors.textSecondary, marginBottom: 2 }]} numberOfLines={1} ellipsizeMode="tail">
                          {product.description}
                        </Text>
                      ) : null}
                      {isService && timeLabel ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <Clock size={11} color={colors.textSecondary} />
                          <Text style={[styles.stockText, { color: colors.textSecondary }]}>{timeLabel}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.productPrice}>R$ {product.price.toFixed(2)}</Text>
                      {!isService && (
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
                      {/* Calculator icon → readonly analysis */}
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() =>
                          router.push({
                            pathname: '/calculadora-markup',
                            params: {
                              mode: 'readonly',
                              item_type: product.type,
                              name: product.name,
                              cost_price: String(product.cost_price || 0),
                              price: String(product.price || 0),
                              time_minutes: String(product.time_minutes || 0),
                              material_cost: String(product.material_cost || 0),
                            },
                          } as any)
                        }
                      >
                        <Calculator size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(product)}>
                        <Edit size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton} onPress={() => deleteProduct(product)}>
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            }}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
              onPress={goToPreviousPage}
              disabled={currentPage === 1}
            >
              <Text style={[styles.paginationText, currentPage === 1 && styles.paginationTextDisabled]}>Anterior</Text>
            </TouchableOpacity>
            <Text style={styles.paginationInfo}>Página {currentPage} de {totalPages}</Text>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
              onPress={goToNextPage}
              disabled={currentPage === totalPages}
            >
              <Text style={[styles.paginationText, currentPage === totalPages && styles.paginationTextDisabled]}>Próxima</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ═══════════════════════════════════════════════════════════════════
          PRODUCT MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {showProductModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '90%' }]}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nome *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Nome do produto"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                {/* Preço + Custo */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Custo (R$)</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.cost_price}
                      onChangeText={(text) => {
                        setFormData({ ...formData, cost_price: text });
                        setLotCost('');
                        setLotYield('');
                      }}
                      placeholder="0,00"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Preço de Venda * (R$)</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.price}
                      onChangeText={(text) => setFormData({ ...formData, price: text })}
                      placeholder="0,00"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Inline margin indicator */}
                {(() => {
                  const p = parseFloat(formData.price.replace(',', '.')) || 0;
                  const c = parseFloat(formData.cost_price.replace(',', '.')) || 0;
                  if (c > 0 && p > c) {
                    const lucro = p - c;
                    const margem = (lucro / p) * 100;
                    return (
                      <View style={{ backgroundColor: colors.success + '20', padding: 8, borderRadius: 6, marginBottom: 12 }}>
                        <Text style={{ color: colors.success, fontFamily: 'Inter-Medium', fontSize: 13 }}>
                          Lucro Bruto: R$ {lucro.toFixed(2)} ({margem.toFixed(1)}% de margem)
                        </Text>
                      </View>
                    );
                  } else if (c > 0 && p > 0 && p <= c) {
                    return (
                      <View style={{ backgroundColor: colors.error + '20', padding: 8, borderRadius: 6, marginBottom: 12 }}>
                        <Text style={{ color: colors.error, fontFamily: 'Inter-Medium', fontSize: 13 }}>
                          Atenção: margem negativa ou nula!
                        </Text>
                      </View>
                    );
                  }
                  return null;
                })()}

                {/* Batch cost calculator */}
                <View style={{ marginBottom: 14, backgroundColor: colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Inter-SemiBold', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    🧮 Calcular custo por lote
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { fontSize: 12 }]}>Pagou no lote (R$)</Text>
                      <TextInput
                        style={[styles.input, { marginBottom: 0 }]}
                        value={lotCost}
                        onChangeText={(v) => {
                          setLotCost(v);
                          const lot = parseFloat(v.replace(',', '.'));
                          const uses = parseInt(lotYield, 10);
                          if (lot > 0 && uses > 0)
                            setFormData(prev => ({ ...prev, cost_price: (lot / uses).toFixed(2) }));
                        }}
                        placeholder="Ex: 50,00"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { fontSize: 12 }]}>Rende (usos)</Text>
                      <TextInput
                        style={[styles.input, { marginBottom: 0 }]}
                        value={lotYield}
                        onChangeText={(v) => {
                          setLotYield(v);
                          const lot = parseFloat(lotCost.replace(',', '.'));
                          const uses = parseInt(v, 10);
                          if (lot > 0 && uses > 0)
                            setFormData(prev => ({ ...prev, cost_price: (lot / uses).toFixed(2) }));
                        }}
                        placeholder="Ex: 10"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                  {(() => {
                    const lot = parseFloat(lotCost.replace(',', '.'));
                    const uses = parseInt(lotYield, 10);
                    if (lot > 0 && uses > 0)
                      return (
                        <Text style={{ fontSize: 12, fontFamily: 'Inter-SemiBold', color: colors.primary, marginTop: 8 }}>
                          = R$ {(lot / uses).toFixed(2).replace('.', ',')} por uso → preenchido automaticamente
                        </Text>
                      );
                    return (
                      <Text style={{ fontSize: 11, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginTop: 6 }}>
                        Preencha os dois campos para calcular o custo unitário.
                      </Text>
                    );
                  })()}
                </View>

                {/* Stock fields */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Estoque *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.stock}
                      onChangeText={(text) => setFormData({ ...formData, stock: text })}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Est. Mínimo</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.min_stock}
                      onChangeText={(text) => setFormData({ ...formData, min_stock: text })}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="number-pad"
                    />
                  </View>
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

              </ScrollView>

              <View style={styles.modalButtons}>
                <Button title="Cancelar" onPress={closeProductModal} variant="outline" style={styles.modalButton} />
                <Button title="Salvar" onPress={saveProduct} style={styles.modalButton} />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SERVICE MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {showServiceModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '90%' }]}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nome do serviço *</Text>
                  <TextInput
                    style={styles.input}
                    value={serviceFormData.name}
                    onChangeText={(text) => setServiceFormData({ ...serviceFormData, name: text })}
                    placeholder="Ex: Corte de cabelo"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Descrição (opcional)</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 72, textAlignVertical: 'top' }]}
                    value={serviceFormData.description}
                    onChangeText={(text) => setServiceFormData({ ...serviceFormData, description: text })}
                    placeholder="Descrição do serviço"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Tempo estimado */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Tempo estimado</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={serviceFormData.time_value}
                      onChangeText={(text) => setServiceFormData({ ...serviceFormData, time_value: text })}
                      placeholder={serviceFormData.time_unit === 'hours' ? 'Ex: 2' : 'Ex: 30'}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="number-pad"
                    />
                    {/* Unit toggle */}
                    <View style={{ flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          backgroundColor: serviceFormData.time_unit === 'minutes' ? colors.primary : colors.surface,
                        }}
                        onPress={() => setServiceFormData({ ...serviceFormData, time_unit: 'minutes' })}
                      >
                        <Text style={{
                          fontFamily: 'Inter-SemiBold',
                          fontSize: 13,
                          color: serviceFormData.time_unit === 'minutes' ? colors.white : colors.textSecondary,
                        }}>
                          min
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          backgroundColor: serviceFormData.time_unit === 'hours' ? colors.primary : colors.surface,
                        }}
                        onPress={() => setServiceFormData({ ...serviceFormData, time_unit: 'hours' })}
                      >
                        <Text style={{
                          fontFamily: 'Inter-SemiBold',
                          fontSize: 13,
                          color: serviceFormData.time_unit === 'hours' ? colors.white : colors.textSecondary,
                        }}>
                          h
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Material extra toggle */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: serviceFormData.has_material ? 8 : 16, padding: 12, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.text }}>Material extra</Text>
                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                      Há custo com materiais neste serviço?
                    </Text>
                  </View>
                  <Switch
                    value={serviceFormData.has_material}
                    onValueChange={(val) => setServiceFormData({ ...serviceFormData, has_material: val, material_cost: val ? serviceFormData.material_cost : '' })}
                    trackColor={{ false: colors.border, true: colors.primary + '80' }}
                    thumbColor={serviceFormData.has_material ? colors.primary : colors.textSecondary}
                  />
                </View>

                {serviceFormData.has_material && (
                  <View style={[styles.formGroup]}>
                    <Text style={styles.label}>Custo de material neste serviço (R$)</Text>
                    <TextInput
                      style={styles.input}
                      value={serviceFormData.material_cost}
                      onChangeText={(text) => setServiceFormData({ ...serviceFormData, material_cost: text })}
                      placeholder="0,00"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                    />
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Preço que você cobra (R$) *</Text>
                  <TextInput
                    style={styles.input}
                    value={serviceFormData.price}
                    onChangeText={(text) => setServiceFormData({ ...serviceFormData, price: text })}
                    placeholder="0,00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>

              </ScrollView>

              <View style={styles.modalButtons}>
                <Button title="Cancelar" onPress={closeServiceModal} variant="outline" style={styles.modalButton} />
                <Button title="Salvar" onPress={saveService} style={styles.modalButton} />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
