import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';

export default function SaleDetailsModal({
  visible,
  onClose,
  sale,
  items,
  loading,
  styles,
  colors,
  formatCurrency,
}: any) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.detailModalOverlay}>
        <View style={styles.detailModalBox}>
          <Text style={styles.detailModalTitle}>Itens da Venda #{sale?.id}</Text>
          {loading && (
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.textSecondary, marginTop: 6, fontSize: 13 }}>Carregando itens...</Text>
            </View>
          )}
          {!loading && items.length === 0 && (
            <Text style={styles.detailEmpty}>Nenhum item encontrado.</Text>
          )}
          {!loading && items.length > 0 && (
            <ScrollView style={{ marginTop: 8, marginBottom: 12 }} showsVerticalScrollIndicator={true}>
              {items.map((it: any) => (
                <View key={it.id} style={styles.detailRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.detailName}>{it.product_name || `Produto #${it.product_id}`}</Text>
                    <Text style={styles.detailSub}>Qtde: {it.quantity} x R$ {formatCurrency(it.unit_price)}</Text>
                  </View>
                  <Text style={styles.detailTotal}>R$ {formatCurrency(it.total_item)}</Text>
                </View>
              ))}
            </ScrollView>
          )}
          <View style={styles.detailActions}>
            <TouchableOpacity style={styles.detailCloseBtn} onPress={onClose}>
              <Text style={styles.detailCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
