
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  RefreshControl
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Box, 
  ShoppingCart, 
  ArrowRight,
  Download
} from 'lucide-react-native';
import db from '@/lib/db';
import { isPremium } from '@/lib/premium';
import { useRouter } from 'expo-router';
import { reportToPDF } from '@/lib/export';
import { generateDashboardHTML } from '@/lib/reports';

// --- Interfaces de Tipagem ---
interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
}

interface Sale {
  id: string;
  customer?: string;
  total: number;
  timestamp: string;
}

interface Expense {
  id: string;
  amount: number;
}

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

interface SaleItem {
  id: string;
  product_id: string;
  quantity: number;
  total: number;
}

interface ProductWithStats extends Product {
  total_sold: number;
  total_revenue: number;
}

interface CustomerWithStats extends Customer {
  total_purchases: number;
  total_spent: number;
}


export default function Dashboard() {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topProducts, setTopProducts] = useState<ProductWithStats[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [topClients, setTopClients] = useState<CustomerWithStats[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const [p, sales, expenses, customers, products, saleItems] = await Promise.all([
        isPremium(),
        db.all('sales') as Promise<Sale[]>,
        db.all('expenses') as Promise<Expense[]>,
        db.all('customers') as Promise<Customer[]>,
        db.all('products') as Promise<Product[]>,
        db.all('sale_items') as Promise<SaleItem[]>,
      ]);
      
      setPremium(p);

      const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      setStats({
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        totalSales: sales.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
      });

      // Top Products
      const productSales: { [key: string]: { total_sold: number; total_revenue: number } } = {};
      for (const item of saleItems) {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { total_sold: 0, total_revenue: 0 };
        }
        productSales[item.product_id].total_sold += item.quantity;
        productSales[item.product_id].total_revenue += item.total;
      }
      const topP: ProductWithStats[] = products
        .map(p => ({ ...p, ...productSales[p.id], total_sold: productSales[p.id]?.total_sold || 0, total_revenue: productSales[p.id]?.total_revenue || 0 }))
        .filter(p => p.total_sold > 0)
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5);
      setTopProducts(topP);

      // Recent Sales
      const recS = [...sales].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
      setRecentSales(recS);

      // Top Clients
      const clientPurchases: { [key: string]: { total_purchases: number; total_spent: number } } = {};
      for (const sale of sales) {
        if (!sale.customer) continue;
        if (!clientPurchases[sale.customer]) {
          clientPurchases[sale.customer] = { total_purchases: 0, total_spent: 0 };
        }
        clientPurchases[sale.customer].total_purchases++;
        clientPurchases[sale.customer].total_spent += sale.total;
      }
      const topC: CustomerWithStats[] = customers
        .map(c => ({ ...c, ...clientPurchases[c.name], total_purchases: clientPurchases[c.name]?.total_purchases || 0, total_spent: clientPurchases[c.name]?.total_spent || 0}))
        .filter(c => c.total_purchases > 0)
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 5);
      setTopClients(topC);

    } catch (error) {
      console.error("Error loading dashboard:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do dashboard.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    if (!premium) {
      Alert.alert("Recurso Premium", "A exportação de relatórios é uma funcionalidade exclusiva para assinantes Premium.");
      return;
    }
    try {
      const html = generateDashboardHTML({ 
        totalRevenue: stats?.totalRevenue ?? 0,
        totalExpenses: stats?.totalExpenses ?? 0,
        netIncome: stats?.netIncome ?? 0,
        topProducts, 
        recentSales, 
        topClients 
      });
      await reportToPDF(html);
    } catch (error) {
      console.error("Error exporting dashboard:", error);
      Alert.alert("Erro", "Não foi possível exportar o relatório.");
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
    },
    statGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    statCard: {
      width: '48%',
      marginBottom: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    statIcon: {
      marginRight: 12,
      backgroundColor: colors.primary + '20',
      padding: 8,
      borderRadius: 20,
    },
    statInfo: {
      flex: 1,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    listItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemLeft: {
      flex: 1,
    },
    itemName: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    itemSubtitle: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    itemRight: {
      alignItems: 'flex-end',
    },
    itemValue: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },
  });

  if (!stats) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Header title="Dashboard">
        <TouchableOpacity onPress={handleExport} disabled={!premium}>
          <Download size={24} color={premium ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      </Header>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} />}
      >
        {/* Stats Grid */}
        <View style={styles.statGrid}>
            <StatCard icon={<TrendingUp size={22} color={colors.primary} />} label="Receita Total" value={`R$ ${stats.totalRevenue.toFixed(2)}`} />
            <StatCard icon={<TrendingDown size={22} color={colors.primary} />} label="Despesas Totais" value={`R$ ${stats.totalExpenses.toFixed(2)}`} />
            <StatCard icon={<DollarSign size={22} color={colors.primary} />} label="Lucro Líquido" value={`R$ ${stats.netIncome.toFixed(2)}`} />
            <StatCard icon={<ShoppingCart size={22} color={colors.primary} />} label="Vendas" value={stats.totalSales.toString()} />
            <StatCard icon={<Users size={22} color={colors.primary} />} label="Clientes" value={stats.totalCustomers.toString()} />
            <StatCard icon={<Box size={22} color={colors.primary} />} label="Produtos" value={stats.totalProducts.toString()} />
        </View>

        {/* Top Products */}
        <Section title="Top Produtos" onSeeAll={() => router.push('/(tabs)/produtos')}>
          {topProducts.map(p => (
            <ListItem
              key={p.id}
              name={p.name}
              subtitle={`${p.total_sold} vendidos`}
              value={`R$ ${p.total_revenue.toFixed(2)}`}
            />
          ))}
        </Section>

        {/* Recent Sales */}
        <Section title="Vendas Recentes" onSeeAll={() => router.push('/(tabs)/vendas')}>
          {recentSales.map(s => (
            <ListItem
              key={s.id}
              name={s.customer || 'Venda Rápida'}
              subtitle={new Date(s.timestamp).toLocaleDateString('pt-BR')}
              value={`R$ ${s.total.toFixed(2)}`}
            />
          ))}
        </Section>

        {/* Top Clients */}
        <Section title="Top Clientes" onSeeAll={() => router.push('/(tabs)/clientes')}>
          {topClients.map(c => (
            <ListItem
              key={c.id}
              name={c.name}
              subtitle={`${c.total_purchases} compras`}
              value={`R$ ${c.total_spent.toFixed(2)}`}
            />
          ))}
        </Section>
      </ScrollView>
    </View>
  );

  function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
      <Card style={styles.statCard}>
        <View style={styles.statIcon}>{icon}</View>
        <View style={styles.statInfo}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
      </Card>
    );
  }

  function Section({ title, onSeeAll, children }: { title: string, onSeeAll: () => void, children: React.ReactNode }) {
    return (
      <Card style={{ marginBottom: 20 }}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity onPress={onSeeAll} style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={{color: colors.primary, fontFamily: 'Inter-Medium'}}>Ver todos</Text>
            <ArrowRight size={16} color={colors.primary} style={{marginLeft: 4}}/>
          </TouchableOpacity>
        </View>
        {children}
      </Card>
    );
  }

  function ListItem({ name, subtitle, value }: { name: string, subtitle: string, value: string }) {
    return (
      <View style={styles.listItem}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemName}>{name}</Text>
          <Text style={styles.itemSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemValue}>{value}</Text>
        </View>
      </View>
    );
  }
}
