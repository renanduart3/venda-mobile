import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { Share2, X } from 'lucide-react-native';

function getPaymentLabel(method: string): string {
  switch ((method || '').toLowerCase()) {
    case 'credit': return 'Crédito';
    case 'debit': return 'Débito';
    case 'pix': return 'PIX';
    case 'cash':
    default: return 'Avulsa';
  }
}

function getPaymentBadgeColors(method: string, colors: any) {
  switch ((method || '').toLowerCase()) {
    case 'credit': return { bg: colors.primary + '22', text: colors.primary };
    case 'debit': return { bg: colors.warning + '22', text: colors.warning };
    case 'pix': return { bg: colors.success + '22', text: colors.success };
    default: return { bg: colors.textSecondary + '22', text: colors.textSecondary };
  }
}

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
  const paymentLabel = getPaymentLabel(sale?.payment_method);
  const badgeColors = getPaymentBadgeColors(sale?.payment_method, colors);

  const handleShare = async () => {
    if (!sale) return;
    const lines: string[] = [
      `🧾 Venda #${sale.id}`,
      `📅 Data: ${sale.created_at || '—'}`,
      `👤 Cliente: ${sale.customer_name || 'Não informado'}`,
      `💳 Pagamento: ${paymentLabel}`,
      ``,
      `Itens:`,
    ];
    items.forEach((it: any, idx: number) => {
      const name = it.product_name || `Produto #${it.product_id}`;
      lines.push(`${idx + 1}. ${name}`);
      lines.push(`   ${it.quantity}x R$ ${formatCurrency(it.unit_price)} = R$ ${formatCurrency(it.total_item)}`);
    });
    if (sale.discount && Number(sale.discount) > 0) {
      lines.push(``, `Desconto: -R$ ${formatCurrency(sale.discount)}`);
    }
    lines.push(``, `Total: R$ ${formatCurrency(sale?.total ?? 0)}`);
    try {
      await Share.share({ message: lines.join('\n') });
    } catch { /* ignore */ }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.detailModalOverlay}>
        <View style={styles.detailModalBox}>

          {/* Header */}
          <View style={styles.detailModalHeader}>
            <View>
              <Text style={styles.detailModalTitle}>Venda #{sale?.id}</Text>
              {!!sale?.created_at && (
                <Text style={styles.detailModalDate}>{sale.created_at}</Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Info rows */}
          <View style={styles.detailInfoSection}>
            <View style={styles.detailInfoRow}>
              <Text style={styles.detailInfoLabel}>Cliente</Text>
              <Text style={styles.detailInfoValue} numberOfLines={1}>
                {sale?.customer_name || 'Não informado'}
              </Text>
            </View>
            <View style={styles.detailInfoRow}>
              <Text style={styles.detailInfoLabel}>Pagamento</Text>
              <View style={[styles.detailPaymentBadge, { backgroundColor: badgeColors.bg }]}>
                <Text style={[styles.detailPaymentBadgeText, { color: badgeColors.text }]}>
                  {paymentLabel}
                </Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.detailDivider} />

          {/* Items */}
          {loading ? (
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.textSecondary, marginTop: 6, fontSize: 13 }}>
                Carregando itens...
              </Text>
            </View>
          ) : items.length === 0 ? (
            <Text style={styles.detailEmpty}>Nenhum item encontrado.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator>
              {items.map((it: any) => (
                <View key={it.id} style={styles.detailRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.detailName}>
                      {it.product_name || `Produto #${it.product_id}`}
                    </Text>
                    <Text style={styles.detailSub}>
                      {it.quantity}x • R$ {formatCurrency(it.unit_price)}
                    </Text>
                  </View>
                  <Text style={styles.detailTotal}>R$ {formatCurrency(it.total_item)}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Total */}
          {!loading && (
            <View style={styles.detailTotalRow}>
              <Text style={styles.detailTotalLabel}>Total</Text>
              <Text style={[styles.detailTotalValue, { color: colors.success }]}>
                R$ {formatCurrency(sale?.total ?? 0)}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.detailActions}>
            <TouchableOpacity
              style={styles.detailShareBtn}
              onPress={handleShare}
              disabled={loading}
            >
              <Share2 size={16} color={colors.primary} />
              <Text style={styles.detailShareText}>Compartilhar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.detailCloseBtn} onPress={onClose}>
              <Text style={styles.detailCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}
