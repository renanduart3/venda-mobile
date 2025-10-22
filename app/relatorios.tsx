import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import { 
  Trophy,
  ChartPie,
  ChartLine,
  User,
  Clock,
  Users,
  UserX,
  DollarSign,
  Download,
  FileSpreadsheet
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { router } from 'expo-router';
import { isPremium } from '@/lib/premium';
// TODO: Implementar funções de relatórios avançados
// import { getReportData } from '@/lib/advanced-reports';
// import { generateReportHTML, reportToPDF } from '@/lib/export';

const premiumReports = [
  { 
    id: '1', 
    title: 'Relatório de Produtos Mais Vendidos', 
    description: 'Descubra quais produtos seus clientes mais amam.',
    icon: Trophy,
    details: 'Análise completa dos produtos mais vendidos com quantidade, faturamento e tendências de crescimento.'
  },
  { 
    id: '2', 
    title: 'Curva ABC de Produtos', 
    description: 'Classifique seus produtos pela importância nas vendas.',
    icon: ChartPie,
    details: 'Classificação dos produtos em categorias A, B e C baseada no faturamento e frequência de vendas.'
  },
  { 
    id: '3', 
    title: 'Análise de Vendas por Período', 
    description: 'Compare o desempenho de vendas ao longo do tempo.',
    icon: ChartLine,
    details: 'Comparativo de vendas entre períodos com gráficos de evolução e identificação de tendências.'
  },
  { 
    id: '4', 
    title: 'Performance de Meios de Pagamento', 
    description: 'Entenda como seus clientes preferem pagar.',
    icon: User,
    details: 'Análise detalhada dos métodos de pagamento mais utilizados e sua evolução ao longo do tempo.'
  },
  { 
    id: '5', 
    title: 'Horários de Pico de Vendas', 
    description: 'Saiba os horários de maior movimento na sua loja.',
    icon: Clock,
    details: 'Identificação dos horários de maior e menor movimento para otimização do atendimento.'
  },
  { 
    id: '6', 
    title: 'Ranking de Clientes (RFV)', 
    description: 'Identifique seus clientes mais valiosos.',
    icon: Users,
    details: 'Análise RFV (Recência, Frequência, Valor) para segmentação e estratégias de marketing.'
  },
  { 
    id: '7', 
    title: 'Clientes Inativos', 
    description: 'Crie campanhas para reativar clientes que não compram há algum tempo.',
    icon: UserX,
    details: 'Lista de clientes inativos com tempo desde última compra e sugestões de reativação.'
  },
  { 
    id: '8', 
    title: 'Análise de Margem de Lucro', 
    description: 'Descubra quais produtos são mais lucrativos.',
    icon: DollarSign,
    details: 'Cálculo de margem de lucro por produto com identificação dos mais e menos rentáveis.'
  },
];

export default function Relatorios() {
  const { colors } = useTheme();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | null>(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userIsPremium, setUserIsPremium] = useState(true); // Iniciar como premium para evitar flash
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const premium = await isPremium();
      setUserIsPremium(premium);
    } finally {
      setIsLoading(false);
    }
  };

  // Função de teste removida para produção

  const handleReportPress = (report: any) => {
    if (!userIsPremium) {
      Alert.alert(
        'Funcionalidade Premium',
        'Esta funcionalidade está disponível apenas para usuários premium. Faça upgrade para acessar todos os relatórios avançados.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Fazer Upgrade', onPress: () => router.push('/planos') }
        ]
      );
      return;
    }
    
    setSelectedReport(report);
    setSelectedFormat(null); // Reset formato selecionado
    setShowPeriodModal(true);
  };

  const handleGenerateReport = async () => {
    if (!selectedReport || !selectedFormat) return;

    setIsGenerating(true);
    
    try {
      // TODO: Implementar coleta de dados reais do banco
      // Por enquanto, simular dados
      const reportData = [];
      
      if (selectedFormat === 'pdf') {
        // TODO: Implementar geração de PDF real
        // Por enquanto, simular
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        Alert.alert(
          'PDF Gerado',
          `O relatório "${selectedReport.title}" foi gerado em PDF com sucesso!\n\nDados encontrados: ${Array.isArray(reportData) ? reportData.length : 'N/A'} registros`,
          [{ text: 'OK', onPress: () => {
            setShowPeriodModal(false);
            setSelectedReport(null);
            setSelectedFormat(null);
          }}]
        );
      } else {
        // Simular geração do relatório Excel
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        Alert.alert(
          'Relatório Gerado',
          `O relatório "${selectedReport.title}" foi gerado com sucesso!\n\nDados encontrados: ${Array.isArray(reportData) ? reportData.length : 'N/A'} registros`,
          [{ text: 'OK', onPress: () => {
            setShowPeriodModal(false);
            setSelectedReport(null);
            setSelectedFormat(null);
          }}]
        );
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível gerar o relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getPeriodText = () => {
    if (selectedPeriod === 'month') {
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      return `${monthNames[selectedMonth - 1]} de ${selectedYear}`;
    }
    return `Ano ${selectedYear}`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    reportGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 8,
    },
    reportCard: {
      width: '48%',
      marginBottom: 16,
      minHeight: 180,
    },
    reportIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    reportTitle: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 12,
      lineHeight: 20,
    },
    reportDescription: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
      flex: 1,
      marginBottom: 12,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      width: '90%',
      maxWidth: 400,
      minWidth: 320,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 8,
    },
    modalDescription: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 20,
      lineHeight: 20,
    },
    periodSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 12,
    },
    periodSelector: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    periodButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
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
    periodInfo: {
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    exportSection: {
      marginBottom: 20,
    },
    exportButtons: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    exportButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
      minHeight: 48,
    },
    exportButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    exportButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    exportButtonTextActive: {
      color: colors.white,
    },
    generateButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
      width: '100%',
    },
    generateButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    premiumBadge: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 6,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    premiumBadgeText: {
      fontSize: 10,
      fontFamily: 'Inter-Bold',
      color: colors.white,
    },
    disabledCard: {
      opacity: 0.6,
    },
    disabledIcon: {
      backgroundColor: colors.textSecondary + '20',
    },
    disabledText: {
      color: colors.textSecondary,
    },
    disabledBadge: {
      backgroundColor: colors.textSecondary,
    },
    premiumWarning: {
      backgroundColor: colors.warning + '10',
      borderColor: colors.warning,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
      marginBottom: 16,
    },
    warningTitle: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: colors.warning,
      marginBottom: 8,
    },
    warningText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      lineHeight: 20,
      marginBottom: 12,
    },
    upgradeButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignSelf: 'flex-start',
    },
    upgradeButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.white,
    },

    // Seletor de Mês
    monthFilterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 4,
    },
    yearFilterContainer: {
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
  });

  return (
    <View style={styles.container}>
      <Header 
        title="Relatórios Premium" 
        showBack 
        onBackPress={() => router.back()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary }}>Carregando...</Text>
          </View>
        ) : (
          <>
            {!userIsPremium && (
              <View style={styles.premiumWarning}>
                <Text style={styles.warningTitle}>🔒 Funcionalidade Premium</Text>
                <Text style={styles.warningText}>
                  Os relatórios avançados estão disponíveis apenas para usuários premium. 
                  Faça upgrade para acessar todos os recursos.
                </Text>
                <TouchableOpacity 
                  style={styles.upgradeButton}
                  onPress={() => router.push('/planos')}
                >
                  <Text style={styles.upgradeButtonText}>Fazer Upgrade</Text>
                </TouchableOpacity>
              </View>
            )}
        
        <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 16 }]}>
          Relatórios Avançados
        </Text>
        
        <View style={styles.reportGrid}>
          {premiumReports.map((report) => {
            const IconComponent = report.icon;
            return (
              <TouchableOpacity
                key={report.id}
                style={[styles.reportCard, !userIsPremium && styles.disabledCard]}
                onPress={() => handleReportPress(report)}
                disabled={!userIsPremium}
              >
                <Card style={{ 
                  flex: 1, 
                  justifyContent: 'space-between',
                  opacity: userIsPremium ? 1 : 0.6
                }} padding={20}>
                  <View>
                    <View style={[styles.reportIcon, !userIsPremium && styles.disabledIcon]}>
                      {IconComponent && <IconComponent size={24} color={userIsPremium ? colors.primary : colors.textSecondary} />}
                    </View>
                    <Text style={[styles.reportTitle, !userIsPremium && styles.disabledText]} numberOfLines={2} ellipsizeMode="tail">{report.title}</Text>
                    <Text style={[styles.reportDescription, !userIsPremium && styles.disabledText]} numberOfLines={3} ellipsizeMode="tail">{report.description}</Text>
                  </View>
                  <View style={[styles.premiumBadge, !userIsPremium && styles.disabledBadge]}>
                    <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
        </>
        )}
      </ScrollView>

      {/* Period Selection Modal */}
      <Modal visible={showPeriodModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedReport?.title}</Text>
            <Text style={styles.modalDescription}>{selectedReport?.details}</Text>
            
            <View style={styles.periodSection}>
              <Text style={styles.sectionTitle}>Período do Relatório</Text>
              
              <View style={styles.periodSelector}>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    selectedPeriod === 'month' && styles.periodButtonActive
                  ]}
                  onPress={() => setSelectedPeriod('month')}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === 'month' && styles.periodButtonTextActive
                  ]}>
                    Mensal
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    selectedPeriod === 'year' && styles.periodButtonActive
                  ]}
                  onPress={() => setSelectedPeriod('year')}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === 'year' && styles.periodButtonTextActive
                  ]}>
                    Anual
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.periodInfo}>
                {selectedPeriod === 'month' ? (
                  <View style={styles.monthFilterContainer}>
                    <TouchableOpacity 
                      style={styles.monthButton}
                      onPress={() => {
                        const newMonth = selectedMonth - 1;
                        if (newMonth < 1) {
                          setSelectedMonth(12);
                          setSelectedYear(selectedYear - 1);
                        } else {
                          setSelectedMonth(newMonth);
                        }
                      }}
                    >
                      <Text style={styles.monthButtonText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.monthText}>
                      {getPeriodText()}
                    </Text>
                    <TouchableOpacity 
                      style={styles.monthButton}
                      onPress={() => {
                        const newMonth = selectedMonth + 1;
                        if (newMonth > 12) {
                          setSelectedMonth(1);
                          setSelectedYear(selectedYear + 1);
                        } else {
                          setSelectedMonth(newMonth);
                        }
                      }}
                    >
                      <Text style={styles.monthButtonText}>›</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.yearFilterContainer}>
                    <TouchableOpacity 
                      style={styles.monthButton}
                      onPress={() => setSelectedYear(selectedYear - 1)}
                    >
                      <Text style={styles.monthButtonText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.monthText}>
                      {getPeriodText()}
                    </Text>
                    <TouchableOpacity 
                      style={styles.monthButton}
                      onPress={() => setSelectedYear(selectedYear + 1)}
                    >
                      <Text style={styles.monthButtonText}>›</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.exportSection}>
              <Text style={styles.sectionTitle}>Formato de Exportação</Text>
              <View style={styles.exportButtons}>
                <TouchableOpacity
                  style={[
                    styles.exportButton,
                    selectedFormat === 'pdf' && styles.exportButtonActive
                  ]}
                  onPress={() => setSelectedFormat('pdf')}
                >
                  <Download size={16} color={selectedFormat === 'pdf' ? colors.white : colors.primary} />
                  <Text style={[
                    styles.exportButtonText,
                    selectedFormat === 'pdf' && styles.exportButtonTextActive
                  ]}>PDF</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.exportButton,
                    selectedFormat === 'excel' && styles.exportButtonActive
                  ]}
                  onPress={() => setSelectedFormat('excel')}
                >
                  <FileSpreadsheet size={16} color={selectedFormat === 'excel' ? colors.white : colors.primary} />
                  <Text style={[
                    styles.exportButtonText,
                    selectedFormat === 'excel' && styles.exportButtonTextActive
                  ]}>Excel</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.generateButtons}>
              <TouchableOpacity
                style={[
                  styles.generateButton, 
                  { 
                    backgroundColor: (selectedFormat && selectedPeriod) ? colors.primary : colors.border,
                    opacity: (selectedFormat && selectedPeriod) ? 1 : 0.5
                  }
                ]}
                onPress={handleGenerateReport}
                disabled={isGenerating || !selectedFormat || !selectedPeriod}
              >
                <Text style={{ 
                  color: (selectedFormat && selectedPeriod) ? colors.white : colors.text, 
                  textAlign: 'center' 
                }}>
                  {isGenerating ? "Gerando..." : "Gerar Relatório"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.generateButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowPeriodModal(false);
                  setSelectedFormat(null);
                }}
              >
                <Text style={{ color: colors.text, textAlign: 'center' }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
