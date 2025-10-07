import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';

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
  paid: number;
  customer_id: string | null;
}

export default function ClienteDetalhe() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    const { mockCustomers, mockExpenses } = await import('@/lib/mocks');

    const foundCustomer = mockCustomers.find((c: any) => c.id === customerId);
    if (foundCustomer) {
      setCustomer(foundCustomer as Customer);
    }

    const customerExpenses = mockExpenses.filter((e: any) => e.customer_id === customerId);
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.card,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
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
      backgroundColor: colors.error + '20',
      borderColor: colors.error,
      borderWidth: 1,
      marginBottom: 16,
    },
    debtAmount: {
      fontSize: 32,
      fontFamily: 'Inter-Bold',
      color: colors.error,
      textAlign: 'center',
    },
    debtLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
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
        <Text style={styles.headerTitle}>{customer.name}</Text>
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
              <TouchableOpacity
                key={expense.id}
                onPress={() => navigateToExpense(expense.id)}
              >
                <Card style={styles.expenseCard}>
                  <View style={styles.expenseHeader}>
                    <Text style={styles.expenseName}>{expense.name}</Text>
                    <Text style={styles.expenseAmount}>R$ {expense.amount.toFixed(2)}</Text>
                  </View>

                  <View style={styles.expenseDetails}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} color={colors.textSecondary} />
                      <Text style={styles.expenseDate}>
                        {new Date(expense.due_date).toLocaleDateString('pt-BR')}
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
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
