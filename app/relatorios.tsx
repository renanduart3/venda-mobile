import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { Trophy, ChartPie, ChartLine, CreditCard, Clock, Users, UserX, DollarSign } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import ReportChartRenderer from '@/components/ReportChartRenderer';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { router } from 'expo-router';
import { isPremium } from '@/lib/premium';
import { getReportData, Period } from '@/lib/advanced-reports';
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

type Preset = Extract<Period, '7days' | '30days' | '6months' | 'yearly'>;

const PRESETS: { key: Preset; label: string; periodLabel: string }[] = [
  { key: '7days', label: '7 dias', periodLabel: 'Últimos 7 dias' },
  { key: '30days', label: '30 dias', periodLabel: 'Últimos 30 dias' },
  { key: '6months', label: '6 meses', periodLabel: 'Últimos 6 meses' },
  { key: 'yearly', label: 'Anual', periodLabel: `Ano ${new Date().getFullYear()}` },
];

export default function Relatorios() {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const modalBg = colors.card;
  const modalText = colors.text;
  const modalTextSec = colors.textSecondary;
  const modalBorder = colors.border;
  const insets = useSafeAreaInsets();

  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userIsPremium, setUserIsPremium] = useState(true);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isFetchingReport, setIsFetchingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try { setUserIsPremium(await isPremium()); } catch { }
    })();
  }, []);

  // Carrega dados quando um preset é selecionado
  useEffect(() => {
    if (!showReportModal || !selectedReport || !selectedPreset) return;
    let isMounted = true;
    (async () => {
      try {
        setIsFetchingReport(true);
        setReportError(null);
        setReportData([]);
        const data = await getReportData(selectedReport.id, { period: selectedPreset });
        if (!isMounted) return;
        setReportData(Array.isArray(data) ? data : (data ? [data] : []));
      } catch (error) {
        if (!isMounted) return;
        setReportError(error instanceof Error ? error.message : 'Não foi possível carregar o relatório.');
      } finally {
        if (!isMounted) return;
        setIsFetchingReport(false);
      }
    })();
    return () => { isMounted = false; };
  }, [showReportModal, selectedReport, selectedPreset]);

  const handleCloseModal = () => {
    setShowReportModal(false);
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
    setReportData([]);
    setReportError(null);
    setShowReportModal(true);
  };

  const handleSelectPreset = useCallback((preset: Preset) => {
    setSelectedPreset(preset);
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedReport || !selectedPreset) return;
    if (isFetchingReport) {
      Alert.alert('Carregando dados', 'Aguarde enquanto coletamos as informações do relatório.');
      return;
    }
    if (reportError) {
      Alert.alert('Erro', reportError);
      return;
    }
    if (!reportData.length) {
      Alert.alert('Sem dados', 'Não há dados para gerar o relatório no período selecionado.');
      return;
    }
    setIsGenerating(true);
    try {
      const periodLabel = PRESETS.find(p => p.key === selectedPreset)?.periodLabel ?? selectedPreset;
      const rows = selectedReport.id === '6' ? reportData.slice(0, 100) : reportData;
      const chartHtml = generateReportChartHTML(selectedReport.id, rows);
      const html = generateReportHTML(selectedReport.title, rows, periodLabel, chartHtml);
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = String(today.getFullYear());
      const base = (selectedReport.title || 'relatorio')
        .toString()
        .normalize('NFD')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      const fileName = `${base}-${dd}${mm}${yyyy}.pdf`;
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
    modal: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center' },
    modalBox: {
      backgroundColor: modalBg,
      borderRadius: 12,
      padding: 16,
      width: '92%',
      maxWidth: 440,
      maxHeight: '85%',
    },
    modalTitle: { fontSize: 16, color: modalText, marginBottom: 12, fontWeight: 'bold' },
    presetsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    presetBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: modalBorder,
      alignItems: 'center',
    },
    presetBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    presetBtnText: { fontSize: 12, color: modalText, fontWeight: '600' },
    presetBtnTextActive: { color: '#ffffff' },
    chartArea: { minHeight: 80 },
    emptyHint: { color: modalTextSec, textAlign: 'center', marginVertical: 20, fontSize: 13 },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 16 },
    btn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' },
    btnText: { color: '#ffffff', textAlign: 'center', fontWeight: 'bold', fontSize: 15 },
    btnOutline: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: modalBorder, alignItems: 'center' },
    btnOutlineText: { color: modalText, textAlign: 'center', fontWeight: 'bold', fontSize: 15 },
  });

  const canGeneratePdf = !!selectedPreset && !isFetchingReport && !isGenerating && !!reportData.length && !reportError;

  return (
    <View style={styles.container}>
      <Header title="Relatórios" showBack />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Math.max(16, insets.bottom) }}>
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

      <Modal visible={showReportModal} transparent animationType="fade" onRequestClose={handleCloseModal}>
        <View style={styles.modal}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{selectedReport?.title || 'Relatório'}</Text>

            {/* Seletor de período */}
            <View style={styles.presetsRow}>
              {PRESETS.map((p) => {
                const isActive = selectedPreset === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[styles.presetBtn, isActive && styles.presetBtnActive]}
                    onPress={() => handleSelectPreset(p.key)}
                  >
                    <Text style={[styles.presetBtnText, isActive && styles.presetBtnTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Área do gráfico / mensagem */}
            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
              {!selectedPreset ? (
                <Text style={styles.emptyHint}>Selecione um período para visualizar o relatório</Text>
              ) : (
                <View style={styles.chartArea}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <ReportChartRenderer reportId={selectedReport?.id as any} data={reportData} />
                  </ScrollView>
                  {isFetchingReport && (
                    <View style={{ alignItems: 'center', marginTop: 8 }}>
                      <ActivityIndicator color={colors.primary} />
                      <Text style={{ color: modalTextSec, marginTop: 6, fontSize: 13 }}>Carregando dados...</Text>
                    </View>
                  )}
                  {!!reportError && (
                    <Text style={{ color: colors.error, marginTop: 8, fontSize: 13 }}>{reportError}</Text>
                  )}
                  {!isFetchingReport && !reportError && reportData.length === 0 && (
                    <Text style={{ color: modalTextSec, marginTop: 8, fontSize: 13 }}>
                      Nenhum dado encontrado para o período selecionado.
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.row}>
              <TouchableOpacity style={styles.btnOutline} onPress={handleCloseModal}>
                <Text style={styles.btnOutlineText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { opacity: canGeneratePdf ? 1 : 0.4 }]}
                disabled={!canGeneratePdf}
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
