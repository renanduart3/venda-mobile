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
  Download
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

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
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState<DashboardStats>({
    dailySales: 0,
    dailyRevenue: 0,
    lowStockCount: 0,
    totalCustomers: 0,
    monthlyExpenses: 0,
    topProducts: [],
    peakHours: [],
  });


  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load data for current month
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      // Check if mocks are enabled
      const { USE_MOCKS, mockDashboardStats } = await import('@/lib/mocks');
      
      if (USE_MOCKS) {
        // Load mock data from centralized file
        setStats(mockDashboardStats);
      } else {
        // Load real data from database
        // TODO: Implement real data loading
        setStats({
          dailySales: 0,
          dailyRevenue: 0,
          lowStockCount: 0,
          totalCustomers: 0,
          monthlyExpenses: 0,
          topProducts: [],
          peakHours: [],
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  // Função removida - não criamos notificações quando não há dados mockados

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
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20,
      marginBottom: 20,
      marginTop: 10,
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

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={<TrendingUp size={20} color={colors.primary} />}
            value={stats.dailySales}
            label="Vendas do Mês"
          />
          <StatCard
            icon={<DollarSign size={20} color={colors.success} />}
            value={`R$ ${stats.dailyRevenue.toFixed(2)}`}
            label="Faturamento do Mês"
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


        {/* Top Products */}
        <View style={styles.section}>
          <Card>
            <Text style={styles.sectionTitle}>Produtos Mais Vendidos</Text>
            {stats.topProducts.map((product, index) => (
              <View key={index} style={styles.topProductItem}>
                <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">{product.name}</Text>
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