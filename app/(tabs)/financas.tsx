import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Pressable} from 'react-native';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { router } from 'expo-router';
import SaleDetailsModal from '@/components/SaleDetailsModal';
import { formatBrDate } from '@/lib/utils';
import { isPremium } from '@/lib/premium';
import db from '@/lib/db';
import { createFinancasStyles } from './Financas.styles';
import {
  Plus,
  Calendar,
  Edit,
  Trash2,
  DollarSign,
  CheckCircle,
  XCircle,
  RotateCcw,
  List,
  Crown,
} from 'lucide-react-native';

export default function Financas() {
  // Report filters
  const [reportFilter, setReportFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

// Premium state
const [userIsPremium, setUserIsPremium] = useState(false);
// Customers, Expenses, Sales state
const [customers, setCustomers] = useState<any[]>([]);
const [expenses, setExpenses] = useState<any[]>([]);
const [sales, setSales] = useState<any[]>([]);
// Editing expense modal state
const [editingExpense, setEditingExpense] = useState<any>(null);
const [showExpenseModal, setShowExpenseModal] = useState(false);
// Month selection
const [selectedMonth, setSelectedMonth] = useState<string>('');
// Theme colors
const { colors } = useTheme();
const styles = createFinancasStyles(colors);
  
// Sale details modal state
const [saleDetailsVisible, setSaleDetailsVisible] = useState(false);
const [saleDetailSale, setSaleDetailSale] = useState<any>(null);
const [saleDetailItems, setSaleDetailItems] = useState<any[]>([]);
const [saleDetailLoading, setSaleDetailLoading] = useState(false);
const saleDetailsFetchRef = useRef(false);

// Expense filter state
const [expenseStatusFilter, setExpenseStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');

// Customer search state
const [customerSearchQuery, setCustomerSearchQuery] = useState('');

// Active tab state
const [activeTab, setActiveTab] = useState<'new' | 'report'>('new');

// Utility functions
const toMonthKey = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  // Supports DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [dd, mm, yyyy] = dateStr.split('/');
    return `${yyyy}-${mm}`;
  }
  // Supports ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.slice(0, 7);
  }
  return '';
};

const parseBrDate = (str: string): Date | null => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return null;
  const [dd, mm, yyyy] = str.split('/').map(Number);
  const d = new Date(yyyy, (mm||1)-1, dd||1);
  return isNaN(d.getTime()) ? null : d;
};

const isOverdue = (expense: any): boolean => {
  if (expense.paid) return false;
  if (!expense.due_date) return false;
  const due = parseBrDate(expense.due_date);
  if (!due) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return due < now;
};

const validateDueDate = (input: string): { ok: boolean; message?: string; normalized?: string } => {
  if (!input) return { ok: true, normalized: '' };
  // Validate DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
    const [dd, mm, yyyy] = input.split('/').map(Number);
    if (mm < 1 || mm > 12) return { ok: false, message: 'Mês inválido' };
    if (dd < 1 || dd > 31) return { ok: false, message: 'Dia inválido' };
    if (yyyy < 1900 || yyyy > 2100) return { ok: false, message: 'Ano inválido' };
    return { ok: true, normalized: input };
  }
  return { ok: false, message: 'Use o formato DD/MM/AAAA' };
};

const getMonthLabel = (monthKey: string): string => {
  if (!monthKey) return 'Selecione um mês';
  const [year, month] = monthKey.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthIndex = parseInt(month, 10) - 1;
  return `${months[monthIndex]} ${year}`;
};

const addMonths = (monthKey: string, delta: number): string => {
  if (!monthKey) {
    const now = new Date();
    monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// Computed expense stats
const expenseStats = useMemo(() => {
  const monthKey = selectedMonth;
  const monthExpenses = expenses.filter(expense => {
    const expMonthKey = toMonthKey(expense.due_date) || '';
    return expMonthKey === monthKey;
  });
  const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const paid = monthExpenses.filter(exp => exp.paid).reduce((sum, exp) => sum + exp.amount, 0);
  const pending = total - paid;
  const count = monthExpenses.length;
  const paidCount = monthExpenses.filter(exp => exp.paid).length;
  const unpaidCount = count - paidCount;
  return { total, paid, pending, count, paidCount, unpaidCount };
}, [expenses, selectedMonth]);

// Filtered expenses based on status filter
const filteredExpenses = useMemo(() => {
  const monthKey = selectedMonth;
  const monthExpenses = expenses.filter(expense => {
    const expMonthKey = toMonthKey(expense.due_date) || '';
    return expMonthKey === monthKey;
  });
  if (expenseStatusFilter === 'all') return monthExpenses;
  if (expenseStatusFilter === 'paid') return monthExpenses.filter(exp => exp.paid);
  if (expenseStatusFilter === 'unpaid') return monthExpenses.filter(exp => !exp.paid);
  if (expenseStatusFilter === 'overdue') {
    return monthExpenses.filter(exp => !exp.paid && exp.due_date && new Date(exp.due_date) < new Date());
  }
  return monthExpenses;
}, [expenses, selectedMonth, expenseStatusFilter]);

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

  const openExpenseModal = (expense?: any) => {
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

  const deleteExpense = (expense: any) => {
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

  const togglePaidStatus = async (expense: any) => {
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
            expenseStatusFilter === 'unpaid' && styles.statusFilterButtonActive
          ]}
          onPress={() => setExpenseStatusFilter('unpaid')}
        >
          <Text style={[
            styles.statusFilterText,
            expenseStatusFilter === 'unpaid' && styles.statusFilterTextActive
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
                expenseStatusFilter === 'unpaid' && styles.statusFilterButtonActive
              ]}
              onPress={() => setExpenseStatusFilter('unpaid')}
            >
              <Text style={[
                styles.statusFilterText,
                expenseStatusFilter === 'unpaid' && styles.statusFilterTextActive
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

      {/* Modal de Despesa */}
      {React.createElement(ExpenseModal as any, {
        visible: showExpenseModal,
        onClose: closeExpenseModal,
        onSave: saveExpense,
        formData: formData,
        setFormData: setFormData,
        customers: customers,
        customerSearchQuery: customerSearchQuery,
        setCustomerSearchQuery: setCustomerSearchQuery,
        editingExpense: editingExpense,
        styles: styles,
        colors: colors,
      })}

      {/* Modal Detalhes Venda (Premium) */}
      <SaleDetailsModal
        visible={saleDetailsVisible}
        onClose={closeSaleDetails}
        sale={saleDetailSale}
        items={saleDetailItems}
        loading={saleDetailLoading}
        styles={styles}
        colors={colors}
        formatCurrency={formatCurrency}
      />
    </View>
  );
}
