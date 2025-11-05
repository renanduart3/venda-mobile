import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { TextInput } from '@/components/ui/TextInput';
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
import { router } from 'expo-router';
import db from '@/lib/db';

interface Expense {
  id: string;
  name: string;
  amount: number;
  due_date?: string | null;
  paid: boolean;
  recurring: boolean;
  customer_id?: string | null;
  created_month: string; // Mês de cadastro (YYYY-MM)
  created_at: string;
  updated_at: string;
}

export default function Financas() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'new' | 'report'>('new');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  
  // Filtros
  // Util para lidar com meses sem problemas de fuso/UTC
  const getCurrentMonthLocal = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };
  const addMonths = (monthStr: string, delta: number) => {
    const [yStr, mStr] = monthStr.split('-');
    const y = parseInt(yStr, 10);
    const m0 = parseInt(mStr, 10) - 1;
    const d = new Date(y, m0, 1);
    d.setMonth(d.getMonth() + delta);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yy}-${mm}`;
  };
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthLocal());
  const [expenseStatusFilter, setExpenseStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Funções de filtro
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Filtro por mês
      const expenseMonth = expense.created_month || expense.created_at.slice(0, 7);
      if (expenseMonth !== selectedMonth) return false;
      
      // Filtro por status
      const today = new Date().toISOString().split('T')[0];
      const isOverdue = expense.due_date && expense.due_date < today && !expense.paid;
      
      switch (expenseStatusFilter) {
        case 'pending':
          return !expense.paid && !isOverdue;
        case 'paid':
          return expense.paid;
        case 'overdue':
          return isOverdue;
        default:
          return true;
      }
    });
  }, [expenses, selectedMonth, expenseStatusFilter]);

  const expenseStats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const paid = filteredExpenses.filter(e => e.paid).reduce((sum, expense) => sum + expense.amount, 0);
    const pending = filteredExpenses.filter(e => !e.paid).reduce((sum, expense) => sum + expense.amount, 0);
    return { total, paid, pending, count: filteredExpenses.length };
  }, [filteredExpenses]);

  // Report filters
  const [reportFilter, setReportFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    due_date: '',
    paid: false,
    recurring: false,
    customer_id: '',
  });


  useEffect(() => {
    loadExpenses();
    loadSales();
    loadCustomers();
  }, []);

  // Reset page when filter or month changes
  useEffect(() => {
    setCurrentPage(1);
  }, [reportFilter, selectedMonth]);

  const loadCustomers = async () => {
    try {
      const { loadCustomers: loadCustomersData } = await import('@/lib/data-loader');
      const data = await loadCustomersData();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    }
  };

  const loadExpenses = async () => {
    try {
      const { loadExpenses: loadExpensesData } = await import('@/lib/data-loader');
      const data = await loadExpensesData();
      const convertedExpenses = data.map((expense: any) => ({
        ...expense,
        paid: Boolean(expense.paid),
        recurring: Boolean(expense.recurring)
      }));
      setExpenses(convertedExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setExpenses([]);
    }
  };

  const loadSales = async () => {
    try {
      const { loadSales: loadSalesData } = await import('@/lib/data-loader');
      const data = await loadSalesData();
      setSales(data);
    } catch (error) {
      console.error('Error loading sales:', error);
      setSales([]);
    }
  };

  const openExpenseModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        name: expense.name,
        amount: expense.amount.toString(),
        due_date: expense.due_date || '',
        paid: expense.paid,
        recurring: expense.recurring,
        customer_id: expense.customer_id || '',
      });
    } else {
      setEditingExpense(null);
      setFormData({
        name: '',
        amount: '',
        due_date: '',
        paid: false,
        recurring: false,
        customer_id: '',
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
      customer_id: '',
    });
  };

  const saveExpense = async () => {
    if (!formData.name.trim() || !formData.amount) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const now = new Date();
      const timestamp = now.toISOString();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const amountValue = parseFloat(formData.amount.replace(',', '.'));
      if (Number.isNaN(amountValue)) {
        Alert.alert('Erro', 'Informe um valor válido.');
        return;
      }

      const expensePayload = {
        name: formData.name.trim(),
        amount: amountValue,
        due_date: formData.due_date || null,
        paid: formData.paid,
        recurring: formData.recurring,
        customer_id: formData.customer_id || null,
        created_month: editingExpense?.created_month || currentMonth,
        updated_at: timestamp,
      };

      if (editingExpense) {
        await db.update('expenses', expensePayload, 'id = ?', [editingExpense.id]);
      } else {
        const id = Date.now().toString();
        await db.insert('expenses', {
          id,
          ...expensePayload,
          created_at: timestamp,
        });
      }

      await loadExpenses();
      closeExpenseModal();
      Alert.alert('Sucesso', 'Despesa salva com sucesso!');
    } catch (error) {
      console.error('Error saving expense:', error);
      Alert.alert('Erro', 'Não foi possível salvar a despesa.');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await db.del('expenses', 'id = ?', [expenseId]);
      await loadExpenses();
      Alert.alert('Sucesso', 'Despesa excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting expense:', error);
      Alert.alert('Erro', 'Não foi possível excluir a despesa.');
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
            handleDeleteExpense(expense.id);
          },
        },
      ]
    );
  };

  const togglePaidStatus = async (expense: Expense) => {
    try {
      const updatedAt = new Date().toISOString();
      await db.update(
        'expenses',
        { paid: !expense.paid, updated_at: updatedAt },
        'id = ?',
        [expense.id]
      );
      await loadExpenses();
    } catch (error) {
      console.error('Error toggling expense status:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o status da despesa.');
    }
  };

  const stats = expenseStats;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateForDisplay = (dateString: string | null) => {
    if (!dateString) return 'Sem vencimento';
    return formatDate(dateString);
  };

  const isOverdue = (expense: Expense) => {
    return !expense.paid && expense.due_date && new Date(expense.due_date) < new Date();
  };

  // Report functions
  const financialData = useMemo(() => {
    const currentMonth = selectedMonth;
    const monthlyExpenses = expenses.filter(expense => {
      const expenseMonth = expense.created_month || expense.created_at.slice(0, 7);
      return expenseMonth === currentMonth;
    });
    const monthlySales = sales.filter(sale => {
      const saleMonth = sale.created_at.slice(0, 7);
      return saleMonth === currentMonth;
    });
    const combined = [
      ...monthlyExpenses.map(expense => ({
        id: `expense-${expense.id}`,
        type: 'expense' as const,
        description: expense.name,
        amount: -expense.amount,
        date: expense.created_at,
        customer: expense.customer_id ? customers.find(c => c.id === expense.customer_id)?.name : null,
        status: expense.paid ? 'Pago' : 'Pendente',
        category: 'Despesa'
      })),
      ...monthlySales.map(sale => ({
        id: `sale-${sale.id}`,
        type: 'income' as const,
        description: `Venda - ${sale.customer_name}`,
        amount: sale.total,
        date: sale.created_at,
        customer: sale.customer_name,
        status: 'Pago',
        category: 'Venda'
      }))
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, sales, customers, selectedMonth]);

  const filteredData = useMemo(() => {
    switch (reportFilter) {
      case 'income':
        return financialData.filter(item => item.type === 'income');
      case 'expense':
        return financialData.filter(item => item.type === 'expense');
      default:
        return financialData;
    }
  }, [financialData, reportFilter]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: filteredData.slice(startIndex, endIndex),
      totalPages: Math.ceil(filteredData.length / itemsPerPage),
      totalItems: filteredData.length
    };
  }, [filteredData, currentPage]);

  const monthSummary = useMemo(() => {
    const totalIncome = financialData.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = Math.abs(financialData.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0));
    const balance = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, balance, transactionCount: financialData.length };
  }, [financialData]);

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

    // Filtros
    filterContainer: {
      marginBottom: 16,
    },
    filterLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 8,
    },
    monthFilterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 4,
    },
    monthButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
    },
    monthButtonText: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    monthText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginHorizontal: 20,
      textTransform: 'capitalize',
    },
    statusFilterContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
      gap: 8,
    },
    statusFilterButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusFilterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    statusFilterText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    statusFilterTextActive: {
      color: colors.white,
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
      justifyContent: 'space-between',
      marginBottom: 8,
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
    },
    tagsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 1,
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
    inputText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
    },
    expenseCustomer: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 2,
    },
    customerSelector: {
      position: 'relative',
    },
    clearButton: {
      position: 'absolute',
      right: 12,
      top: 12,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    clearButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: 'bold',
    },
    customerSuggestions: {
      position: 'absolute',
      top: 50,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: 200,
      zIndex: 1000,
      elevation: 5,
    },
    customerSuggestion: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    customerSuggestionName: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 2,
    },
    customerSuggestionEmail: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },

    // Date Input
    dateInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dateInput: {
      flex: 1,
    },
    dateButton: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    dateButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.white,
    },

    // Report styles
    reportHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    reportTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    premiumButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    premiumButtonText: {
      color: colors.white,
      fontSize: 12,
      fontFamily: 'Inter-Medium',
    },
    monthSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 12,
    },
    selectorLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    monthInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      backgroundColor: colors.surface,
      minWidth: 100,
    },
    summaryContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    summaryCard: {
      flex: 1,
      padding: 12,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
    },
    filterContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    filterButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    filterButtonTextActive: {
      color: colors.white,
    },
    dataContainer: {
      marginBottom: 20,
    },
    dataTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 12,
    },
    transactionCard: {
      marginBottom: 8,
    },
    transactionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    transactionInfo: {
      flex: 1,
      marginRight: 12,
    },
    transactionDescription: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 4,
    },
    transactionDate: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 2,
    },
    transactionCustomer: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.primary,
    },
    transactionAmount: {
      alignItems: 'flex-end',
    },
    amountText: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      marginBottom: 2,
    },
    statusText: {
      fontSize: 10,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    emptyText: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      paddingVertical: 20,
    },
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

      {/* Filtro de Mês */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Mês de Referência:</Text>
        <View style={styles.monthFilterContainer}>
          <TouchableOpacity 
            style={styles.monthButton}
            onPress={() => {
              setSelectedMonth(addMonths(selectedMonth, -1));
            }}
          >
            <Text style={styles.monthButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </Text>
          <TouchableOpacity 
            style={styles.monthButton}
            onPress={() => {
              setSelectedMonth(addMonths(selectedMonth, 1));
            }}
          >
            <Text style={styles.monthButtonText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros de Status */}
      <View style={styles.statusFilterContainer}>
        <TouchableOpacity
          style={[
            styles.statusFilterButton,
            expenseStatusFilter === 'all' && styles.statusFilterButtonActive
          ]}
          onPress={() => setExpenseStatusFilter('all')}
        >
          <Text style={[
            styles.statusFilterText,
            expenseStatusFilter === 'all' && styles.statusFilterTextActive
          ]}>
            Todos ({expenseStats.count})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusFilterButton,
            expenseStatusFilter === 'paid' && styles.statusFilterButtonActive
          ]}
          onPress={() => setExpenseStatusFilter('paid')}
        >
          <Text style={[
            styles.statusFilterText,
            expenseStatusFilter === 'paid' && styles.statusFilterTextActive
          ]}>
            Pago ({filteredExpenses.filter(e => e.paid).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusFilterButton,
            expenseStatusFilter === 'pending' && styles.statusFilterButtonActive
          ]}
          onPress={() => setExpenseStatusFilter('pending')}
        >
          <Text style={[
            styles.statusFilterText,
            expenseStatusFilter === 'pending' && styles.statusFilterTextActive
          ]}>
            Pendente ({filteredExpenses.filter(e => !e.paid).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusFilterButton,
            expenseStatusFilter === 'overdue' && styles.statusFilterButtonActive
          ]}
          onPress={() => setExpenseStatusFilter('overdue')}
        >
          <Text style={[
            styles.statusFilterText,
            expenseStatusFilter === 'overdue' && styles.statusFilterTextActive
          ]}>
            Vencidas ({filteredExpenses.filter(e => {
              const today = new Date().toISOString().split('T')[0];
              return e.due_date && e.due_date < today && !e.paid;
            }).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
          <StatCard
          icon={<DollarSign size={20} color={colors.primary} />}
          value={`R$ ${expenseStats.total.toFixed(2)}`}
          label="Total do Mês"
        />
        <StatCard
          icon={<CheckCircle size={20} color={colors.success} />}
          value={`R$ ${expenseStats.paid.toFixed(2)}`}
          label="Pago"
          color={colors.success}
        />
        <StatCard
          icon={<XCircle size={20} color={colors.warning} />}
          value={`R$ ${expenseStats.pending.toFixed(2)}`}
          label="Pendente"
          color={colors.warning}
        />
        <StatCard
          icon={<Calendar size={20} color={colors.error} />}
          value={filteredExpenses.filter(e => {
            const today = new Date().toISOString().split('T')[0];
            return e.due_date && e.due_date < today && !e.paid;
          }).length}
          label="Vencidas"
          color={colors.error}
        />
      </View>

      {/* Expenses List */}
      <Text style={{ fontSize: 18, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 16 }}>
        Despesas do Mês
      </Text>

      {filteredExpenses.map((expense) => (
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
              <Text style={styles.expenseName} numberOfLines={2} ellipsizeMode="tail">
                {expense.name}
              </Text>
              {expense.customer_id && (
                <Text style={styles.expenseCustomer}>
                  Cliente: {customers.find(c => c.id === expense.customer_id)?.name || 'Cliente não encontrado'}
                </Text>
              )}
              <View style={styles.expenseDetails}>
                <Text style={styles.expenseAmount}>
                  R$ {expense.amount.toFixed(2)}
                </Text>
                <Text style={styles.expenseDate}>
                  Venc: {formatDateForDisplay(expense.due_date || null)}
                </Text>
              </View>
              <View style={styles.expenseTags}>
                <View style={styles.tagsContainer}>
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
            </View>

            <View style={styles.actions}>
             
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

  const ReportTab = () => {
    // Simplified version for testing
    const currentMonth = selectedMonth;
    const monthlyExpenses = useMemo(() => expenses.filter(expense => {
      const expenseMonth = expense.created_month || expense.created_at.slice(0, 7);
      return expenseMonth === currentMonth;
    }), [expenses, currentMonth]);
    const monthlySales = useMemo(() => sales.filter(sale => {
      const saleMonth = sale.created_at.slice(0, 7);
      return saleMonth === currentMonth;
    }), [sales, currentMonth]);

    const totalIncome = useMemo(() => monthlySales.reduce((sum, sale) => sum + sale.total, 0), [monthlySales]);
    const totalExpenses = useMemo(() => monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0), [monthlyExpenses]);
    const balance = totalIncome - totalExpenses;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>Relatórios Financeiros</Text>
          <TouchableOpacity
            style={styles.premiumButton}
            onPress={() => router.push('/relatorios')}
          >
            <Text style={styles.premiumButtonText}>Relatórios Premium</Text>
          </TouchableOpacity>
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <Text style={styles.selectorLabel}>Mês:</Text>
          <View style={styles.monthFilterContainer}>
            <TouchableOpacity 
              style={styles.monthButton}
              onPress={() => {
                setSelectedMonth(addMonths(selectedMonth, -1));
              }}
            >
              <Text style={styles.monthButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
            <TouchableOpacity 
              style={styles.monthButton}
              onPress={() => {
                setSelectedMonth(addMonths(selectedMonth, 1));
              }}
            >
              <Text style={styles.monthButtonText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Entradas</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              R$ {totalIncome.toFixed(2)}
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Saídas</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              R$ {totalExpenses.toFixed(2)}
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Saldo</Text>
            <Text style={[
              styles.summaryValue,
              { color: balance >= 0 ? colors.success : colors.error }
            ]}>
              R$ {balance.toFixed(2)}
            </Text>
          </Card>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, reportFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setReportFilter('all')}
          >
            <Text style={[styles.filterButtonText, reportFilter === 'all' && styles.filterButtonTextActive]}>
              Todos ({monthlyExpenses.length + monthlySales.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, reportFilter === 'income' && styles.filterButtonActive]}
            onPress={() => setReportFilter('income')}
          >
            <Text style={[styles.filterButtonText, reportFilter === 'income' && styles.filterButtonTextActive]}>
              Entradas ({monthlySales.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, reportFilter === 'expense' && styles.filterButtonActive]}
            onPress={() => setReportFilter('expense')}
          >
            <Text style={[styles.filterButtonText, reportFilter === 'expense' && styles.filterButtonTextActive]}>
              Saídas ({monthlyExpenses.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Financial Data List */}
        <View style={styles.dataContainer}>
          <Text style={styles.dataTitle}>
            Transações do Mês
          </Text>

          {/* Sales (Income) */}
          {reportFilter === 'all' || reportFilter === 'income' ? (
            monthlySales.map((sale) => (
              <Card key={`sale-${sale.id}`} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription} numberOfLines={1} ellipsizeMode="tail">Venda - {sale.customer_name}</Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(sale.created_at)} • Venda
                    </Text>
                      <Text style={styles.transactionCustomer} numberOfLines={1} ellipsizeMode="tail">Cliente: {sale.customer_name}</Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={[styles.amountText, { color: colors.success }]}>
                      +R$ {sale.total.toFixed(2)}
                    </Text>
                    <Text style={styles.statusText}>Pago</Text>
                  </View>
                </View>
              </Card>
            ))
          ) : null}

          {/* Expenses */}
          {reportFilter === 'all' || reportFilter === 'expense' ? (
            monthlyExpenses.map((expense) => (
              <Card key={`expense-${expense.id}`} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription} numberOfLines={1} ellipsizeMode="tail">{expense.name}</Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(expense.created_at)} • Despesa
                    </Text>
                    {expense.customer_id && (
                        <Text style={styles.transactionCustomer} numberOfLines={1} ellipsizeMode="tail">
                          Cliente: {customers.find(c => c.id === expense.customer_id)?.name || 'Cliente não encontrado'}
                        </Text>
                    )}
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={[styles.amountText, { color: colors.error }]}>
                      -R$ {expense.amount.toFixed(2)}
                    </Text>
                    <Text style={styles.statusText}>{expense.paid ? 'Pago' : 'Pendente'}</Text>
                  </View>
                </View>
              </Card>
            ))
          ) : null}

          {monthlyExpenses.length === 0 && monthlySales.length === 0 && (
            <Card>
              <Text style={styles.emptyText}>Nenhuma transação encontrada para este mês</Text>
            </Card>
          )}
        </View>
      </ScrollView>
    );
  };

  const ExpenseModal = () => (
    <>
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
                <Text style={styles.label}>Data de Vencimento (opcional)</Text>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    value={formData.due_date}
                    onChangeText={(text) => {
                      // Formatar automaticamente como DD/MM/YYYY
                      let formatted = text.replace(/\D/g, '');
                      if (formatted.length >= 2) {
                        formatted = formatted.substring(0, 2) + '/' + formatted.substring(2);
                      }
                      if (formatted.length >= 5) {
                        formatted = formatted.substring(0, 5) + '/' + formatted.substring(5, 9);
                      }
                      setFormData({ ...formData, due_date: formatted });
                    }}
                    placeholder="DD/MM/AAAA (ex: 25/12/2024)"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      const today = new Date();
                      const day = String(today.getDate()).padStart(2, '0');
                      const month = String(today.getMonth() + 1).padStart(2, '0');
                      const year = today.getFullYear();
                      setFormData({ ...formData, due_date: `${day}/${month}/${year}` });
                    }}
                  >
                    <Text style={styles.dateButtonText}>Hoje</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Cliente (opcional)</Text>
                <View style={styles.customerSelector}>
                  <TextInput
                    style={styles.input}
                    value={formData.customer_id ? (customers.find(c => c.id === formData.customer_id)?.name || '') : customerSearchQuery}
                    onChangeText={(text) => {
                      setCustomerSearchQuery(text);
                      if (!text) {
                        setFormData({ ...formData, customer_id: '' });
                      }
                    }}
                    placeholder="Digite o nome do cliente..."
                    placeholderTextColor={colors.textSecondary}
                  />
                  {formData.customer_id && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => {
                        setFormData({ ...formData, customer_id: '' });
                        setCustomerSearchQuery('');
                      }}
                    >
                      <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Customer Suggestions */}
                {customerSearchQuery && customerSearchQuery.length > 0 && (
                  <View style={styles.customerSuggestions}>
                    {customers
                      .filter(customer =>
                        customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((customer) => (
                        <TouchableOpacity
                          key={customer.id}
                          style={styles.customerSuggestion}
                          onPress={() => {
                            setFormData({ ...formData, customer_id: customer.id });
                            setCustomerSearchQuery('');
                          }}
                        >
                          <Text style={styles.customerSuggestionName}>{customer.name}</Text>
                          {customer.email && (
                            <Text style={styles.customerSuggestionEmail}>{customer.email}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                  </View>
                )}
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

    </>
  );

  return (
    <View style={styles.container}>
      <Header title="Finanças" showSettings />

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