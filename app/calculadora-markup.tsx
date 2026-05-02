import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Package, Wrench, Save, Edit3, Lock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import AsyncStorage from '@react-native-async-storage/async-storage';
import db from '@/lib/db';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseMoney(text: string): number {
  const v = parseFloat((text ?? '').replace(/[^\d,\.]/g, '').replace(',', '.'));
  return isNaN(v) || v < 0 ? 0 : v;
}

function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CONFIG_KEY = 'markup_config_v2';

interface MarkupConfig {
  metaMensal:   string;
  custoFixo:    string;
  horasSemana:  string;
}

const DEFAULT_CONFIG: MarkupConfig = { metaMensal: '', custoFixo: '', horasSemana: '' };

// ─── Gauge horizontal ─────────────────────────────────────────────────────────
// Velocímetro em barra horizontal: 3 zonas coloridas + agulha

const GaugeBar = ({ margin, colors }: { margin: number; colors: any }) => {
  const MAX = 60;
  const clamped   = Math.min(Math.max(margin, 0), MAX);
  const pct       = clamped / MAX; // 0→1 posição da agulha

  const zoneColor = margin >= 30 ? '#22c55e' : margin >= 15 ? '#f59e0b' : '#ef4444';
  const zoneLabel = margin >= 30 ? 'Prosperidade' : margin >= 15 ? 'Sobrevivência' : 'Risco';

  return (
    <View style={{ gap: 10 }}>
      {/* Número grande */}
      <View style={{ alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 46, fontFamily: 'Inter-Black', color: zoneColor, lineHeight: 52 }}>
          {margin.toFixed(1)}%
        </Text>
        <Text style={{ fontSize: 14, fontFamily: 'Inter-SemiBold', color: zoneColor }}>
          {zoneLabel}
        </Text>
      </View>

      {/* Barra de zonas */}
      <View style={{ position: 'relative' }}>
        <View style={{ flexDirection: 'row', height: 18, borderRadius: 9, overflow: 'hidden' }}>
          {/* Zona vermelha: 0–15% → 25% do range (15/60) */}
          <View style={{ flex: 15, backgroundColor: '#ef4444' }} />
          {/* Zona amarela: 15–30% → 25% */}
          <View style={{ flex: 15, backgroundColor: '#f59e0b' }} />
          {/* Zona verde: 30–60% → 50% */}
          <View style={{ flex: 30, backgroundColor: '#22c55e' }} />
        </View>

        {/* Agulha */}
        <View
          style={{
            position: 'absolute',
            left: `${pct * 100}%` as any,
            top: -5,
            width: 4,
            height: 28,
            backgroundColor: colors.text,
            borderRadius: 2,
            transform: [{ translateX: -2 }],
          }}
        />
      </View>

      {/* Rótulos das zonas */}
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 15, alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 10, color: '#ef4444', fontFamily: 'Inter-SemiBold' }}>0% Risco</Text>
        </View>
        <View style={{ flex: 15, alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#f59e0b', fontFamily: 'Inter-SemiBold' }}>15%</Text>
        </View>
        <View style={{ flex: 30, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: '#22c55e', fontFamily: 'Inter-SemiBold' }}>30–60%+ Saudável</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CalculadoraMarkup() {
  const { colors } = useTheme();
  const router     = useRouter();
  const params     = useLocalSearchParams();

  const isReadonly    = params.mode === 'readonly';
  const isService     = params.item_type === 'service';
  const prefillName   = params.name           as string | undefined;
  const prefillCost   = params.cost_price     as string | undefined;
  const prefillPrice  = params.price          as string | undefined;
  const prefillTime   = params.time_minutes   as string | undefined;
  const prefillMat    = params.material_cost  as string | undefined;
  const prefillProdId = params.product_id     as string | undefined;
  const prefillStock  = params.stock          as string | undefined;

  // Giro: unidades vendidas nos últimos 30 dias
  const [soldLast30, setSoldLast30] = React.useState<number>(0);

  // ── Block A — configuração do negócio ────────────────────────────────────
  const [config, setConfig] = useState<MarkupConfig>(DEFAULT_CONFIG);
  // locked: true = campos em modo "somente leitura" (depois de salvar)
  //         false = campos editáveis. Começa true se já houver config salva.
  const [locked, setLocked] = useState(true);

  // ── Produtos para painel (Block B) ────────────────────────────────────────
  const [items, setItems]  = useState<any[]>([]);

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(CONFIG_KEY)
      .then(raw => {
        if (raw) {
          setConfig(JSON.parse(raw));
          setLocked(true);
        } else {
          setLocked(false);
        }
      })
      .catch(() => { setLocked(false); });

    if (!isReadonly) {
      db.query(
        'SELECT id, name, price, cost_price, type, time_minutes, material_cost FROM products WHERE price > 0 ORDER BY name'
      )
        .then(rows => setItems(rows || []))
        .catch(() => {});
    }

    // Busca vendas dos últimos 30 dias para calcular giro
    if (isReadonly && prefillProdId) {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceIso = since.toISOString();
      db.query(
        `SELECT COALESCE(SUM(si.quantity), 0) as total
         FROM sale_items si
         JOIN sales s ON s.id = si.sale_id
         WHERE si.product_id = ? AND s.created_at >= ?`,
        [prefillProdId, sinceIso]
      )
        .then(rows => {
          const total = rows?.[0]?.total ?? 0;
          setSoldLast30(Number(total));
        })
        .catch(() => {});
    }
  }, []);

  // ── Valor da hora (calculado) ─────────────────────────────────────────────
  const meta    = parseMoney(config.metaMensal);
  const fixo    = parseMoney(config.custoFixo);
  const horas   = parseFloat(config.horasSemana) || 0;
  const valorHora = horas > 0 ? (meta + fixo) / (horas * 4.33) : 0;

  const saveConfig = async () => {
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config)).catch(() => {});
    setLocked(true);
    Alert.alert('✅ Salvo', 'Configuração salva. Toque em "Editar" para alterar.');
  };

  // ── Painel da carteira ────────────────────────────────────────────────────
  const panelData = useMemo(() => {
    const withCost = items.filter(p => p.price > 0);
    if (withCost.length === 0) return null;

    const ranked = withCost
      .map(p => {
        let costBase = 0;
        if (p.type === 'service') {
          const timeH = (p.time_minutes || 0) / 60;
          costBase = valorHora * timeH + (p.material_cost || 0);
        } else {
          costBase = p.cost_price || 0;
        }
        const margin = costBase > 0 && p.price > costBase
          ? ((p.price - costBase) / p.price) * 100
          : p.cost_price > 0
            ? ((p.price - p.cost_price) / p.price) * 100
            : -1;
        return { ...p, margin };
      })
      .filter(p => p.margin >= 0)
      .sort((a, b) => b.margin - a.margin);

    if (ranked.length === 0) return null;

    const totalPrice = ranked.reduce((s, p) => s + p.price, 0);
    const weightedMargin = totalPrice > 0
      ? ranked.reduce((s, p) => s + p.price * p.margin, 0) / totalPrice
      : 0;

    return { weightedMargin, ranked };
  }, [items, valorHora]);

  // ── Insight ───────────────────────────────────────────────────────────────
  const insight = useMemo(() => {
    if (!panelData) return null;
    const { weightedMargin, ranked } = panelData;
    const pior   = ranked[ranked.length - 1];
    const melhor = ranked[0];
    const allGreen  = ranked.every(p => p.margin >= 30);
    const allRed    = ranked.every(p => p.margin < 15);
    const hasMixed  = !allGreen && !allRed;

    if (allGreen) {
      return 'Carteira saudável. Você tem margem para crescer.';
    }
    if (allRed) {
      return `Seus preços estão abaixo do necessário. Veja quais ajustar primeiro — "${pior?.name}" tem a menor margem.`;
    }
    if (hasMixed && weightedMargin >= 30 && pior) {
      return `"${pior.name}" está no vermelho, mas "${melhor.name}" sustenta o resultado. Isso é estratégia, não erro.`;
    }
    if (weightedMargin >= 15 && pior) {
      return `Margem média de ${weightedMargin.toFixed(1)}% — zona de atenção. Considere revisar "${pior.name}".`;
    }
    return `Atenção: margem média de ${weightedMargin.toFixed(1)}% está em zona de risco. Revise seus preços.`;
  }, [panelData]);

  // ── Modo readonly: Raio-X do item ─────────────────────────────────────────
  const costPriceNum = parseMoney(prefillCost  || '0');
  const currentPrice = parseMoney(prefillPrice || '0');
  const timeMinutes  = parseInt(prefillTime || '0', 10) || 0;
  const materialCost = parseMoney(prefillMat || '0');
  const stockAtual   = parseInt(prefillStock || '0', 10) || 0;

  // Custo base: para serviço usa hora×tempo+material; para produto usa custo unitário
  const serviceCostBase = isService
    ? valorHora * (timeMinutes / 60) + materialCost
    : 0;
  const costBase = isService ? serviceCostBase : costPriceNum;

  // Preço mínimo = custo unitário puro (sem rateio — seria distorção para produto individual)
  const precoMinimo = costBase;

  // Sugestões de preço baseadas em lucro sobre custo (markup)
  // 50% de lucro  → preço = custo × 1,5
  // 100% de lucro → preço = custo × 2,0
  const precoSugerido50  = costBase > 0 ? costBase * 1.5  : 0; // 33% de margem
  const precoSugerido100 = costBase > 0 ? costBase * 2.0  : 0; // 50% de margem

  // Margem atual: (preço - custo) / preço × 100
  const currentMargin = currentPrice > 0 && costBase > 0
    ? ((currentPrice - costBase) / currentPrice) * 100
    : -1;

  // Lucro absoluto por unidade
  const lucroUnitario = currentPrice - costBase;

  // ── Giro ─────────────────────────────────────────────────────────────────
  const giro = stockAtual > 0 ? soldLast30 / stockAtual : soldLast30 > 0 ? 99 : 0;
  const giroLabel = giro > 1 ? 'ALTO 🔥' : giro < 0.3 ? 'BAIXO 🧊' : 'NORMAL ⚖️';
  const giroColor = giro > 1 ? '#22c55e' : giro < 0.3 ? '#60a5fa' : '#f59e0b';

  // Sugestão automática baseada em giro + margem
  const giroSugestao = (() => {
    if (giro > 1 && currentMargin >= 0 && currentMargin < 50)
      return '📈 Produto vendendo rápido com margem baixa. Você pode aumentar o preço gradualmente sem perder clientes.';
    if (giro < 0.3 && soldLast30 === 0)
      return '📦 Sem vendas nos últimos 30 dias. Considere promoção ou reveja o preço.';
    if (giro < 0.3)
      return '🏷️ Giro baixo. Reduzir o preço ou criar uma promoção pode acelerar as saídas.';
    return '✅ Preço e giro equilibrados. Mantenha e acompanhe.';
  })();

  const abaixoSugerido = currentPrice > 0 && costBase > 0 && currentPrice < precoSugerido50;

  // ── Helpers visuais ───────────────────────────────────────────────────────
  const marginColor = (m: number) => m >= 30 ? '#22c55e' : m >= 15 ? '#f59e0b' : '#ef4444';

  // ── Estilos ───────────────────────────────────────────────────────────────
  const S = StyleSheet.create({
    container:   { flex: 1, backgroundColor: colors.background },
    header:      { backgroundColor: colors.topbar, paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
    back:        { padding: 10, borderRadius: 10, backgroundColor: colors.card },
    title:       { fontSize: 22, fontFamily: 'Inter-Bold', color: colors.onTopbar, flex: 1 },
    content:     { flex: 1, padding: 20 },
    banner:      { backgroundColor: colors.primary + '15', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: colors.primary + '40', flexDirection: 'row', alignItems: 'center', gap: 8 },
    bannerText:  { fontSize: 13, fontFamily: 'Inter-Medium', color: colors.primary, flex: 1 },
    secTitle:    { fontSize: 13, fontFamily: 'Inter-SemiBold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
    label:       { fontSize: 14, fontFamily: 'Inter-Medium', color: colors.text, marginBottom: 6 },
    labelSub:    { fontSize: 11, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginBottom: 4, marginTop: -2 },
    input:       { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: 'Inter-Regular', color: colors.text, marginBottom: 14 },
    divider:     { height: 1, backgroundColor: colors.border, marginVertical: 20 },
    hourCard:    { backgroundColor: colors.primary + '10', borderRadius: 12, padding: 16, marginTop: 4, marginBottom: 14, borderWidth: 1, borderColor: colors.primary + '25' },
    hourValue:   { fontSize: 28, fontFamily: 'Inter-Black', color: colors.primary },
    hourLabel:   { fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginTop: 2 },
    saveBtn:     { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 4 },
    saveBtnText: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#fff' },
    gaugeCard:   { backgroundColor: colors.card, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
    insightCard: { backgroundColor: colors.primary + '10', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.primary + '25', marginBottom: 14 },
    insightText: { fontSize: 13, fontFamily: 'Inter-Regular', color: colors.text, lineHeight: 20 },
    row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLast:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    rankBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, minWidth: 54, alignItems: 'center' },
    rankText:    { fontSize: 13, fontFamily: 'Inter-Bold', color: '#fff' },
    // Readonly
    priceRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
    priceRowLast:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
    priceLbl:    { fontSize: 14, fontFamily: 'Inter-Medium', color: colors.text },
    priceSub:    { fontSize: 11, fontFamily: 'Inter-Regular', color: colors.textSecondary },
    priceVal:    { fontSize: 18, fontFamily: 'Inter-Bold' },
    alertCard:   { backgroundColor: colors.warning + '18', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.warning + '50', marginBottom: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    alertText:   { flex: 1, fontSize: 13, fontFamily: 'Inter-Regular', color: colors.text, lineHeight: 20 },
    tipCard:     { backgroundColor: colors.surface, borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    tipText:     { fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textSecondary, lineHeight: 18 },
    tipBold:     { fontFamily: 'Inter-SemiBold', color: colors.text },
    emptyState:  { alignItems: 'center', paddingVertical: 32, gap: 8 },
    emptyText:   { fontSize: 14, fontFamily: 'Inter-Regular', color: colors.textSecondary, textAlign: 'center' },
  });

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={S.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={S.header}>
        <TouchableOpacity style={S.back} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>
          {isReadonly ? 'Análise de Margem' : 'Markup & Precificação'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={S.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Banner do item (modo readonly) */}
        {!!prefillName && (
          <View style={S.banner}>
            {isService
              ? <Wrench size={16} color={colors.primary} />
              : <Package size={16} color={colors.primary} />
            }
            <Text style={S.bannerText} numberOfLines={1}>
              <Text style={{ fontFamily: 'Inter-Bold' }}>{prefillName}</Text>
              {isService ? '  •  Serviço' : '  •  Produto'}
            </Text>
          </View>
        )}

        {/* ══ MODO READONLY ═══════════════════════════════════════════════════ */}
        {isReadonly ? (
          <>
            {costBase <= 0 && !isService ? (
              <Card>
                <View style={S.emptyState}>
                  <Package size={36} color={colors.textSecondary} />
                  <Text style={S.emptyText}>
                    Este produto não tem custo cadastrado.{'\n'}
                    Edite-o para ver a análise de margem.
                  </Text>
                </View>
              </Card>
            ) : isService && valorHora <= 0 ? (
              <Card>
                <View style={S.emptyState}>
                  <Wrench size={36} color={colors.textSecondary} />
                  <Text style={S.emptyText}>
                    Configure sua meta mensal e horas trabalhadas{'\n'}
                    na tela de Markup para analisar este serviço.
                  </Text>
                </View>
              </Card>
            ) : (
              <>
                {abaixoSugerido && (
                  <View style={S.alertCard}>
                    <Text style={{ fontSize: 20 }}>⚠️</Text>
                    <Text style={S.alertText}>
                      Preço abaixo do sugerido mínimo.{'\n'}
                      Com 50% de lucro você cobraria{' '}
                      <Text style={{ fontFamily: 'Inter-Bold' }}>R$ {fmtBRL(precoSugerido50)}</Text>.
                    </Text>
                  </View>
                )}

                {/* ── Custo unitário ────────────────────────────────────── */}
                <Card style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Inter-SemiBold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
                    📦 Custo &amp; Preços
                  </Text>

                  {/* Custo por unidade */}
                  <View style={S.priceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={S.priceLbl}>🔴 Custo unitário</Text>
                      <Text style={S.priceSub}>
                        {isService ? 'custo do serviço' : 'quanto você gastou por unidade'}
                      </Text>
                    </View>
                    <Text style={[S.priceVal, { color: '#ef4444' }]}>
                      R$ {fmtBRL(precoMinimo)}
                    </Text>
                  </View>

                  {/* Sugerido 50% lucro */}
                  <View style={S.priceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={S.priceLbl}>🟡 Sugerido — 50% lucro</Text>
                      <Text style={S.priceSub}>custo × 1,5  →  33% de margem</Text>
                    </View>
                    <Text style={[S.priceVal, { color: '#f59e0b' }]}>
                      R$ {fmtBRL(precoSugerido50)}
                    </Text>
                  </View>

                  {/* Sugerido 100% lucro */}
                  <View style={S.priceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={S.priceLbl}>🟠 Sugerido — 100% lucro</Text>
                      <Text style={S.priceSub}>custo × 2,0  →  50% de margem</Text>
                    </View>
                    <Text style={[S.priceVal, { color: '#f97316' }]}>
                      R$ {fmtBRL(precoSugerido100)}
                    </Text>
                  </View>

                  {/* Atual cobrado */}
                  <View style={S.priceRowLast}>
                    <View style={{ flex: 1 }}>
                      <Text style={S.priceLbl}>🟢 Atual cobrado</Text>
                      <Text style={S.priceSub}>
                        {currentMargin >= 0
                          ? `${currentMargin.toFixed(1)}% de margem • lucro R$ ${fmtBRL(lucroUnitario)} / un.`
                          : costBase <= 0 ? 'Sem custo cadastrado' : 'Abaixo do custo!'}
                      </Text>
                    </View>
                    <Text style={[S.priceVal, { color: marginColor(currentMargin) }]}>
                      R$ {fmtBRL(currentPrice)}
                    </Text>
                  </View>
                </Card>

                {/* ── Termômetro de giro ───────────────────────────────── */}
                {!isService && (
                  <Card style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 11, fontFamily: 'Inter-SemiBold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
                      🌡️ Giro do Produto
                    </Text>

                    {/* Números do giro */}
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                      <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 12, alignItems: 'center' }}>
                        <Text style={{ fontSize: 26, fontFamily: 'Inter-Black', color: giroColor }}>
                          {soldLast30}
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: 'Inter-Regular', color: colors.textSecondary, textAlign: 'center', marginTop: 2 }}>
                          Unidades{'
'}vendidas (30d)
                        </Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 12, alignItems: 'center' }}>
                        <Text style={{ fontSize: 26, fontFamily: 'Inter-Black', color: colors.text }}>
                          {stockAtual}
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: 'Inter-Regular', color: colors.textSecondary, textAlign: 'center', marginTop: 2 }}>
                          Em estoque{'
'}agora
                        </Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: giroColor + '22', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: giroColor + '55' }}>
                        <Text style={{ fontSize: 26, fontFamily: 'Inter-Black', color: giroColor }}>
                          {giro > 0 ? giro.toFixed(1) : '—'}
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: 'Inter-SemiBold', color: giroColor, textAlign: 'center', marginTop: 2 }}>
                          {giroLabel}
                        </Text>
                      </View>
                    </View>

                    {/* Barra de termômetro */}
                    <View style={{ gap: 4, marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' }}>
                        <View style={{ flex: 3, backgroundColor: '#60a5fa' }} />
                        <View style={{ flex: 7, backgroundColor: '#f59e0b' }} />
                        <View style={{ flex: 10, backgroundColor: '#22c55e' }} />
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 9, fontFamily: 'Inter-SemiBold', color: '#60a5fa' }}>🧊 &lt;0.3 Baixo</Text>
                        <Text style={{ fontSize: 9, fontFamily: 'Inter-SemiBold', color: '#f59e0b' }}>⚖️ Normal</Text>
                        <Text style={{ fontSize: 9, fontFamily: 'Inter-SemiBold', color: '#22c55e' }}>🔥 &gt;1 Alto</Text>
                      </View>
                    </View>

                    {/* Sugestão */}
                    <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ fontSize: 13, fontFamily: 'Inter-Regular', color: colors.text, lineHeight: 20 }}>
                        {giroSugestao}
                      </Text>
                    </View>
                  </Card>
                )}

                {isService && (
                  <View style={S.tipCard}>
                    <Text style={S.tipText}>
                      <Text style={S.tipBold}>Custo do serviço: </Text>
                      R$ {fmtBRL(costBase)}{'\n'}
                      {materialCost > 0 && (
                        <><Text style={S.tipBold}>Material extra: </Text>R$ {fmtBRL(materialCost)}{'\n'}</>
                      )}
                      <Text style={S.tipBold}>Lucro por atendimento: </Text>
                      R$ {fmtBRL(lucroUnitario)}
                    </Text>
                  </View>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {/* ══ MODO NORMAL ════════════════════════════════════════════════ */}

            {/* ── BLOCO A: Configuração do negócio ──────────────────────────── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 }}>
              <Text style={[S.secTitle, { marginBottom: 0, marginTop: 0 }]}>Como está seu negócio?</Text>
              {locked && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: colors.surface, borderRadius: 6, borderWidth: 1, borderColor: colors.border }}>
                  <Lock size={11} color={colors.textSecondary} />
                  <Text style={{ fontSize: 10, fontFamily: 'Inter-SemiBold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Travado
                  </Text>
                </View>
              )}
            </View>

            <Text style={S.label}>Meta de ganho mensal (R$)</Text>
            <Text style={S.labelSub}>O que você quer tirar para você</Text>
            <TextInput
              style={[S.input, locked && { backgroundColor: colors.surface, color: colors.textSecondary }]}
              value={config.metaMensal}
              onChangeText={v => setConfig(c => ({ ...c, metaMensal: v }))}
              placeholder="Ex: 4.000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              editable={!locked}
            />

            <Text style={S.label}>Custos fixos mensais (R$)</Text>
            <Text style={S.labelSub}>Aluguel, luz, internet, MEI…</Text>
            <TextInput
              style={[S.input, locked && { backgroundColor: colors.surface, color: colors.textSecondary }]}
              value={config.custoFixo}
              onChangeText={v => setConfig(c => ({ ...c, custoFixo: v }))}
              placeholder="Ex: 1.500"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              editable={!locked}
            />

            <Text style={S.label}>Horas trabalhadas por semana</Text>
            <TextInput
              style={[S.input, locked && { backgroundColor: colors.surface, color: colors.textSecondary }]}
              value={config.horasSemana}
              onChangeText={v => setConfig(c => ({ ...c, horasSemana: v }))}
              placeholder="Ex: 40"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              editable={!locked}
            />

            {/* Resultado: valor por hora */}
            <View style={S.hourCard}>
              {valorHora > 0 ? (
                <>
                  <Text style={S.hourValue}>R$ {fmtBRL(valorHora)}/hora</Text>
                  <Text style={S.hourLabel}>
                    (R$ {fmtBRL(meta)} meta + R$ {fmtBRL(fixo)} fixos) ÷ {fmtBRL(horas * 4.33)} horas/mês
                  </Text>
                </>
              ) : (
                <Text style={[S.hourLabel, { fontStyle: 'italic' }]}>
                  Preencha os campos acima para ver seu valor por hora.
                </Text>
              )}
            </View>

            {locked ? (
              <TouchableOpacity
                style={[S.saveBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary }]}
                onPress={() => setLocked(false)}
                activeOpacity={0.85}
              >
                <Edit3 size={18} color={colors.primary} />
                <Text style={[S.saveBtnText, { color: colors.primary }]}>Editar configuração</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={S.saveBtn} onPress={saveConfig} activeOpacity={0.85}>
                <Save size={18} color="#fff" />
                <Text style={S.saveBtnText}>Salvar configuração</Text>
              </TouchableOpacity>
            )}

            {/* ── BLOCO B: Painel da carteira ───────────────────────────────── */}
            {panelData && panelData.ranked.length > 0 && (
              <>
                <View style={S.divider} />
                <Text style={S.secTitle}>Painel da carteira</Text>

                {/* Gauge */}
                <View style={S.gaugeCard}>
                  <GaugeBar margin={panelData.weightedMargin} colors={colors} />
                </View>

                {/* Insight */}
                {insight && (
                  <View style={S.insightCard}>
                    <Text style={S.insightText}>
                      <Text style={{ fontFamily: 'Inter-SemiBold' }}>💡 </Text>
                      {insight}
                    </Text>
                  </View>
                )}

                {/* Ranking — mais lucrativos (top 5) */}
                <Card style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Inter-SemiBold', color: '#22c55e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    🟢 Mais lucrativos
                  </Text>
                  {panelData.ranked.slice(0, 5).map((p, i, arr) => (
                    <View
                      key={p.id}
                      style={i === arr.length - 1 ? S.rowLast : S.row}
                    >
                      <Text style={{ width: 24, fontSize: 12, color: colors.textSecondary, fontFamily: 'Inter-Regular' }}>
                        {i + 1}°
                      </Text>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {p.type === 'service'
                          ? <Wrench size={12} color={colors.textSecondary} />
                          : <Package size={12} color={colors.textSecondary} />
                        }
                        <Text style={{ flex: 1, fontSize: 14, fontFamily: 'Inter-Regular', color: colors.text }} numberOfLines={1}>
                          {p.name}
                        </Text>
                      </View>
                      <View style={[S.rankBadge, { backgroundColor: marginColor(p.margin) }]}>
                        <Text style={S.rankText}>{p.margin.toFixed(1)}%</Text>
                      </View>
                    </View>
                  ))}
                </Card>

                {/* Ranking — menor margem / em risco (bottom 5) */}
                {panelData.ranked.length > 1 && (() => {
                  const worst = [...panelData.ranked].reverse().slice(0, 5);
                  // só mostra se houver itens com margem < 30% OU se quiser "só pra saber"
                  const hasRisk = worst.some(p => p.margin < 30);
                  if (!hasRisk && panelData.ranked.length < 6) return null;
                  return (
                    <Card style={{ marginBottom: 14 }}>
                      <Text style={{ fontSize: 12, fontFamily: 'Inter-SemiBold', color: '#ef4444', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        🔴 Menor margem
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginBottom: 10 }}>
                        Nem sempre é erro — pode ser estratégia. Só pra você saber quais sustentam menos o caixa.
                      </Text>
                      {worst.map((p, i, arr) => (
                        <View
                          key={p.id}
                          style={i === arr.length - 1 ? S.rowLast : S.row}
                        >
                          <Text style={{ width: 24, fontSize: 12, color: colors.textSecondary, fontFamily: 'Inter-Regular' }}>
                            {i + 1}°
                          </Text>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {p.type === 'service'
                              ? <Wrench size={12} color={colors.textSecondary} />
                              : <Package size={12} color={colors.textSecondary} />
                            }
                            <Text style={{ flex: 1, fontSize: 14, fontFamily: 'Inter-Regular', color: colors.text }} numberOfLines={1}>
                              {p.name}
                            </Text>
                          </View>
                          <View style={[S.rankBadge, { backgroundColor: marginColor(p.margin) }]}>
                            <Text style={S.rankText}>{p.margin.toFixed(1)}%</Text>
                          </View>
                        </View>
                      ))}
                    </Card>
                  );
                })()}
              </>
            )}

            {!panelData && (
              <View style={S.tipCard}>
                <Text style={S.tipText}>
                  <Text style={S.tipBold}>💡 Painel da carteira: </Text>
                  aparece aqui assim que você tiver produtos ou serviços cadastrados.
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
