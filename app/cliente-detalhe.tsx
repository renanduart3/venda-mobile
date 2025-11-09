import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TextInput } from '@/components/ui/TextInput';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react-native';
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
  due_date: string;
  paid: boolean;
  customer_id: string | null;
  paid_at?: string | null;
}

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

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    const { loadCustomers, loadExpenses } = await import('@/lib/data-loader');
    const [customers, allExpenses] = await Promise.all([loadCustomers(), loadExpenses()]);
    const foundCustomer = (customers as any[]).find((c) => c.id === customerId);
    if (foundCustomer) {
      setCustomer(foundCustomer as Customer);
    } else {
      setCustomer(null);
    }
    const customerExpenses = (allExpenses as any[]).filter((e) => e.customer_id === customerId);
    setExpenses(customerExpenses as Expense[]);
  };

  const totalDebt = expenses
    .filter(e => !e.paid)
    .reduce((sum, e) => sum + e.amount, 0);

  const navigateToExpense = (expenseId: string) => {
    router.push({
      pathname: '/(tabs)/financas',
      params: { expenseId }
    } as any);
  };

  // Helper: robust date formatting for display
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Sem vencimento';
    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString;
    // DD-MM-YYYY -> convert to DD/MM/YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) return dateString.replace(/-/g, '/');
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
    return 'Data inválida';
  };

  const openExpenseModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setEditDueDate(formatDate(expense.due_date));
    setShowExpenseModal(true);
  };

  const persistDueDateValue = (value: string): string | null => {
    if (!value || value === 'Sem vencimento' || value === 'Data inválida') return null;
    // store as DD/MM/YYYY string (consistent with Finanças input)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
    if (/^\d{2}-\d{2}-\d{4}$/.test(value)) return value.replace(/-/g, '/');
    // Fallback try parse to ISO and back to dd/MM/yyyy
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    return null;
  };

  const updateExpenseDueDate = async () => {
    if (!selectedExpense) return;
    try {
      const due = persistDueDateValue(editDueDate);
      const updated_at = new Date().toISOString();
      await (await import('@/lib/db')).default.update(
        'expenses',
        { due_date: due, updated_at },
        'id = ?',
        [selectedExpense.id]
      );
      await loadCustomerData();
      Alert.alert('Sucesso', 'Vencimento atualizado!');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar o vencimento.');
    }
  };

  const markAsPaid = async (expenseId: string) => {
    Alert.alert(
      'Confirmar Pagamento',
      'Deseja marcar esta despesa como paga?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const updated_at = new Date().toISOString();
              const due = persistDueDateValue(editDueDate);
              await (await import('@/lib/db')).default.update(
                'expenses',
                { paid: true, due_date: due, updated_at, paid_at: updated_at },
                'id = ?',
                [expenseId]
              );
              await loadCustomerData();
              setShowExpenseModal(false);
              Alert.alert('Sucesso', 'Despesa marcada como paga!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível marcar como paga');
            }
          }
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
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
    backButton: {
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.card,
    },
    headerTitle: {
      fontSize: 22,
      fontFamily: 'Inter-Bold',
      color: colors.onTopbar,
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    infoValue: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },
    debtCard: {
      backgroundColor: colors.error + '10',
      borderWidth: 1,
      borderColor: colors.error,
      marginBottom: 16,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      // Remove Card shadow visually for this variant
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
    debtAmount: {
      fontSize: 28,
      fontFamily: 'Inter-Black',
      color: colors.error,
      textAlign: 'center',
    },
    expenseCard: {
      marginBottom: 12,
    },
    expenseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    expenseName: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      flex: 1,
    },
    expenseAmount: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    expenseDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    expenseDate: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },

    // Botões de Ação
    expenseActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
    },

    // Modal
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      width: '100%',
      maxWidth: 400,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    modalBody: {
      padding: 20,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      padding: 20,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
    },
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
        <View style={styles.section}>
          <Card>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefone</Text>
              <Text style={styles.infoValue}>{customer.phone}</Text>
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

        {totalDebt > 0 && (
          <Card style={styles.debtCard}>
            <Text style={styles.debtAmount}>R$ {totalDebt.toFixed(2)}</Text>
            <Text style={styles.debtLabel}>Saldo Devedor</Text>
          </Card>
        )}

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
                  <Text style={styles.expenseAmount}>R$ {expense.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.expenseDetails}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} color={colors.textSecondary} />
                    <Text style={styles.expenseDate}>
                      {formatDate(expense.due_date)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: expense.paid ? colors.success + '20' : colors.error + '20',
                      },
                    ]}
                  >
                    {expense.paid ? (
                      <CheckCircle size={12} color={colors.success} />
                    ) : (
                      <XCircle size={12} color={colors.error} />
                    )}
                    <Text
                      style={[
                        styles.statusText,
                        { color: expense.paid ? colors.success : colors.error },
                      ]}
                    >
                      {expense.paid ? 'Quitada' : 'Pendente'}
                    </Text>
                  </View>
                </View>

                {/* Botões de Ação */}
                <View style={styles.expenseActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => openExpenseModal(expense)}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.white }]}>
                      Ver Detalhes
                    </Text>
                  </TouchableOpacity>
                  
                  {!expense.paid && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.success }]}
                      onPress={() => markAsPaid(expense.id)}
                    >
                      <Text style={[styles.actionButtonText, { color: colors.white }]}>
                        Marcar como Paga
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal de Detalhes da Despesa */}
      {showExpenseModal && selectedExpense && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da Despesa</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowExpenseModal(false)}
              >
                <XCircle size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nome:</Text>
                <Text style={styles.detailValue}>{selectedExpense.name}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Valor:</Text>
                <Text style={[styles.detailValue, { color: colors.primary, fontSize: 18, fontFamily: 'Inter-Bold' }]}>
                  R$ {selectedExpense.amount.toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vencimento:</Text>
                <TextInput
                  style={[styles.detailValue, { borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6 }]}
                  value={editDueDate}
                  onChangeText={(text) => {
                    let v = text.replace(/\D/g, '');
                    if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2);
                    if (v.length >= 5) v = v.substring(0,5) + '/' + v.substring(5,9);
                    setEditDueDate(v);
                  }}
                  placeholder="DD/MM/AAAA"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[
                  styles.statusBadge,
                  {
                    backgroundColor: selectedExpense.paid ? colors.success + '20' : colors.error + '20',
                  },
                ]}>
                  {selectedExpense.paid ? (
                    <CheckCircle size={16} color={colors.success} />
                  ) : (
                    <XCircle size={16} color={colors.error} />
                  )}
                  <Text
                    style={[
                      styles.statusText,
                      { color: selectedExpense.paid ? colors.success : colors.error },
                    ]}
                  >
                    {selectedExpense.paid ? 'Quitada' : 'Pendente'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={updateExpenseDueDate}
              >
                <Text style={[styles.modalButtonText, { color: colors.white }]}>Salvar Vencimento</Text>
              </TouchableOpacity>

              {!selectedExpense.paid && (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.success }]}
                  onPress={() => markAsPaid(selectedExpense.id)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.white }]}>Marcar como Paga</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowExpenseModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
