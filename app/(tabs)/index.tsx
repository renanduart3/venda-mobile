import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  AlertTriangle,
  Download
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface DashboardStats {
  dailySales: number;
  dailyRevenue: number;
  lowStockCount: number;
  totalCustomers: number;
  monthlyExpenses: number;
  topProducts: Array<{ name: string; sales: number }>;
  peakHours: Array<{ hour: string; sales: number }>;
}

export default function Dashboard() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    dailySales: 0,
    dailyRevenue: 0,
    lowStockCount: 0,
    totalCustomers: 0,
    monthlyExpenses: 0,
    topProducts: [],
    peakHours: [],
  });

  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      // Load mock data for now - replace with actual data loading
      const mockStats: DashboardStats = {
        dailySales: 23,
        dailyRevenue: 1847.50,
        lowStockCount: 5,
        totalCustomers: 142,
        monthlyExpenses: 2300.00,
        topProducts: [
          { name: 'Coca-Cola 350ml', sales: 45 },
          { name: 'Pão de Açúcar', sales: 32 },
          { name: 'Leite Integral', sales: 28 },
        ],
        peakHours: [
          { hour: '08:00', sales: 12 },
          { hour: '12:00', sales: 18 },
          { hour: '18:00', sales: 15 },
        ],
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleRelatoriosPress = () => {
    console.log('Navegando para relatórios...');
    router.push('/relatorios');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    periodSelector: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
    },
    periodButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    periodButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    periodButtonTextActive: {
      color: colors.white,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20,
      gap: 12,
    },
    statCard: {
      width: (width - 52) / 2,
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
      backgroundColor: colors.primaryLight + '20',
    },
    statValue: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    alertCard: {
      margin: 20,
      backgroundColor: colors.warning + '10',
      borderColor: colors.warning,
    },
    alertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    alertTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.warning,
    },
    alertText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },
    section: {
      marginHorizontal: 20,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 12,
    },
    topProductItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    productName: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      flex: 1,
    },
    productSales: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },
    exportButton: {
      margin: 20,
      marginTop: 0,
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
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header title="Dashboard" showSettings />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['today', 'week', 'month'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period === 'today' ? 'Hoje' : period === 'week' ? 'Semana' : 'Mês'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={<TrendingUp size={20} color={colors.primary} />}
            value={stats.dailySales}
            label="Vendas Hoje"
          />
          <StatCard
            icon={<DollarSign size={20} color={colors.success} />}
            value={`R$ ${stats.dailyRevenue.toFixed(2)}`}
            label="Faturamento"
            color={colors.success}
          />
          <StatCard
            icon={<Package size={20} color={colors.warning} />}
            value={stats.lowStockCount}
            label="Estoque Baixo"
            color={colors.warning}
          />
          <StatCard
            icon={<Users size={20} color={colors.secondary} />}
            value={stats.totalCustomers}
            label="Clientes"
            color={colors.secondary}
          />
        </View>

        {/* Low Stock Alert */}
        {stats.lowStockCount > 0 && (
          <Card style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <AlertTriangle size={20} color={colors.warning} />
              <Text style={styles.alertTitle}>Atenção: Estoque Baixo</Text>
            </View>
            <Text style={styles.alertText}>
              {stats.lowStockCount} produtos com estoque abaixo do mínimo
            </Text>
          </Card>
        )}

        {/* Top Products */}
        <View style={styles.section}>
          <Card>
            <Text style={styles.sectionTitle}>Produtos Mais Vendidos</Text>
            {stats.topProducts.map((product, index) => (
              <View key={index} style={styles.topProductItem}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productSales}>{product.sales}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Relatórios Button */}
        <Button
          title="Relatórios"
          onPress={handleRelatoriosPress}
          style={styles.exportButton}
          variant="outline"
        />
      </ScrollView>
    </View>
  );
}