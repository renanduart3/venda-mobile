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
  Calendar, 
  Edit, 
  Trash2, 
  DollarSign,
  CheckCircle,
  XCircle,
  RotateCcw,
  Filter
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Expense {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  paid: boolean;
  recurring: boolean;
  created_at: string;
  updated_at: string;
}

export default function Financas() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'new' | 'report'>('new');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    due_date: '',
    paid: false,
    recurring: false,
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    // TODO: Load from local storage and sync with Supabase
    const mockExpenses: Expense[] = [
      {
        id: '1',
        name: 'Aluguel da Loja',
        amount: 1200.00,
        due_date: '2024-01-05',
        paid: true,
        recurring: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Conta de Luz',
        amount: 380.50,
        due_date: '2024-01-15',
        paid: false,
        recurring: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Compra de Produtos',
        amount: 2500.00,
        due_date: '2024-01-10',
        paid: true,
        recurring: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'Internet',
        amount: 89.90,
        due_date: '2024-01-20',
        paid: false,
        recurring: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    setExpenses(mockExpenses);
  };

  const openExpenseModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        name: expense.name,
        amount: expense.amount.toString(),
        due_date: expense.due_date,
        paid: expense.paid,
        recurring: expense.recurring,
      });
    } else {
      setEditingExpense(null);
      setFormData({
        name: '',
        amount: '',
        due_date: '',
        paid: false,
        recurring: false,
      });
    }
    setShowExpenseModal(true);
  };

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
    setEditingExpense(null);
    setFormData({
      name: '',
      amount: '',
      due_date: '',
      paid: false,
      recurring: false,
    });
  };

  const saveExpense = async () => {
    if (!formData.name.trim() || !formData.amount || !formData.due_date) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const expenseData = {
        name: formData.name.trim(),
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        paid: formData.paid,
        recurring: formData.recurring,
      };

      if (editingExpense) {
        // Update existing expense
        const updatedExpense: Expense = {
          ...editingExpense,
          ...expenseData,
          updated_at: new Date().toISOString(),
        };
        setExpenses(expenses.map(e => e.id === editingExpense.id ? updatedExpense : e));
      } else {
        // Create new expense
        const newExpense: Expense = {
          id: Date.now().toString(),
          ...expenseData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setExpenses([...expenses, newExpense]);
      }

      closeExpenseModal();
      Alert.alert('Sucesso', 'Despesa salva com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a despesa.');
    }
  };

  const deleteExpense = (expense: Expense) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a despesa "${expense.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            setExpenses(expenses.filter(e => e.id !== expense.id));
          },
        },
      ]
    );
  };

  const togglePaidStatus = (expense: Expense) => {
    const updatedExpense = {
      ...expense,
      paid: !expense.paid,
      updated_at: new Date().toISOString(),
    };
    setExpenses(expenses.map(e => e.id === expense.id ? updatedExpense : e));
  };

  const getExpenseStats = () => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const paidExpenses = expenses.filter(e => e.paid).reduce((sum, expense) => sum + expense.amount, 0);
    const pendingExpenses = totalExpenses - paidExpenses;
    const overdueExpenses = expenses.filter(e => 
      !e.paid && new Date(e.due_date) < new Date()
    ).length;

    return {
      total: totalExpenses,
      paid: paidExpenses,
      pending: pendingExpenses,
      overdue: overdueExpenses,
    };
  };

  const stats = getExpenseStats();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isOverdue = (expense: Expense) => {
    return !expense.paid && new Date(expense.due_date) < new Date();
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
    
    // New Expense Tab
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 20,
      gap: 8,
    },
    addButtonText: {
      color: colors.white,
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
    },
    
    // Stats Cards
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 20,
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    statIcon: {
      padding: 8,
      borderRadius: 8,
    },
    statValue: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    
    // Expenses List
    expenseCard: {
      marginBottom: 12,
    },
    expenseItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    expenseIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    expenseInfo: {
      flex: 1,
    },
    expenseName: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    expenseDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    expenseAmount: {
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    expenseDate: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    expenseTags: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    tag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: colors.surface,
    },
    tagText: {
      fontSize: 10,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    overdueTag: {
      backgroundColor: colors.error + '20',
    },
    overdueTagText: {
      color: colors.error,
    },
    recurringTag: {
      backgroundColor: colors.primary + '20',
    },
    recurringTagText: {
      color: colors.primary,
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
    paidButton: {
      backgroundColor: colors.success + '20',
      borderColor: colors.success,
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
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
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

  const StatCard = ({ 
    icon, 
    value, 
    label, 
    color = colors.primary 
  }: { 
    icon: React.ReactNode; 
    value: string | number; 
    label: string; 
    color?: string; 
  }) => (
    <Card style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );

  const NewExpenseTab = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Add Expense Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => openExpenseModal()}>
        <Plus size={20} color={colors.white} />
        <Text style={styles.addButtonText}>Nova Despesa</Text>
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <StatCard
          icon={<DollarSign size={20} color={colors.primary} />}
          value={`R$ ${stats.total.toFixed(2)}`}
          label="Total do Mês"
        />
        <StatCard
          icon={<CheckCircle size={20} color={colors.success} />}
          value={`R$ ${stats.paid.toFixed(2)}`}
          label="Pago"
          color={colors.success}
        />
        <StatCard
          icon={<XCircle size={20} color={colors.warning} />}
          value={`R$ ${stats.pending.toFixed(2)}`}
          label="Pendente"
          color={colors.warning}
        />
        <StatCard
          icon={<Calendar size={20} color={colors.error} />}
          value={stats.overdue}
          label="Vencidas"
          color={colors.error}
        />
      </View>

      {/* Expenses List */}
      <Text style={{ fontSize: 18, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 16 }}>
        Despesas do Mês
      </Text>
      
      {expenses.map((expense) => (
        <Card key={expense.id} style={styles.expenseCard}>
          <View style={styles.expenseItem}>
            <View style={[
              styles.expenseIcon,
              { backgroundColor: expense.paid ? colors.success + '20' : colors.warning + '20' }
            ]}>
              {expense.paid 
                ? <CheckCircle size={20} color={colors.success} />
                : <XCircle size={20} color={colors.warning} />
              }
            </View>
            
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseName}>{expense.name}</Text>
              <View style={styles.expenseDetails}>
                <Text style={styles.expenseAmount}>
                  R$ {expense.amount.toFixed(2)}
                </Text>
                <Text style={styles.expenseDate}>
                  Venc: {formatDate(expense.due_date)}
                </Text>
              </View>
              <View style={styles.expenseTags}>
                {isOverdue(expense) && (
                  <View style={[styles.tag, styles.overdueTag]}>
                    <Text style={[styles.tagText, styles.overdueTagText]}>VENCIDA</Text>
                  </View>
                )}
                {expense.recurring && (
                  <View style={[styles.tag, styles.recurringTag]}>
                    <Text style={[styles.tagText, styles.recurringTagText]}>RECORRENTE</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  expense.paid && styles.paidButton,
                ]}
                onPress={() => togglePaidStatus(expense)}
              >
                {expense.paid 
                  ? <CheckCircle size={16} color={colors.success} />
                  : <XCircle size={16} color={colors.warning} />
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openExpenseModal(expense)}
              >
                <Edit size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => deleteExpense(expense)}
              >
                <Trash2 size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );

  const ReportTab = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 18, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 20 }}>
        Relatórios Financeiros
      </Text>
      
      {/* TODO: Add charts and detailed reports */}
      <Card>
        <Text style={{ textAlign: 'center', color: colors.textSecondary, marginVertical: 40 }}>
          Relatórios em desenvolvimento
        </Text>
      </Card>
    </ScrollView>
  );

  const ExpenseModal = () => (
    <Modal visible={showExpenseModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
          </Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome da Despesa *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Ex: Aluguel, Conta de Luz..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Valor *</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                placeholder="0,00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Data de Vencimento *</Text>
              <TextInput
                style={styles.input}
                value={formData.due_date}
                onChangeText={(text) => setFormData({ ...formData, due_date: text })}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setFormData({ ...formData, paid: !formData.paid })}
              >
                <View style={[styles.checkbox, formData.paid && styles.checkboxChecked]}>
                  {formData.paid && <CheckCircle size={12} color={colors.white} />}
                </View>
                <Text style={styles.checkboxText}>Pago</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setFormData({ ...formData, recurring: !formData.recurring })}
              >
                <View style={[styles.checkbox, formData.recurring && styles.checkboxChecked]}>
                  {formData.recurring && <RotateCcw size={12} color={colors.white} />}
                </View>
                <Text style={styles.checkboxText}>Recorrente</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <Button
              title="Cancelar"
              onPress={closeExpenseModal}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Salvar"
              onPress={saveExpense}
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header title="Finanças" />
      
      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'new' && styles.tabButtonActive]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'new' && styles.tabButtonTextActive]}>
            Despesas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'report' && styles.tabButtonActive]}
          onPress={() => setActiveTab('report')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'report' && styles.tabButtonTextActive]}>
            Relatórios
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'new' ? <NewExpenseTab /> : <ReportTab />}

      <ExpenseModal />
    </View>
  );
}