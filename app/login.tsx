import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { AntDesign } from '@expo/vector-icons';
import Constants from 'expo-constants';
import Svg, { Defs, LinearGradient, Stop, Circle, Rect } from 'react-native-svg';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  // Fica em true apos o WebBrowser fechar, ate o AuthContext detectar a sessao
  const [waitingAuth, setWaitingAuth] = useState(false);

  const appVersion = Constants?.expoConfig?.version || '1.0.0';

  const handleLogin = async () => {
    console.log('[Login] Botão de login pressionado. Iniciando fluxo Google...');
    setLoading(true);
    let browserClosed = false;
    try {
      const { error } = await signInWithGoogle(() => {
        // Chamado imediatamente quando o browser fecha com sucesso,
        // antes do exchangeCodeForSession — mostra overlay sem esperar rede
        browserClosed = true;
        setLoading(false);
        setWaitingAuth(true);
        console.log('[Login] Browser fechou com sucesso — overlay "Entrando..." exibido. Aguardando exchangeCodeForSession...');
      });

      console.log('[Login] signInWithGoogle resolveu.', { browserClosed, hasError: !!error });

      if (error) {
        // Erro na troca de código ou na sessão — remove overlay e alerta
        console.warn('[Login] Erro retornado pelo signInWithGoogle:', error);
        setWaitingAuth(false);
        setLoading(false);
        Alert.alert('Erro ao entrar', error);
      } else if (!browserClosed) {
        // Usuário cancelou o browser (type === 'cancel') — apenas remove loading
        console.log('[Login] Browser cancelado pelo usuário. Nenhuma ação necessária.');
        setLoading(false);
      } else {
        // Sucesso: overlay já está visível, onAuthStateChange vai acionar o redirect.
        // Timeout de segurança caso o AuthGate demore (ex: sessão lenta no Supabase).
        console.log('[Login] Aguardando onAuthStateChange → AuthGate → /loading...');
        setTimeout(() => {
          console.warn('[Login] Timeout de segurança atingido (15s). Limpando overlay.');
          setWaitingAuth(false);
        }, 15000);
      }
    } catch (e: any) {
      console.error('[Login] Erro inesperado no handleLogin:', e?.message ?? e);
      setWaitingAuth(false);
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#0F172A',
    },
    bg: {
      ...StyleSheet.absoluteFillObject,
    },
    inner: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: 44,
    },
    logo: {
      width: 84,
      height: 84,
      borderRadius: 18,
      marginBottom: 18,
    },
    brand: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: '#F1F5F9',
      marginBottom: 6,
      textAlign: 'center',
    },
    tagline: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: '#94A3B8',
      textAlign: 'center',
      lineHeight: 20,
    },
    card: {
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      borderRadius: 20,
      padding: 28,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 24,
      elevation: 10,
    },
    cardTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: '#F1F5F9',
      textAlign: 'center',
      marginBottom: 24,
    },
    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingVertical: 15,
      paddingHorizontal: 20,
      gap: 12,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },
    googleBtnDisabled: {
      opacity: 0.6,
    },
    googleText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#1F1F1F',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    dividerText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: '#475569',
    },
    helpText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: '#64748B',
      textAlign: 'center',
      lineHeight: 18,
    },
    version: {
      fontSize: 11,
      fontFamily: 'Inter-Regular',
      color: '#64748B',
      textAlign: 'center',
      marginTop: 24,
    },
  });

  return (
    <View style={s.root}>
      {/* Overlay de transicao apos login bem-sucedido */}
      {waitingAuth && (
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', zIndex: 99 }}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={{ color: '#94A3B8', marginTop: 16, fontFamily: 'Inter-Regular', fontSize: 14 }}>
            Entrando na sua conta...
          </Text>
        </View>
      )}
      {/* Background SVG */}
      <View pointerEvents="none" style={s.bg}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <Defs>
            <LinearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#0F172A" stopOpacity="1" />
              <Stop offset="100%" stopColor="#1E293B" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#4F46E5" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.2" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="400" height="800" fill="url(#g1)" />
          <Circle cx="50" cy="130" r="110" fill="url(#g2)" />
          <Circle cx="370" cy="80" r="130" fill="url(#g2)" />
          <Circle cx="340" cy="700" r="160" fill="url(#g2)" />
          <Circle cx="30" cy="660" r="90" fill="url(#g2)" />
        </Svg>
      </View>

      <View style={s.inner}>
        {/* Header */}
        <View style={s.header}>
          <Image
            source={require('@/assets/images/logo-nova-spl.png')}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.brand}>Vendas, Estoque e Fiado (PDV)</Text>
          <Text style={s.tagline}>
            Gerencie vendas, estoque e fiados do {'\n'}seu negocio de forma super simples.
          </Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Acesse sua conta</Text>

          <TouchableOpacity
            style={[s.googleBtn, loading && s.googleBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#4285F4" size="small" />
            ) : (
              <AntDesign name="google" size={22} color="#4285F4" />
            )}
            <Text style={s.googleText}>
              {loading ? 'Abrindo Google...' : 'Continuar com Google'}
            </Text>
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>seguro e rápido</Text>
            <View style={s.dividerLine} />
          </View>

          <Text style={s.helpText}>
            Usamos apenas seu e-mail e nome para identificar sua conta.{'\n'}
            Nunca postamos nada em seu nome. 🔒
          </Text>
        </View>

        <Text style={s.version}>Versão {appVersion} • PT-BR</Text>
      </View>
    </View>
  );
}
