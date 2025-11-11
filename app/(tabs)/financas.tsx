import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Platform,
  Pressable,
  ActivityIndicator
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
  Filter,
  List,
  Crown
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { router } from 'expo-router';
import db from '@/lib/db';
import { isPremium } from '@/lib/premium';
import { formatBrDate, normalizeToBrDate, parseBrDate } from '@/lib/utils';

interface Expense {
  id: string;
  name: string;
  amount: number;
  due_date?: string | null;
  paid: boolean;
  recurring: boolean;
  customer_id?: string | null;
  created_month?: string; // Mês de cadastro (YYYY-MM)
  created_at: string;
  updated_at: string;
  paid_at?: string | null;
}

export default function Financas() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'new' | 'report'>('new');
  const [userIsPremium, setUserIsPremium] = useState(false);
  const [saleDetailsVisible, setSaleDetailsVisible] = useState(false);
  const [saleDetailLoading, setSaleDetailLoading] = useState(false);
  const [saleDetailItems, setSaleDetailItems] = useState<any[]>([]);
  const [saleDetailSale, setSaleDetailSale] = useState<any | null>(null);
  const saleDetailsFetchRef = useRef(false);
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

  // Render month label without Date parsing to avoid UTC/local shifts (e.g., 'YYYY-MM-01' parsing).
  const getMonthLabel = (ym: string) => {
    const [year, month] = ym.split('-');
    const names = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const idx = Number.isFinite(Number(month)) ? Math.max(0, Math.min(11, parseInt(month, 10) - 1)) : 0;
    return `${names[idx]} de ${year}`;
  };
  const [expenseStatusFilter, setExpenseStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Funções de filtro: gerar chave AAAA-MM sem instanciar Date (evita bugs de fuso/ISO)
  const toMonthKey = (dateString?: string | null): string | null => {
    if (!dateString) return null;
    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [dd, mm, yyyy] = dateString.split('/');
      return `${yyyy}-${mm}`;
    }
    // DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [dd, mm, yyyy] = dateString.split('-');
      return `${yyyy}-${mm}`;
    }
    // YYYY-MM-DD ou ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      return dateString.slice(0, 7);
    }
    return null;
  };

  // Validação forte de data BR (DD/MM/YYYY)
  const validateDueDate = (value: string): { ok: boolean; message?: string; normalized?: string } => {
    if (!value) return { ok: true, normalized: '' };
    const cleaned = value.trim();
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) return { ok: false, message: 'Formato inválido. Use DD/MM/AAAA.' };
    const [ddStr, mmStr, yyyyStr] = cleaned.split('/');
    const dd = Number(ddStr); const mm = Number(mmStr); const yyyy = Number(yyyyStr);
    if (mm < 1 || mm > 12) return { ok: false, message: 'Mês inválido.' };
    if (dd < 1 || dd > 31) return { ok: false, message: 'Dia inválido.' };
    const thirty = new Set([4,6,9,11]);
    if (thirty.has(mm) && dd > 30) return { ok: false, message: 'Dia inválido para o mês.' };
    const isLeap = (yyyy % 4 === 0 && yyyy % 100 !== 0) || (yyyy % 400 === 0);
    if (mm === 2 && dd > (isLeap ? 29 : 28)) return { ok: false, message: 'Dia inválido para fevereiro.' };
    const currentYear = new Date().getFullYear();
    const MIN_YEAR = currentYear - 1; // permite até 1 ano no passado
    const MAX_YEAR = currentYear + 2; // até 2 anos no futuro
    if (yyyy < MIN_YEAR) return { ok: false, message: `Ano muito antigo (mínimo ${MIN_YEAR}).` };
    if (yyyy > MAX_YEAR) return { ok: false, message: `Ano muito futuro (máximo ${MAX_YEAR}).` };
    return { ok: true, normalized: cleaned };
  };

  // Helper: check if an expense is overdue (based on full date parsing)
  const isOverdue = (expense: Expense) => {
    if (expense.paid || !expense.due_date) return false;
    const dueDate = parseBrDate(expense.due_date as any);
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Regra de vigência: usa due_date se presente; caso contrário, usa created_at
      const keyDue = toMonthKey(expense.due_date);
      const keyCreated = toMonthKey(expense.created_at);
      const monthKey = keyDue || keyCreated;

      // DEBUG: Log para verificar filtro mensal
      console.log('🔍 Filtrando despesa:', {
        name: expense.name,
        due_date: expense.due_date || '(vazio)',
        created_at: expense.created_at,
        monthKey_due: keyDue,
        monthKey_created: keyCreated,
        monthKey,
        selectedMonth,
        match: monthKey === selectedMonth
      });

      if (monthKey !== selectedMonth) return false;

      // Filtro por status
      const overdue = isOverdue(expense);

      switch (expenseStatusFilter) {
        case 'pending':
          return !expense.paid && !overdue;
        case 'paid':
          return expense.paid;
        case 'overdue':
          return overdue;
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
    (async () => {
      try {
        const premium = await isPremium();
        console.log('✨ Premium status inicial:', premium);
        setUserIsPremium(premium);
      } catch (e) {
        console.warn('Erro ao verificar premium:', e);
      }
    })();
  }, []);

  // Recarrega dados ao focar a aba, garantindo estado atualizado (ex.: marcar paga no detalhe do cliente)
  useFocusEffect(
    React.useCallback(() => {
      loadExpenses();
      loadSales();
      loadCustomers();
      // Recarrega status premium ao voltar para a tela
      (async () => {
        try {
          const premium = await isPremium();
          console.log('🔄 Premium status recarregado:', premium);
          setUserIsPremium(premium);
        } catch (e) {
          console.warn('Erro ao verificar premium:', e);
        }
      })();
    }, [])
  );

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
      const todayBr = formatBrDate(now);

      const amountValue = parseFloat(formData.amount.replace(',', '.'));
      if (Number.isNaN(amountValue)) {
        Alert.alert('Erro', 'Informe um valor válido.');
        return;
      }

      // Regra: se usuário deixar em branco, due_date fica string vazia (vigência = created_at)
      // Se preencher, validar e usar data digitada.
      const rawInput = formData.due_date?.trim();
      let dueDateValue = '';
      if (rawInput) {
        const valid = validateDueDate(rawInput);
        if (!valid.ok) {
          Alert.alert('Data inválida', valid.message || 'Verifique a data.');
          return;
        }
        dueDateValue = valid.normalized || '';
      }

      console.log('📅 Salvando despesa:', {
        input: formData.due_date,
        due_date_final: dueDateValue,
        created_at: todayBr,
        monthKey_due: dueDateValue ? toMonthKey(dueDateValue) : null,
        monthKey_created: toMonthKey(todayBr),
        selectedMonth
      });

      const expensePayload = {
        name: formData.name.trim(),
        amount: amountValue,
  due_date: dueDateValue, // pode ser '' se não informado
        paid: formData.paid,
        recurring: formData.recurring,
        customer_id: formData.customer_id || null,
        updated_at: todayBr,
        paid_at: formData.paid ? todayBr : null,
      };      if (editingExpense) {
        await db.update('expenses', expensePayload, 'id = ?', [editingExpense.id]);
      } else {
        const id = Date.now().toString();
        await db.insert('expenses', {
          id,
          ...expensePayload,
          created_at: todayBr, // sempre hoje (DD/MM/YYYY)
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
  const updatedAt = formatBrDate(new Date());
      await db.update(
        'expenses',
        { paid: !expense.paid, updated_at: updatedAt, paid_at: !expense.paid ? updatedAt : null },
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

  // Robust date formatting: supports ISO and DD/MM/YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Try DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [dd, mm, yyyy] = dateString.split('/').map(Number);
      const parsed = new Date(yyyy, (mm || 1) - 1, dd || 1);
      if (!isNaN(parsed.getTime())) return parsed.toLocaleDateString('pt-BR');
      return 'Data inválida';
    }
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
    return 'Data inválida';
  };

  const formatDateForDisplay = (dateString: string | null) => {
    if (!dateString) return '';
    return formatDate(dateString);
  };

  const formatCurrency = (n: number) => {
    try { return Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } catch { return String(n); }
  };

  // --- Premium Sale Details ---
  const openSaleDetails = async (sale: any) => {
    console.log('🔍 openSaleDetails chamado:', { userIsPremium, fetchInProgress: saleDetailsFetchRef.current, saleId: sale.id });
    if (!userIsPremium || saleDetailsFetchRef.current) {
      console.log('❌ Retornando: premium =', userIsPremium, 'fetchInProgress =', saleDetailsFetchRef.current);
      return;
    }
    console.log('✅ Abrindo modal de detalhes');
    saleDetailsFetchRef.current = true;
    setSaleDetailSale(sale);
    setSaleDetailItems([]);
    setSaleDetailLoading(true);
    setSaleDetailsVisible(true);
    try {
      // Recupera itens da venda com nome do produto
      const rows: any = await db.query(`
        SELECT 
          si.id, 
          si.product_id, 
          si.quantity, 
          si.unit_price, 
          (si.quantity * si.unit_price) AS total_item,
          p.name AS product_name
        FROM sale_items si
        LEFT JOIN products p ON p.id = si.product_id
        WHERE si.sale_id = ?;
      `, [sale.id]);
      const arr: any[] = rows || [];
      console.log('📦 Itens carregados:', arr.length, 'itens:', arr);
      setSaleDetailItems(arr);
    } catch (e) {
      console.warn('Falha ao carregar itens da venda', e);
    } finally {
      saleDetailsFetchRef.current = false;
      setSaleDetailLoading(false);
    }
  };
  const closeSaleDetails = () => {
    console.log('🔒 Fechando modal de detalhes');
    setSaleDetailsVisible(false);
    setSaleDetailSale(null);
    setSaleDetailItems([]);
  };
  

  // Report functions
  const monthSales = useMemo(() => {
    return sales.filter(sale => {
      const saleMonth = toMonthKey(sale.created_at) || '';
      return saleMonth === selectedMonth;
    });
  }, [sales, selectedMonth]);

  const monthExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const monthKey = toMonthKey(expense.due_date) || '';
      return monthKey === selectedMonth;
    });
  }, [expenses, selectedMonth]);

  // Payments received for customer-linked expenses in the selected month
  const monthReceipts = useMemo(() => {
    return expenses.filter(exp => {
      if (!exp.paid || !exp.customer_id) return false;
      const paidMonth = toMonthKey(exp.paid_at || undefined);
      return paidMonth === selectedMonth;
    });
  }, [expenses, selectedMonth]);

  const financialData = useMemo(() => {
    const currentMonth = selectedMonth;
    const monthlyExpenses = monthExpenses;
    const monthlySales = monthSales;
    const combined = [
      ...monthlyExpenses.map(expense => ({
        id: `expense-${expense.id}`,
        type: 'expense' as const,
        description: expense.name,
        amount: -expense.amount,
        date: expense.due_date || expense.created_at, // usar due_date para exibição
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
    const receiptsIncome = monthReceipts.reduce((sum, r) => sum + r.amount, 0);
    const totalIncome = monthSales.reduce((sum, sale) => sum + sale.total, 0) + receiptsIncome;
    const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const balance = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, balance, transactionCount: financialData.length };
  }, [monthSales, monthExpenses, monthReceipts, financialData.length]);

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
      overflow: 'hidden',
    },
    expenseAmount: {
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    expenseDate: {
      fontSize: 11,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      maxWidth: '55%',
      textAlign: 'right',
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
      borderColor: colors.inputBorder,
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
    reportFilterContainer: {
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
    detailsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#4A9EFF',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      marginTop: 4,
    },
    detailsButtonText: {
      color: colors.white,
      fontSize: 12,
      fontFamily: 'Inter-Medium'
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
    // Modal Detalhes Venda
    detailModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    detailModalBox: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      maxHeight: '70%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailModalTitle: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 10,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailName: {
      fontSize: 13,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    detailSub: {
      fontSize: 11,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 2,
    },
    detailTotal: {
      fontSize: 13,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      minWidth: 80,
      textAlign: 'right',
    },
    detailEmpty: {
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginVertical: 12,
    },
    detailActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 12,
    },
    detailCloseBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
    },
    detailCloseText: {
      color: colors.white,
      fontSize: 14,
      fontFamily: 'Inter-Medium',
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
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
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
              {
                const next = addMonths(selectedMonth, -1);
                console.log('🗓 Navegação mês:', { from: selectedMonth, to: next, direction: 'prev' });
                setSelectedMonth(next);
              }
            }}
          >
            <Text style={styles.monthButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {getMonthLabel(selectedMonth)}
          </Text>
          <TouchableOpacity 
            style={styles.monthButton}
            onPress={() => {
              {
                const next = addMonths(selectedMonth, 1);
                console.log('🗓 Navegação mês:', { from: selectedMonth, to: next, direction: 'next' });
                setSelectedMonth(next);
              }
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
              const due = parseBrDate(e.due_date || '');
              if (!due || e.paid) return false;
              const today = new Date(); today.setHours(0,0,0,0);
              return due < today;
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
            const due = parseBrDate(e.due_date || '');
            if (!due || e.paid) return false;
            const today = new Date(); today.setHours(0,0,0,0);
            return due < today;
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
                {!!expense.due_date && (
                  <Text style={styles.expenseDate}>
                    Venc: {formatDateForDisplay(expense.due_date)}
                  </Text>
                )}
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

  const ExpenseModal = () => (
    <>
      <Modal visible={showExpenseModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
      {activeTab === 'new' ? (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
                  {
                    const next = addMonths(selectedMonth, -1);
                    console.log('🗓 Navegação mês:', { from: selectedMonth, to: next, direction: 'prev' });
                    setSelectedMonth(next);
                  }
                }}
              >
                <Text style={styles.monthButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {getMonthLabel(selectedMonth)}
              </Text>
              <TouchableOpacity 
                style={styles.monthButton}
                onPress={() => {
                  {
                    const next = addMonths(selectedMonth, 1);
                    console.log('🗓 Navegação mês:', { from: selectedMonth, to: next, direction: 'next' });
                    setSelectedMonth(next);
                  }
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
            <TouchableOpacity key={expense.id} activeOpacity={0.8} onPress={() => openExpenseModal(expense)}>
              <Card style={styles.expenseCard}>
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
                    {!!expense.due_date && (
                      <Text style={styles.expenseDate} numberOfLines={1} ellipsizeMode="tail">
                        Venc: {formatDateForDisplay(expense.due_date)}
                      </Text>
                    )}
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
                    onPress={(e) => { e.stopPropagation?.(); deleteExpense(expense); }}
                  >
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
                  {
                    const next = addMonths(selectedMonth, -1);
                    console.log('🗓 Navegação mês:', { from: selectedMonth, to: next, direction: 'prev' });
                    setSelectedMonth(next);
                  }
                }}
              >
                <Text style={styles.monthButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {getMonthLabel(selectedMonth)}
              </Text>
              <TouchableOpacity 
                style={styles.monthButton}
                onPress={() => {
                  {
                    const next = addMonths(selectedMonth, 1);
                    console.log('🗓 Navegação mês:', { from: selectedMonth, to: next, direction: 'next' });
                    setSelectedMonth(next);
                  }
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
                R$ {(monthSales.reduce((s: number, sale: any) => s + sale.total, 0) + monthReceipts.reduce((s: number, r: any) => s + r.amount, 0)).toFixed(2)}
              </Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Saídas</Text>
              <Text style={[styles.summaryValue, { color: colors.error }]}>
                R$ {monthExpenses.reduce((s: number, e: any) => s + e.amount, 0).toFixed(2)}
              </Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Saldo</Text>
              <Text style={[
                styles.summaryValue,
                { color: (monthSales.reduce((s: number, sale: any) => s + sale.total, 0) - monthExpenses.reduce((s: number, e: any) => s + e.amount, 0)) >= 0 ? colors.success : colors.error }
              ]}>
                R$ {(monthSales.reduce((s: number, sale: any) => s + sale.total, 0) - monthExpenses.reduce((s: number, e: any) => s + e.amount, 0)).toFixed(2)}
              </Text>
            </Card>
          </View>

          {/* Filter Buttons */}
          <View style={styles.reportFilterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, reportFilter === 'all' && styles.filterButtonActive]}
              onPress={() => setReportFilter('all')}
            >
              <Text style={[styles.filterButtonText, reportFilter === 'all' && styles.filterButtonTextActive]}>
                Todos ({monthExpenses.length + monthSales.length + monthReceipts.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, reportFilter === 'income' && styles.filterButtonActive]}
              onPress={() => setReportFilter('income')}
            >
              <Text style={[styles.filterButtonText, reportFilter === 'income' && styles.filterButtonTextActive]}>
                Entradas ({monthSales.length + monthReceipts.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, reportFilter === 'expense' && styles.filterButtonActive]}
              onPress={() => setReportFilter('expense')}
            >
              <Text style={[styles.filterButtonText, reportFilter === 'expense' && styles.filterButtonTextActive]}>
                Saídas ({monthExpenses.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Financial Data List */}
          <View style={styles.dataContainer}>
            <Text style={styles.dataTitle}>
              Transações do Mês
            </Text>

            {(reportFilter === 'all' || reportFilter === 'income') && (
              <>
                {monthSales.map((sale: any) => (
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
                      {userIsPremium ? (
                        <Pressable style={styles.detailsButton} onPress={() => openSaleDetails(sale)}>
                          <List size={14} color={colors.white} />
                          <Text style={styles.detailsButtonText}>Detalhes</Text>
                        </Pressable>
                      ) : (
                        <Pressable style={styles.detailsButton} onPress={() => router.push('/planos')}>
                          <Crown size={14} color={colors.white} />
                          <Text style={styles.detailsButtonText}>Detalhes</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Card>
                ))}
                {monthReceipts.map((rec: any) => (
                  <Card key={`receipt-${rec.id}`} style={styles.transactionCard}>
                    <View style={styles.transactionHeader}>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionDescription} numberOfLines={1} ellipsizeMode="tail">Recebimento - {customers.find(c => c.id === rec.customer_id)?.name || 'Cliente'}</Text>
                        <Text style={styles.transactionDate}>
                          {formatDate(rec.paid_at)} • Recebimento
                        </Text>
                      </View>
                      <View style={styles.transactionAmount}>
                        <Text style={[styles.amountText, { color: colors.success }]}>+R$ {rec.amount.toFixed(2)}</Text>
                        <Text style={styles.statusText}>Pago</Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            )}

            {(reportFilter === 'all' || reportFilter === 'expense') && (
              monthExpenses.map((expense: any) => (
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
            )}

            {monthExpenses.length === 0 && monthSales.length === 0 && (
              <Card>
                <Text style={styles.emptyText}>Nenhuma transação encontrada para este mês</Text>
              </Card>
            )}
          </View>
        </ScrollView>
      )}

      {showExpenseModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
      )}

      {/* Modal Detalhes Venda (Premium) */}
      <Modal visible={saleDetailsVisible} transparent animationType="fade" onRequestClose={closeSaleDetails}>
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalBox}>
            <Text style={styles.detailModalTitle}>Itens da Venda #{saleDetailSale?.id}</Text>
            {saleDetailLoading && (
              <View style={{ alignItems: 'center', marginVertical: 12 }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: 6, fontSize: 13 }}>Carregando itens...</Text>
              </View>
            )}
            {!saleDetailLoading && saleDetailItems.length === 0 && (
              <Text style={styles.detailEmpty}>Nenhum item encontrado.</Text>
            )}
            {!saleDetailLoading && saleDetailItems.length > 0 && (
              <ScrollView style={{ marginTop: 8, marginBottom: 12 }} showsVerticalScrollIndicator={true}>
                {saleDetailItems.map(it => (
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
              <TouchableOpacity style={styles.detailCloseBtn} onPress={closeSaleDetails}>
                <Text style={styles.detailCloseText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
