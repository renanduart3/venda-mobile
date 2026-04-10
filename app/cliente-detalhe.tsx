import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, Linking, Clipboard,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { TextInput } from '@/components/ui/TextInput';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { isPremium } from '@/lib/premium';
import { generatePixPayload, parsePixKeys } from '@/lib/pix';
import {
  ArrowLeft, DollarSign, Calendar, CheckCircle, XCircle,
  MessageCircle, QrCode, Copy, ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { toTitleCase } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  whatsapp: number;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  original_amount?: number;
  due_date: string;
  paid: boolean;
  customer_id: string | null;
  paid_at?: string | null;
}

// ─── WhatsApp helper ──────────────────────────────────────────────────────────

function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length === 11 || digits.length === 10) return `55${digits}`;
  if (digits.startsWith('0')) return `55${digits.slice(1)}`;
  return `55${digits}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ClienteDetalhe() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editDueDate, setEditDueDate] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  // Configurações da loja (para WhatsApp e PIX)
  const [storeName, setStoreName] = useState<string>('');
  const [pixKeys, setPixKeys] = useState<string[]>([]);

  // Modal de seleção de chave PIX (quando há múltiplas)
  const [showKeySelector, setShowKeySelector] = useState(false);

  // Modal PIX
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixString, setPixString] = useState<string>('');
  const [activePixKey, setActivePixKey] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Premium
  const [userIsPremium, setUserIsPremium] = useState(false);

  useEffect(() => {
    loadCustomerData();
    loadStoreInfo();
    isPremium().then(p => setUserIsPremium(p)).catch(() => {});
  }, [customerId]);

  const loadStoreInfo = async () => {
    try {
      const { loadStoreSettings } = await import('@/lib/data-loader');
      const settings = await loadStoreSettings() as any;
      if (settings?.store_name) setStoreName(settings.store_name);
      if (settings?.pix_key) {
        setPixKeys(parsePixKeys(settings.pix_key));
      }
    } catch {
      // Não crítico — só esconde os botões
    }
  };

  const loadCustomerData = async () => {
    const { loadCustomers, loadExpenses } = await import('@/lib/data-loader');
    const [customers, allExpenses] = await Promise.all([loadCustomers(), loadExpenses()]);
    const foundCustomer = (customers as any[]).find((c) => c.id === customerId);
    setCustomer(foundCustomer ? (foundCustomer as Customer) : null);
    const customerExpenses = (allExpenses as any[]).filter((e) => e.customer_id === customerId);
    setExpenses(customerExpenses as Expense[]);
  };

  const totalDebt = expenses
    .filter(e => !e.paid)
    .reduce((sum, e) => sum + e.amount, 0);

  const getOriginalAmount = (expense: Expense): number => {
    const original = Number(expense.original_amount ?? 0);
    return original > 0 ? original : Number(expense.amount ?? 0);
  };

  const navigateToExpense = (expenseId: string) => {
    router.push({ pathname: '/(tabs)/financas', params: { expenseId } } as any);
  };

  // ─── Formatação de data ───────────────────────────────────────────────────

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Sem vencimento';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString;
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) return dateString.replace(/-/g, '/');
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
    return 'Data inválida';
  };

  const persistDueDateValue = (value: string): string | null => {
    if (!value || value === 'Sem vencimento' || value === 'Data inválida') return null;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
    if (/^\d{2}-\d{2}-\d{4}$/.test(value)) return value.replace(/-/g, '/');
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}/${d.getFullYear()}`;
    }
    return null;
  };

  // ─── Premium gate helper ─────────────────────────────────────────────────

  const requirePremium = (action: () => void) => {
    if (userIsPremium) {
      action();
      return;
    }
    Alert.alert(
      '🔒 Recurso Premium',
      'Este recurso está disponível apenas para assinantes. Faça upgrade e desbloqueie cobranças via WhatsApp, PIX QR Code e muito mais!',
      [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Ver planos', onPress: () => router.push('/planos' as any) },
      ],
    );
  };

  // ─── WhatsApp cobrança ────────────────────────────────────────────────────

  const handleWhatsApp = async () => {
    if (!customer?.phone) {
      Alert.alert('Sem telefone', 'Este cliente não tem telefone cadastrado.');
      return;
    }
    const phone = formatPhoneForWhatsApp(customer.phone);
    const nome = toTitleCase(customer.name).split(' ')[0]; // Primeiro nome
    const valor = `R$ ${totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const loja = storeName || 'nossa loja';

    const msg = `Olá ${nome}! 👋 Passando para lembrar que você tem ${valor} de fiado aqui na ${loja}. Qualquer dúvida é só falar. Obrigado! 🙏`;
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(msg)}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback: WhatsApp Web
        const webUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
        await Linking.openURL(webUrl);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
    }
  };

  // ─── PIX QR Code ─────────────────────────────────────────────────────────

  const openPixWithKey = (key: string) => {
    const payload = generatePixPayload(key, totalDebt, storeName || 'Loja');
    setActivePixKey(key);
    setPixString(payload);
    setCopied(false);
    setShowPixModal(true);
  };

  const handlePix = () => {
    if (pixKeys.length === 0) {
      Alert.alert(
        'Chave PIX não configurada',
        'Cadastre sua chave PIX nas Configurações do app para usar este recurso.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir para Configurações', onPress: () => router.push('/settings' as any) },
        ]
      );
      return;
    }
    if (pixKeys.length === 1) {
      openPixWithKey(pixKeys[0]);
    } else {
      // Múltiplas chaves: abre o seletor
      setShowKeySelector(true);
    }
  };

  const copyPixCode = () => {
    Clipboard.setString(pixString);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // ─── Modal de despesa ─────────────────────────────────────────────────────

  const openExpenseModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setEditDueDate(formatDate(expense.due_date));
    setPaymentAmount('');
    setShowExpenseModal(true);
  };

  const updateExpenseDueDate = async () => {
    if (!selectedExpense) return;
    try {
      const due = persistDueDateValue(editDueDate);
      const updated_at = new Date().toISOString();
      await (await import('@/lib/db')).default.update('expenses', { due_date: due, updated_at }, 'id = ?', [selectedExpense.id]);
      await loadCustomerData();
      Alert.alert('Sucesso', 'Vencimento atualizado!');
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o vencimento.');
    }
  };

  const handlePayment = async () => {
    if (!selectedExpense) return;
    const value = parseFloat(paymentAmount.replace(',', '.'));
    if (isNaN(value) || value <= 0) { Alert.alert('Erro', 'Insira um valor válido e maior que zero.'); return; }
    if (value > selectedExpense.amount + 0.05) { Alert.alert('Erro', `O valor não pode ser maior que R$ ${selectedExpense.amount.toFixed(2)}.`); return; }

    const isPartial = value < selectedExpense.amount;
    const remaining = selectedExpense.amount - value;
    const currentOriginal = getOriginalAmount(selectedExpense);

    Alert.alert(
      isPartial ? 'Confirmar Pagamento Parcial' : 'Confirmar Pagamento Total',
      isPartial
        ? `Deseja registrar um pagamento de R$ ${value.toFixed(2)}?\n\nSaldo pendente: R$ ${remaining.toFixed(2)}`
        : `Deseja marcar esta dívida integralmente como paga?\n\nValor: R$ ${value.toFixed(2)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const db = (await import('@/lib/db')).default;
              const updated_at = new Date().toISOString();
              const due = persistDueDateValue(editDueDate);
              if (isPartial) {
                await db.update('expenses', { amount: remaining, original_amount: currentOriginal, due_date: due, updated_at }, 'id = ?', [selectedExpense.id]);
                Alert.alert('Sucesso', 'Pagamento parcial registrado!');
              } else {
                await db.update('expenses', { paid: true, original_amount: currentOriginal, due_date: due, updated_at, paid_at: updated_at }, 'id = ?', [selectedExpense.id]);
                Alert.alert('Sucesso', 'Dívida marcada como paga!');
              }
              await loadCustomerData();
              setShowExpenseModal(false);
            } catch {
              Alert.alert('Erro', 'Não foi possível registrar o pagamento.');
            }
          },
        },
      ]
    );
  };

  const handleTotalPayment = async (expense: Expense) => {
    Alert.alert(
      'Confirmar Pagamento Total',
      `Deseja marcar esta dívida (Pendente: R$ ${expense.amount.toFixed(2)}) integralmente como paga?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const db = (await import('@/lib/db')).default;
              const updated_at = new Date().toISOString();
              const currentOriginal = getOriginalAmount(expense);
              await db.update('expenses', { paid: true, original_amount: currentOriginal, updated_at, paid_at: updated_at }, 'id = ?', [expense.id]);
              Alert.alert('Sucesso', 'Dívida marcada como paga!');
              await loadCustomerData();
            } catch {
              Alert.alert('Erro', 'Não foi possível registrar o pagamento.');
            }
          },
        },
      ]
    );
  };

  // ─── Styles ───────────────────────────────────────────────────────────────

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.topbar,
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 16,
      borderBottomWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    backButton: { padding: 10, borderRadius: 10, backgroundColor: colors.card },
    headerTitle: { fontSize: 22, fontFamily: 'Inter-Bold', color: colors.onTopbar, flex: 1 },
    content: { flex: 1, padding: 20 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 12 },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: { fontSize: 14, fontFamily: 'Inter-Medium', color: colors.textSecondary },
    infoValue: { fontSize: 14, fontFamily: 'Inter-Regular', color: colors.text },
    debtCard: {
      backgroundColor: colors.error + '10',
      borderWidth: 1,
      borderColor: colors.error,
      marginBottom: 12,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      elevation: 0,
      shadowColor: 'transparent',
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
    },
    debtLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.error,
      textTransform: 'uppercase',
      letterSpacing: 1,
      textAlign: 'center',
      marginBottom: 6,
    },
    debtAmount: { fontSize: 28, fontFamily: 'Inter-Black', color: colors.error, textAlign: 'center' },
    // Botões de ação rápida (WhatsApp + PIX)
    quickActions: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    quickActionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 10,
    },
    quickActionText: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
    expenseCard: { marginBottom: 12 },
    expenseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    expenseName: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: colors.text, flex: 1 },
    expenseAmount: { fontSize: 18, fontFamily: 'Inter-Bold', color: colors.primary },
    expenseDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    expenseDate: { fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textSecondary },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: 14, fontFamily: 'Inter-Regular', color: colors.textSecondary, textAlign: 'center' },
    expenseActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionButton: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center' },
    actionButtonText: { fontSize: 12, fontFamily: 'Inter-Medium' },
    // Modal base
    modalOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center', alignItems: 'center', padding: 20,
    },
    modalContent: { backgroundColor: colors.background, borderRadius: 16, width: '100%', maxWidth: 400, overflow: 'hidden' },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: 20, backgroundColor: colors.surface,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    modalTitle: { fontSize: 20, fontFamily: 'Inter-Bold', color: colors.text },
    closeButton: { padding: 8, borderRadius: 8, backgroundColor: colors.card },
    modalBody: { padding: 24 },
    detailRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
      paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12,
    },
    detailLabel: { fontSize: 13, fontFamily: 'Inter-Medium', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    detailValue: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: colors.text, textAlign: 'right', flex: 1 },
    modalActions: {
      padding: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border,
      flexDirection: 'row', gap: 12, justifyContent: 'space-between', alignItems: 'center',
    },
    modalButton: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
    modalButtonText: { fontSize: 16, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
    // Modal PIX específico
    pixModalContent: {
      backgroundColor: colors.background, borderRadius: 20, width: '100%',
      maxWidth: 360, overflow: 'hidden', alignItems: 'center',
    },
    pixModalHeader: {
      width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: 20, backgroundColor: colors.surface,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    pixQrWrapper: {
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 16,
      marginVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pixAmount: { fontSize: 24, fontFamily: 'Inter-Black', color: colors.text, marginBottom: 4 },
    pixAmountLabel: { fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginBottom: 20 },
    pixKeyLabel: { fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginBottom: 4 },
    pixKeyValue: { fontSize: 13, fontFamily: 'Inter-Medium', color: colors.text, textAlign: 'center', marginBottom: 16, paddingHorizontal: 16 },
    copyBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12,
      marginBottom: 20,
    },
    copyBtnText: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
  });

  if (!customer) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Carregando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{toTitleCase(customer.name)}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Info do cliente */}
        <View style={styles.section}>
          <Card>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefone</Text>
              <Text style={styles.infoValue}>{customer.phone || 'Não informado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{customer.email || 'Não informado'}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>WhatsApp</Text>
              <Text style={styles.infoValue}>{customer.whatsapp ? 'Sim' : 'Não'}</Text>
            </View>
          </Card>
        </View>

        {/* Saldo devedor */}
        {totalDebt > 0 && (
          <>
            <Card style={styles.debtCard}>
              <Text style={styles.debtAmount}>
                {totalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </Text>
              <Text style={styles.debtLabel}>Saldo Devedor</Text>
            </Card>

            {/* Botões de ação rápida */}
            <View style={styles.quickActions}>
              {/* WhatsApp — só aparece se o cliente tem WhatsApp cadastrado */}
              {!!customer.whatsapp && !!customer.phone && (
                <TouchableOpacity
                  style={[
                    styles.quickActionBtn,
                    { backgroundColor: userIsPremium ? '#25D366' : '#25D36660' },
                  ]}
                  onPress={() => requirePremium(handleWhatsApp)}
                  activeOpacity={0.82}
                >
                  <MessageCircle size={18} color="#fff" />
                  <Text style={[styles.quickActionText, { color: '#fff' }]}>
                    {userIsPremium ? 'Cobrar via WhatsApp' : '🔒 WhatsApp'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* PIX — sempre aparece (avisa se não tiver chave ou premium) */}
              <TouchableOpacity
                style={[
                  styles.quickActionBtn,
                  { backgroundColor: userIsPremium ? colors.primary : colors.primary + '60' },
                ]}
                onPress={() => requirePremium(handlePix)}
                activeOpacity={0.82}
              >
                <QrCode size={18} color="#fff" />
                <Text style={[styles.quickActionText, { color: '#fff' }]}>
                  {userIsPremium ? 'Cobrar via PIX' : '🔒 PIX'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Lista de despesas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Despesas</Text>

          {expenses.length === 0 ? (
            <Card>
              <View style={styles.emptyState}>
                <DollarSign size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>Nenhuma despesa registrada</Text>
              </View>
            </Card>
          ) : (
            expenses.map((expense) => (
              <Card key={expense.id} style={styles.expenseCard}>
                <View style={styles.expenseHeader}>
                  <Text style={styles.expenseName} numberOfLines={2} ellipsizeMode="tail">{expense.name}</Text>
                  <Text style={[styles.expenseAmount, { color: colors.text }]}>R$ {getOriginalAmount(expense).toFixed(2)}</Text>
                </View>

                {!expense.paid && (() => {
                  const orig = getOriginalAmount(expense);
                  const pago = orig - expense.amount;
                  return (
                    <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13, color: colors.warning, fontFamily: 'Inter-Medium' }}>
                        Pendente: R$ {expense.amount.toFixed(2)}
                      </Text>
                      {pago > 0 && (
                        <Text style={{ fontSize: 13, color: colors.success, fontFamily: 'Inter-Medium' }}>
                          Pago: R$ {pago.toFixed(2)}
                        </Text>
                      )}
                    </View>
                  );
                })()}

                <View style={styles.expenseDetails}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} color={colors.textSecondary} />
                    <Text style={styles.expenseDate}>{formatDate(expense.due_date)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: expense.paid ? colors.success + '20' : colors.error + '20' }]}>
                    {expense.paid ? <CheckCircle size={12} color={colors.success} /> : <XCircle size={12} color={colors.error} />}
                    <Text style={[styles.statusText, { color: expense.paid ? colors.success : colors.error }]}>
                      {expense.paid ? 'Quitada' : 'Pendente'}
                    </Text>
                  </View>
                </View>

                <View style={styles.expenseActions}>
                  {expense.paid ? (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}
                      onPress={() => openExpenseModal(expense)}
                    >
                      <Text style={[styles.actionButtonText, { color: colors.text }]}>Ver Detalhes</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}
                        onPress={() => openExpenseModal(expense)}
                      >
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>Pagamento Parcial</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.success }]}
                        onPress={() => handleTotalPayment(expense)}
                      >
                        <Text style={[styles.actionButtonText, { color: colors.white }]}>Pagamento Total</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* ─── Modal de Pagamento de Despesa ─────────────────────────────────── */}
      {showExpenseModal && selectedExpense && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pagamento de Dívida</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowExpenseModal(false)}>
                <XCircle size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Descrição:</Text>
                <Text style={[styles.detailValue, { textAlign: 'left', flex: 1 }]}>{selectedExpense.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Valor Original:</Text>
                <Text style={[styles.detailValue, { color: colors.primary, fontSize: 17 }]}>
                  R$ {getOriginalAmount(selectedExpense).toFixed(2)}
                </Text>
              </View>
              {!selectedExpense.paid && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Valor Pendente:</Text>
                  <Text style={[styles.detailValue, { color: colors.error, fontSize: 17, fontFamily: 'Inter-Bold' }]}>
                    R$ {selectedExpense.amount.toFixed(2)}
                  </Text>
                </View>
              )}
              {!selectedExpense.paid && (
                <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'stretch', borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Valor a Pagar (R$):</Text>
                  <TextInput
                    style={[{ borderWidth: 1, borderColor: colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontFamily: 'Inter-Bold', fontSize: 18, backgroundColor: colors.card, marginTop: 8 }]}
                    value={paymentAmount}
                    onChangeText={(text) => setPaymentAmount(text.replace(/[^\d.,]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="0,00"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={[styles.detailLabel, { marginTop: 8, fontSize: 12, color: colors.textSecondary }]}>
                    Máximo: R$ {selectedExpense.amount.toFixed(2)}
                  </Text>
                </View>
              )}
              {selectedExpense.paid && (
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                    <CheckCircle size={14} color={colors.success} />
                    <Text style={[styles.statusText, { color: colors.success }]}>Quitada</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              {!selectedExpense.paid && (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.success, flex: 1 }]}
                  onPress={handlePayment}
                >
                  <Text style={[styles.modalButtonText, { color: colors.white }]}>Pagar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flex: 1 }]}
                onPress={() => setShowExpenseModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ─── Seletor de chave PIX (múltiplas chaves) ─────────────────────── */}
      <Modal
        visible={showKeySelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowKeySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 0, overflow: 'hidden' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Chave PIX</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowKeySelector(false)}>
                <XCircle size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={{ paddingVertical: 8 }}>
              {pixKeys.map((key, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    setShowKeySelector(false);
                    openPixWithKey(key);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderBottomWidth: i < pixKeys.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 15, fontFamily: 'Inter-Medium', color: colors.text, flex: 1 }} numberOfLines={1}>
                    {key}
                  </Text>
                  <ChevronRight size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Modal PIX ─────────────────────────────────────────────────────── */}
      <Modal
        visible={showPixModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPixModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pixModalContent}>
            {/* Header */}
            <View style={styles.pixModalHeader}>
              <Text style={styles.modalTitle}>Cobrar via PIX</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowPixModal(false)}>
                <XCircle size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Valor */}
            <Text style={[styles.pixAmount, { marginTop: 24 }]}>
              {totalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Text>
            <Text style={styles.pixAmountLabel}>a receber de {toTitleCase(customer.name)}</Text>

            {/* QR Code */}
            {pixString ? (
              <View style={styles.pixQrWrapper}>
                <QRCode
                  value={pixString}
                  size={210}
                  backgroundColor="#ffffff"
                  color="#000000"
                />
              </View>
            ) : null}

            {/* Chave PIX usada */}
            <Text style={styles.pixKeyLabel}>Chave PIX</Text>
            <Text style={styles.pixKeyValue} numberOfLines={2}>{activePixKey}</Text>

            {/* Botão copiar código */}
            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: copied ? colors.success : colors.primary }]}
              onPress={copyPixCode}
              activeOpacity={0.82}
            >
              <Copy size={18} color="#fff" />
              <Text style={[styles.copyBtnText, { color: '#fff' }]}>
                {copied ? 'Código copiado! ✓' : 'Copiar Pix Copia e Cola'}
              </Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 24, paddingBottom: 20 }}>
              O cliente escaneia o QR Code ou cola o código no app do banco para pagar.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
