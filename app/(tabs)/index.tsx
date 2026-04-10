import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  TrendingUp,
  DollarSign,
  Package,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { router } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface DashboardStats {
  dailySales: number;
  dailyRevenue: number;
  monthlyGrossRevenue: number;
  monthlyDiscounts: number;
  monthlyCogs: number;
  todayRevenue: number;
  todayProfit: number;
  todayDiscounts: number;
  todayGrossRevenue: number;
  todayCogs: number;
  todayMarginPct: number;
  todayDiscountPct: number;
  revenueChangePct: number;
  profitChangePct: number;
  discountChangePct: number;
  last7Days: { label: string; revenue: number; profit: number }[];
  lowStockCount: number;
  totalCustomers: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  topProducts: { name: string; sales: number }[];
  peakHours: { hour: string; sales: number }[];
}

export default function Dashboard() {
  const { colors } = useTheme();
  const [valuesVisible, setValuesVisible] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    dailySales: 0,
    dailyRevenue: 0,
    monthlyGrossRevenue: 0,
    monthlyDiscounts: 0,
    monthlyCogs: 0,
    todayRevenue: 0,
    todayProfit: 0,
    todayDiscounts: 0,
    todayGrossRevenue: 0,
    todayCogs: 0,
    todayMarginPct: 0,
    todayDiscountPct: 0,
    revenueChangePct: 0,
    profitChangePct: 0,
    discountChangePct: 0,
    last7Days: [],
    lowStockCount: 0,
    totalCustomers: 0,
    monthlyExpenses: 0,
    monthlyProfit: 0,
    topProducts: [],
    peakHours: [],
  });


  useEffect(() => {
    loadDashboardData();
  }, []);

  // Recarrega ao focar a aba (voltar do fluxo de venda)
  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      const { loadDashboardStats } = await import('@/lib/data-loader');
      const data = await loadDashboardStats();
      setStats({
        dailySales: data.dailySales ?? 0,
        dailyRevenue: data.dailyRevenue ?? 0,
        monthlyGrossRevenue: data.monthlyGrossRevenue ?? 0,
        monthlyDiscounts: data.monthlyDiscounts ?? 0,
        monthlyCogs: data.monthlyCogs ?? 0,
        todayRevenue: data.todayRevenue ?? 0,
        todayProfit: data.todayProfit ?? 0,
        todayDiscounts: data.todayDiscounts ?? 0,
        todayGrossRevenue: data.todayGrossRevenue ?? 0,
        todayCogs: data.todayCogs ?? 0,
        todayMarginPct: data.todayMarginPct ?? 0,
        todayDiscountPct: data.todayDiscountPct ?? 0,
        revenueChangePct: data.revenueChangePct ?? 0,
        profitChangePct: data.profitChangePct ?? 0,
        discountChangePct: data.discountChangePct ?? 0,
        last7Days: (data.last7Days || []) as { label: string; revenue: number; profit: number }[],
        lowStockCount: data.lowStockCount ?? 0,
        totalCustomers: data.totalCustomers ?? 0,
        monthlyExpenses: data.monthlyExpenses ?? 0,
        monthlyProfit: data.monthlyProfit ?? 0,
        topProducts: (data.topProducts || []) as { name: string; sales: number }[],
        peakHours: (data.peakHours || []) as { hour: string; sales: number }[],
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStats({
        dailySales: 0,
        dailyRevenue: 0,
        monthlyGrossRevenue: 0,
        monthlyDiscounts: 0,
        monthlyCogs: 0,
        todayRevenue: 0,
        todayProfit: 0,
        todayDiscounts: 0,
        todayGrossRevenue: 0,
        todayCogs: 0,
        todayMarginPct: 0,
        todayDiscountPct: 0,
        revenueChangePct: 0,
        profitChangePct: 0,
        discountChangePct: 0,
        last7Days: [],
        lowStockCount: 0,
        totalCustomers: 0,
        monthlyExpenses: 0,
        monthlyProfit: 0,
        topProducts: [],
        peakHours: [],
      });
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
    kpiSection: {
      paddingHorizontal: 20,
      marginTop: 10,
      marginBottom: 20,
      gap: 12,
    },
    kpiCard: {
      borderLeftWidth: 4,
    },
    kpiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    kpiIcon: {
      padding: 8,
      borderRadius: 10,
    },
    kpiTitle: {
      fontSize: 13,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginBottom: 2,
    },
    kpiValue: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 8,
    },
    kpiFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    kpiChange: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
    },
    kpiSubtitle: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      flexShrink: 1,
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
    sectionCaption: {
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: -6,
      marginBottom: 12,
    },
    miniStatsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    miniStatCard: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
    },
    miniStatValue: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 4,
    },
    miniStatLabel: {
      fontSize: 11,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    lineChart: {
      borderRadius: 12,
      marginLeft: -8,
    },
    breakdownTrack: {
      height: 14,
      borderRadius: 8,
      overflow: 'hidden',
      flexDirection: 'row',
      backgroundColor: colors.surface + '35',
      marginBottom: 14,
    },
    breakdownSegment: {
      height: '100%',
    },
    breakdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    breakdownLabelArea: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      marginRight: 12,
    },
    breakdownDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
    },
    breakdownLabel: {
      fontSize: 13,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    breakdownValue: {
      fontSize: 13,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    breakdownHint: {
      marginTop: 10,
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    breakdownWarning: {
      marginTop: 8,
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.error,
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
    visibilityRow: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 4,
      alignItems: 'flex-end',
    },
    visibilityToggle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
  });

  const toCurrency = (value: number) =>
    Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const toCompactCurrency = (value: number) =>
    `R$ ${Math.round(Number(value || 0)).toLocaleString('pt-BR')}`;

  const formatPercent = (value: number, showSignal = false) => {
    const sign = showSignal && value > 0 ? '+' : '';
    return `${sign}${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;
  };

  const formatChange = (value: number) => {
    const normalized = Number.isFinite(value) ? value : 0;
    const arrow = normalized > 0 ? '↑' : normalized < 0 ? '↓' : '→';
    return `${arrow} ${Math.abs(normalized).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}% vs ontem`;
  };

  const maskCurrency = (value: number) =>
    valuesVisible ? toCurrency(value) : 'R$ ••••';

  const maskCompactCurrency = (value: number) =>
    valuesVisible ? toCompactCurrency(value) : 'R$ ••';

  const getChangeColor = (value: number, inverse = false) => {
    if (value === 0) {
      return colors.textSecondary;
    }
    const isPositive = value > 0;
    const isGood = inverse ? !isPositive : isPositive;
    return isGood ? colors.success : colors.error;
  };

  const hexToRgba = (hexColor: string, opacity: number) => {
    const cleanHex = hexColor.replace('#', '');
    if (cleanHex.length !== 6) {
      return `rgba(0, 0, 0, ${opacity})`;
    }

    const red = parseInt(cleanHex.slice(0, 2), 16);
    const green = parseInt(cleanHex.slice(2, 4), 16);
    const blue = parseInt(cleanHex.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  };

  const todayRevenue = stats.todayRevenue;
  const todayProfit = stats.todayProfit;
  const todayDiscounts = stats.todayDiscounts;
  const todayGrossRevenue =
    stats.todayGrossRevenue > 0 ? stats.todayGrossRevenue : todayRevenue + todayDiscounts;
  const todayCogs = stats.todayCogs > 0 ? stats.todayCogs : Math.max(0, todayRevenue - todayProfit);
  const todayMarginPct =
    stats.todayMarginPct > 0
      ? stats.todayMarginPct
      : todayRevenue > 0
        ? (todayProfit / todayRevenue) * 100
        : 0;
  const todayDiscountPct =
    stats.todayDiscountPct > 0
      ? stats.todayDiscountPct
      : todayGrossRevenue > 0
        ? (todayDiscounts / todayGrossRevenue) * 100
        : 0;

  const trendFallbackLabels = ['Sex', 'Sab', 'Dom', 'Seg', 'Ter', 'Qua', 'Qui'];
  const trendData =
    stats.last7Days.length === 7
      ? stats.last7Days
      : trendFallbackLabels.map((label) => ({ label, revenue: 0, profit: 0 }));

  const positiveProfitForBreakdown = Math.max(0, todayProfit);
  const revenueBreakdown = [
    { key: 'cogs', label: 'Custos mercadorias', value: todayCogs, color: colors.warning },
    { key: 'discounts', label: 'Descontos', value: todayDiscounts, color: '#f97316' },
    { key: 'profit', label: 'Lucro liquido', value: positiveProfitForBreakdown, color: colors.success },
  ];
  const breakdownTotal = revenueBreakdown.reduce((sum, item) => sum + Math.max(0, item.value), 0);

  const KpiCard = ({
    title,
    value,
    subtitle,
    change,
    icon,
    accentColor,
    inverseChange = false,
  }: {
    title: string;
    value: number;
    subtitle: string;
    change: number;
    icon: React.ReactNode;
    accentColor: string;
    inverseChange?: boolean;
  }) => (
    <Card style={[styles.kpiCard, { borderLeftColor: accentColor }]}>
      <View style={styles.kpiHeader}>
        <View>
          <Text style={styles.kpiTitle}>{title}</Text>
          <Text style={styles.kpiValue}>{maskCurrency(value)}</Text>
        </View>
        <View style={[styles.kpiIcon, { backgroundColor: accentColor + '20' }]}>{icon}</View>
      </View>
      <View style={styles.kpiFooter}>
        <Text style={[styles.kpiChange, { color: getChangeColor(change, inverseChange) }]}>
          {formatChange(change)}
        </Text>
        <Text style={styles.kpiSubtitle}>{subtitle}</Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header title="Dashboard" showSettings />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Toggle visibilidade dos valores */}
        <View style={styles.visibilityRow}>
          <TouchableOpacity
            style={styles.visibilityToggle}
            onPress={() => setValuesVisible(v => !v)}
            activeOpacity={0.7}
          >
            {valuesVisible
              ? <Eye size={18} color={colors.textSecondary} />
              : <EyeOff size={18} color={colors.textSecondary} />
            }
          </TouchableOpacity>
        </View>

        {/* KPIs Financeiros */}
        <View style={styles.kpiSection}>
          <KpiCard
            title="Faturamento Hoje"
            value={todayRevenue}
            subtitle={`${stats.dailySales} vendas hoje`}
            change={stats.revenueChangePct}
            accentColor={colors.warning}
            icon={<DollarSign size={20} color={colors.warning} />}
          />

          <KpiCard
            title="Lucro Liquido"
            value={todayProfit}
            subtitle={`${formatPercent(todayMarginPct)} de margem`}
            change={stats.profitChangePct}
            accentColor={colors.success}
            icon={<TrendingUp size={20} color={colors.success} />}
          />

          <KpiCard
            title="Descontos Dados"
            value={todayDiscounts}
            subtitle={`${formatPercent(todayDiscountPct)} do faturamento`}
            change={stats.discountChangePct}
            accentColor={'#f97316'}
            inverseChange
            icon={<Package size={20} color={'#f97316'} />}
          />
        </View>

        {/* Mini resumo operacional */}
        <View style={styles.section}>
          <View style={styles.miniStatsRow}>
            <Card style={styles.miniStatCard}>
              <Text style={styles.miniStatValue}>{stats.lowStockCount}</Text>
              <Text style={styles.miniStatLabel}>Itens com estoque baixo</Text>
            </Card>
            <Card style={styles.miniStatCard}>
              <Text style={styles.miniStatValue}>{stats.totalCustomers}</Text>
              <Text style={styles.miniStatLabel}>Clientes cadastrados</Text>
            </Card>
            <Card style={styles.miniStatCard}>
              <Text style={styles.miniStatValue}>{maskCompactCurrency(stats.monthlyExpenses)}</Text>
              <Text style={styles.miniStatLabel}>Despesas do mes</Text>
            </Card>
          </View>
        </View>

        {/* Linha 7 dias */}
        <View style={styles.section}>
          <Card>
            <Text style={styles.sectionTitle}>Faturamento e Lucro nos ultimos 7 dias</Text>
            <Text style={styles.sectionCaption}>
              Laranja = faturamento | Verde = lucro liquido
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={{
                  labels: trendData.map((point) => point.label),
                  datasets: [
                    {
                      data: trendData.map((point) => valuesVisible ? Number(point.revenue || 0) : 0),
                      color: (opacity = 1) => hexToRgba('#f97316', opacity),
                      strokeWidth: 3,
                    },
                    {
                      data: trendData.map((point) => valuesVisible ? Number(point.profit || 0) : 0),
                      color: (opacity = 1) => hexToRgba(colors.success, opacity),
                      strokeWidth: 3,
                    },
                  ],
                  legend: ['Faturamento', 'Lucro liquido'],
                }}
                width={Math.max(width - 72, 320)}
                height={220}
                bezier
                chartConfig={{
                  backgroundColor: colors.card,
                  backgroundGradientFrom: colors.card,
                  backgroundGradientTo: colors.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => hexToRgba(colors.primary, opacity),
                  labelColor: (opacity = 1) => hexToRgba(colors.textSecondary, opacity),
                  propsForDots: {
                    r: '4',
                    strokeWidth: '1',
                    stroke: colors.card,
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: colors.border,
                  },
                }}
                yAxisLabel="R$ "
                yAxisInterval={1}
                style={styles.lineChart}
                withShadow={false}
                withInnerLines
                withOuterLines={false}
              />
            </ScrollView>
          </Card>
        </View>

        {/* Composicao do faturamento */}
        <View style={styles.section}>
          <Card>
            <Text style={styles.sectionTitle}>Como o faturamento bruto se dividiu hoje</Text>
            <Text style={styles.sectionCaption}>
              Custos, descontos e lucro sobre {maskCurrency(todayGrossRevenue)}
            </Text>

            {breakdownTotal > 0 ? (
              <>
                <View style={styles.breakdownTrack}>
                  {revenueBreakdown.map((segment) => (
                    <View
                      key={segment.key}
                      style={[
                        styles.breakdownSegment,
                        {
                          flex: Math.max(segment.value, 0),
                          backgroundColor: segment.color,
                        },
                      ]}
                    />
                  ))}
                </View>

                {revenueBreakdown.map((segment) => {
                  const share = breakdownTotal > 0 ? (Math.max(segment.value, 0) / breakdownTotal) * 100 : 0;
                  return (
                    <View key={segment.key} style={styles.breakdownItem}>
                      <View style={styles.breakdownLabelArea}>
                        <View style={[styles.breakdownDot, { backgroundColor: segment.color }]} />
                        <Text style={styles.breakdownLabel}>{segment.label}</Text>
                      </View>
                      <Text style={styles.breakdownValue}>
                        {maskCurrency(Math.max(segment.value, 0))} ({formatPercent(share)})
                      </Text>
                    </View>
                  );
                })}

                <Text style={styles.breakdownHint}>
                  Base de leitura: faturamento bruto = custos + descontos + lucro liquido.
                </Text>

                {todayProfit < 0 && (
                  <Text style={styles.breakdownWarning}>
                    Hoje houve prejuizo de {maskCurrency(Math.abs(todayProfit))}. O bloco de lucro fica zerado para manter a leitura simples.
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.breakdownHint}>Sem vendas registradas hoje.</Text>
            )}
          </Card>
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
