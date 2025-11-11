import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator, Switch } from 'react-native';
import { Trophy, ChartPie, ChartLine, CreditCard, Clock, Users, UserX, DollarSign } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import ReportChartRenderer from '@/components/ReportChartRenderer';
import { getUseReportsMock, setUseReportsMock } from '@/lib/dev-flags';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { router } from 'expo-router';
import { isPremium } from '@/lib/premium';
import { getReportData } from '@/lib/advanced-reports';
import { generateReportHTML, generateReportChartHTML, reportToPDF } from '@/lib/export';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const premiumReports = [
  { id: '1', title: 'Relatórios de Produtos Mais Vendidos', description: 'Descubra quais produtos seus clientes mais amam.', icon: Trophy },
  { id: '2', title: 'Curva ABC de Produtos', description: 'Classifique seus produtos pela importância nas vendas.', icon: ChartPie },
  { id: '3', title: 'Análise de Vendas por Período', description: 'Compare o desempenho de vendas ao longo do tempo.', icon: ChartLine },
  { id: '4', title: 'Performance de Meios de Pagamento', description: 'Entenda como seus clientes preferem pagar.', icon: CreditCard },
  { id: '5', title: 'Horários de Pico de Vendas', description: 'Saiba os horários de maior movimento na sua loja.', icon: Clock },
  { id: '6', title: 'Ranking de Clientes (RFV)', description: 'Identifique seus clientes mais valiosos.', icon: Users },
  { id: '7', title: 'Clientes Inativos', description: 'Crie campanhas para reativar clientes que não compram há algum tempo.', icon: UserX },
  { id: '8', title: 'Análise de Margem de Lucro', description: 'Descubra quais produtos são mais lucrativos.', icon: DollarSign },
];

const MAX_REPORT_MONTHS = 6;

