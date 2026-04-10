import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calculator, Package, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';

// ─── Formatação ───────────────────────────────────────────────────────────────

function parseCurrency(text: string): number {
  // Remove tudo que não é dígito ou vírgula/ponto
  const cleaned = text.replace(/[^\d,\.]/g, '').replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Cálculos ─────────────────────────────────────────────────────────────────

interface CalcResult {
  sellingPrice: number;    // Preço de venda
  grossProfit: number;     // Lucro bruto por unidade
  marginPct: number;       // Margem de lucro (%)
  markupPct: number;       // Markup (%)
  breakEvenUnits: number | null; // Unidades para cobrir custos fixos
}

function calculate(
  costPrice: number,
  marginPct: number | null,
  sellingPrice: number | null,
  fixedCosts: number,
): CalcResult | null {
  if (costPrice <= 0) return null;

  let price: number;
  let margin: number;

  if (sellingPrice !== null && sellingPrice > costPrice) {
    // Modo: preço de venda → back-calc margem
    price = sellingPrice;
    margin = ((sellingPrice - costPrice) / sellingPrice) * 100;
  } else if (marginPct !== null && marginPct > 0 && marginPct < 100) {
    // Modo: margem → calc preço de venda
    price = costPrice / (1 - marginPct / 100);
    margin = marginPct;
  } else {
    return null;
  }

  const grossProfit = price - costPrice;
  const markup = ((price - costPrice) / costPrice) * 100;
  const breakEven = fixedCosts > 0 ? Math.ceil(fixedCosts / grossProfit) : null;

  return {
    sellingPrice: price,
    grossProfit,
    marginPct: margin,
    markupPct: markup,
    breakEvenUnits: breakEven,
  };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CalculadoraMarkup() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Pre-fill de produto, se vier de produto
  const prefillCost = params.cost_price as string | undefined;
  const prefillPrice = params.price as string | undefined;
  const prefillName = params.name as string | undefined;

  // ── Estado dos campos ──────────────────────────────────────────────────────
  const [costPrice, setCostPrice] = useState(prefillCost ? String(parseCurrency(prefillCost)) : '');
  const [marginInput, setMarginInput] = useState('');
  const [sellingInput, setSellingInput] = useState(prefillPrice ? String(parseCurrency(prefillPrice)) : '');
  const [fixedCosts, setFixedCosts] = useState('');

  // Modo: 'margin' = digita margem e calcula preço; 'price' = digita preço e calcula margem
  const [mode, setMode] = useState<'margin' | 'price'>(prefillPrice && !prefillCost ? 'price' : 'margin');

  const result = useCallback((): CalcResult | null => {
    const cost = parseCurrency(costPrice);
    const fixed = parseCurrency(fixedCosts);
    if (mode === 'margin') {
      const margin = parseCurrency(marginInput);
      return calculate(cost, margin, null, fixed);
    } else {
      const price = parseCurrency(sellingInput);
      return calculate(cost, null, price, fixed);
    }
  }, [costPrice, marginInput, sellingInput, fixedCosts, mode])();

  const handleReset = () => {
    setCostPrice('');
    setMarginInput('');
    setSellingInput('');
    setFixedCosts('');
    setMode('margin');
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.topbar,
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    backButton: { padding: 10, borderRadius: 10, backgroundColor: colors.card },
    headerTitle: { fontSize: 22, fontFamily: 'Inter-Bold', color: colors.onTopbar, flex: 1 },
    resetButton: { padding: 10, borderRadius: 10, backgroundColor: colors.card },
    content: { flex: 1, padding: 20 },
    productBanner: {
      backgroundColor: colors.primary + '15',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.primary + '40',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    productBannerText: {
      fontSize: 13,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
      flex: 1,
    },
    sectionTitle: {
      fontSize: 13,
      fontFamily: 'Inter-SemiBold',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 12,
      marginTop: 4,
    },
    label: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      marginBottom: 14,
    },
    modeRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    modeBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
    },
    modeBtnText: {
      fontSize: 13,
      fontFamily: 'Inter-SemiBold',
    },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
    // Resultados
    resultCard: { marginBottom: 14 },
    resultRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultRowLast: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
    },
    resultLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      flex: 1,
    },
    resultValue: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    // Preço de venda em destaque
    highlightCard: {
      backgroundColor: colors.primary + '12',
      borderRadius: 14,
      padding: 20,
      alignItems: 'center',
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    highlightLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    highlightValue: {
      fontSize: 36,
      fontFamily: 'Inter-Black',
      color: colors.primary,
    },
    highlightSub: {
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 4,
    },
    // Break-even
    breakEvenCard: {
      backgroundColor: colors.warning + '15',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.warning + '40',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
    },
    breakEvenText: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    breakEvenHighlight: {
      fontFamily: 'Inter-Bold',
      color: colors.warning,
    },
    // Empty state
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
      gap: 8,
    },
    emptyText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    // Tip
    tipCard: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tipText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      lineHeight: 18,
    },
    tipBold: {
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calculadora de Markup</Text>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <RefreshCw size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de produto pré-preenchido */}
        {!!prefillName && (
          <View style={styles.productBanner}>
            <Package size={16} color={colors.primary} />
            <Text style={styles.productBannerText} numberOfLines={1}>
              Calculando para: <Text style={{ fontFamily: 'Inter-Bold' }}>{prefillName}</Text>
            </Text>
          </View>
        )}

        {/* ── Entradas ─────────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Dados do produto</Text>

        <Text style={styles.label}>Preço de custo (R$) *</Text>
        <TextInput
          style={styles.input}
          value={costPrice}
          onChangeText={setCostPrice}
          placeholder="Ex: 12,50"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
        />

        {/* Seletor de modo */}
        <Text style={styles.label}>Calcular por:</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              {
                backgroundColor: mode === 'margin' ? colors.primary : colors.card,
                borderColor: mode === 'margin' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setMode('margin')}
          >
            <Text
              style={[
                styles.modeBtnText,
                { color: mode === 'margin' ? '#fff' : colors.textSecondary },
              ]}
            >
              % Margem desejada
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeBtn,
              {
                backgroundColor: mode === 'price' ? colors.primary : colors.card,
                borderColor: mode === 'price' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setMode('price')}
          >
            <Text
              style={[
                styles.modeBtnText,
                { color: mode === 'price' ? '#fff' : colors.textSecondary },
              ]}
            >
              Preço de venda
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'margin' ? (
          <>
            <Text style={styles.label}>Margem de lucro desejada (%)</Text>
            <TextInput
              style={styles.input}
              value={marginInput}
              onChangeText={setMarginInput}
              placeholder="Ex: 40"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Preço de venda praticado (R$)</Text>
            <TextInput
              style={styles.input}
              value={sellingInput}
              onChangeText={setSellingInput}
              placeholder="Ex: 25,00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
          </>
        )}

        <Text style={styles.label}>Custos fixos mensais (R$) — opcional</Text>
        <TextInput
          style={styles.input}
          value={fixedCosts}
          onChangeText={setFixedCosts}
          placeholder="Ex: 2.000 (aluguel, salários…)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
        />

        <View style={styles.divider} />

        {/* ── Resultados ───────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Resultado</Text>

        {result ? (
          <>
            {/* Preço de venda em destaque */}
            {mode === 'margin' && (
              <View style={styles.highlightCard}>
                <Text style={styles.highlightLabel}>Preço de venda sugerido</Text>
                <Text style={styles.highlightValue}>R$ {formatBRL(result.sellingPrice)}</Text>
                <Text style={styles.highlightSub}>para {formatBRL(result.marginPct)}% de margem</Text>
              </View>
            )}

            <Card style={styles.resultCard}>
              {mode === 'price' && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Margem de lucro</Text>
                  <Text style={[styles.resultValue, { color: result.marginPct >= 30 ? colors.success : result.marginPct >= 15 ? colors.warning : colors.error }]}>
                    {formatBRL(result.marginPct)}%
                  </Text>
                </View>
              )}

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Markup</Text>
                <Text style={styles.resultValue}>{formatBRL(result.markupPct)}%</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Lucro por unidade</Text>
                <Text style={[styles.resultValue, { color: colors.success }]}>
                  R$ {formatBRL(result.grossProfit)}
                </Text>
              </View>

              <View style={styles.resultRowLast}>
                <Text style={styles.resultLabel}>Preço de custo</Text>
                <Text style={styles.resultValue}>R$ {formatBRL(parseCurrency(costPrice))}</Text>
              </View>
            </Card>

            {/* Ponto de equilíbrio */}
            {result.breakEvenUnits !== null && (
              <View style={styles.breakEvenCard}>
                <Package size={20} color={colors.warning} />
                <Text style={styles.breakEvenText}>
                  Você precisa vender{' '}
                  <Text style={styles.breakEvenHighlight}>
                    {result.breakEvenUnits} unidade{result.breakEvenUnits !== 1 ? 's' : ''}
                  </Text>
                  {' '}por mês para cobrir seus custos fixos de{' '}
                  <Text style={styles.breakEvenHighlight}>
                    R$ {formatBRL(parseCurrency(fixedCosts))}
                  </Text>
                  .
                </Text>
              </View>
            )}

            {/* Dica de margem */}
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>💡 Referência rápida: </Text>
                {result.marginPct < 15
                  ? 'Margem abaixo de 15% — risco alto. Verifique seus custos fixos e variáveis antes de precificar.'
                  : result.marginPct < 30
                    ? 'Margem entre 15–30% — aceitável para produtos de alto giro. Atenção ao volume de vendas.'
                    : result.marginPct < 50
                      ? 'Margem entre 30–50% — boa margem para a maioria dos segmentos varejistas.'
                      : 'Margem acima de 50% — excelente! Confirme se o preço ainda é competitivo no seu mercado.'}
              </Text>
            </View>
          </>
        ) : (
          <Card>
            <View style={styles.emptyState}>
              <Calculator size={40} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                Preencha o preço de custo e{'\n'}
                {mode === 'margin' ? 'a margem desejada' : 'o preço de venda'} para ver o resultado.
              </Text>
            </View>
          </Card>
        )}

        {/* Explicação dos conceitos */}
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>Margem vs Markup:{'\n'}</Text>
            <Text style={styles.tipBold}>Margem</Text>
            {' = lucro ÷ preço de venda × 100\n'}
            <Text style={styles.tipBold}>Markup</Text>
            {' = lucro ÷ custo × 100\n\n'}
            Ex: custo R$10, venda R$15 → Margem 33,3% / Markup 50%
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