export default function Relatorios() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedPeriod] = useState<'month' | 'year'>('month');
  const [selectedYear] = useState(new Date().getFullYear());
  const [selectedMonth] = useState(new Date().getMonth() + 1);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userIsPremium, setUserIsPremium] = useState(true);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isFetchingReport, setIsFetchingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [devUseMock, setDevUseMock] = useState<boolean>(false);

  useEffect(() => { try { setDevUseMock(getUseReportsMock()); } catch {} }, []);

  useEffect(() => {
    (async () => {
      try { setUserIsPremium(await isPremium()); } catch {}
    })();
  }, []);

  const buildSelectedPeriodRange = useCallback(() => {
    const msInMonth = 1000 * 60 * 60 * 24 * 30;
    const start = selectedPeriod === 'month' ? new Date(selectedYear, selectedMonth - 1, 1) : new Date(selectedYear, 0, 1);
    const endRef = selectedPeriod === 'month' ? new Date(selectedYear, selectedMonth, 1) : new Date(selectedYear + 1, 0, 1);
    let end = new Date(endRef.getTime() - 1000);
    if (end.getTime() - start.getTime() < msInMonth) end = new Date(start.getTime() + msInMonth - 1000);
    const months = (end.getTime() - start.getTime()) / msInMonth;
    if (months > MAX_REPORT_MONTHS) end = new Date(start.getTime() + MAX_REPORT_MONTHS * msInMonth - 1000);
    const label = selectedPeriod === 'month' ? `${String(selectedMonth).padStart(2, '0')}/${selectedYear}` : `Ano ${selectedYear}`;
    return { start, end, label };
  }, [selectedPeriod, selectedYear, selectedMonth]);

  useEffect(() => {
    if (!showPeriodModal || !selectedReport) return;
    let isMounted = true;
    (async () => {
      try {
        setIsFetchingReport(true);
        setReportError(null);
        const { start, end } = buildSelectedPeriodRange();
        const data = await getReportData(selectedReport.id, { period: 'custom', start: start.toISOString(), end: end.toISOString() });
        if (!isMounted) return;
        const normalized = Array.isArray(data) ? data : (data ? [data] : []);
        setReportData(normalized);
      } catch (error) {
        if (!isMounted) return;
        setReportError(error instanceof Error ? error.message : 'Não foi possível carregar o relatório.');
      } finally {
        if (!isMounted) return;
        setIsFetchingReport(false);
      }
    })();
    return () => { isMounted = false; };
  }, [showPeriodModal, selectedReport, buildSelectedPeriodRange, devUseMock]);

  const handleCloseModal = () => {
    setShowPeriodModal(false);
    setSelectedReport(null);
    setReportData([]);
    setReportError(null);
    setIsFetchingReport(false);
  };

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
    setShowPeriodModal(true);
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) return;
    if (isFetchingReport) {
      Alert.alert('Carregando dados', 'Aguarde enquanto coletamos as informações do relatório.');
      return;
    }
    if (reportError) {
      Alert.alert('Erro', reportError);
      return;
    }
    setIsGenerating(true);
    try {
      const rows = Array.isArray(reportData) ? reportData : (reportData ? [reportData] : []);
      const { label: periodLabel } = buildSelectedPeriodRange();
      const chartHtml = generateReportChartHTML(selectedReport.id, rows);
      const tableRows = selectedReport.id === '6' ? rows.slice(0, 100) : rows;
      const html = generateReportHTML(selectedReport.title, tableRows, periodLabel, chartHtml);
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = String(today.getFullYear());
      const dateStr = `${dd}${mm}${yyyy}`;
      const base = (selectedReport.title || 'relatorio')
        .toString()
        .normalize('NFD')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      const fileName = `${base}+${dateStr}.pdf`;
      await reportToPDF(html, fileName);
      Alert.alert('Relatório exportado', `Arquivo: ${fileName}`, [{ text: 'OK', onPress: handleCloseModal }]);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível gerar o relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    card: { marginBottom: 12 },
    title: { fontSize: 16, color: colors.text },
    desc: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    modal: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', alignItems: 'center' },
    modalBox: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, width: '90%', maxWidth: 420 },
    modalTitle: { fontSize: 18, color: colors.text, marginBottom: 12 },
    row: { flexDirection: 'row', gap: 8, marginTop: 12 },
    btn: { padding: 12, borderRadius: 8, backgroundColor: colors.primary },
    btnText: { color: colors.white, textAlign: 'center' },
    btnOutline: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    btnOutlineText: { color: colors.text, textAlign: 'center' }
  });

  return (
    <View style={styles.container}>
  <Header title="Relatórios" showBack />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Math.max(16, insets.bottom) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>Dev: Usar Mock de Relatórios</Text>
          <Switch value={devUseMock} onValueChange={(v)=>{ setDevUseMock(v); try { setUseReportsMock(v); } catch {}; }} />
        </View>

        {premiumReports.map((r) => (
          <TouchableOpacity key={r.id} onPress={() => handleReportPress(r)}>
            <Card style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {React.createElement(r.icon as any, { size: 20, color: colors.primary })}
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{r.title}</Text>
                  <Text style={styles.desc}>{r.description}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={showPeriodModal} transparent animationType="fade" onRequestClose={handleCloseModal}>
        <View style={styles.modal}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{selectedReport?.title || 'Relatório'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 0 }}>
              <ReportChartRenderer reportId={selectedReport?.id as any} data={reportData} />
            </ScrollView>
            {isFetchingReport && (
              <View style={{ alignItems: 'center', marginTop: 8 }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: 6 }}>Carregando dados...</Text>
              </View>
            )}
            {!!reportError && (
              <Text style={{ color: colors.error, marginTop: 8 }}>{reportError}</Text>
            )}
            <View style={styles.row}>
              <TouchableOpacity style={styles.btnOutline} onPress={handleCloseModal}>
                <Text style={styles.btnOutlineText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { opacity: isFetchingReport || isGenerating ? 0.6 : 1 }]}
                disabled={isFetchingReport || isGenerating}
                onPress={handleGenerateReport}
              >
                <Text style={styles.btnText}>{isGenerating ? 'Gerando...' : 'Gerar PDF'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

