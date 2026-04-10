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
//review
import { TextInput, Modal } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  // Fica em true apos o WebBrowser fechar, ate o AuthContext detectar a sessao
  const [waitingAuth, setWaitingAuth] = useState(false);

  const appVersion = Constants?.expoConfig?.version || '1.0.0';

  // review
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [reviewerModalVisible, setReviewerModalVisible] = useState(false);
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [reviewerLoading, setReviewerLoading] = useState(false);


  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error, cancelled } = await signInWithGoogle();
      if (cancelled) {
        // Usuário fechou o seletor de conta do Google — não é erro
        setLoading(false);
      } else if (error) {
        Alert.alert('Erro ao entrar', error);
        setLoading(false);
      } else {
        // Login concluído — aguarda o onAuthStateChange redirecionar via AuthGate
        // Mantemos overlay de loading para não deixar o usuário sem feedback
        setLoading(false);
        setWaitingAuth(true);
        // Timeout de segurança: se em 15s não navegar, libera o botão novamente
        setTimeout(() => setWaitingAuth(false), 15000);
      }
    } catch {
      setLoading(false);
    }
  };
  // 3. Adiciona essa função (junto com o handleLogin)
  const handleLogoTap = () => {
    const now = Date.now();
    // reseta se demorou mais de 2s entre taps
    const newCount = now - lastTapTime < 2000 ? tapCount + 1 : 1;
    setTapCount(newCount);
    setLastTapTime(now);
    if (newCount >= 7) {
      setTapCount(0);
      setReviewerModalVisible(true);
    }
  };

  const handleReviewerLogin = async () => {
    if (reviewerEmail.trim() !== 'google_reviewer_001@gmail.com') {
      Alert.alert('Usuário não reconhecido');
      return;
    }
    setReviewerLoading(true);
    try {
      // injeta sessão fake direto no AuthContext via signInWithPassword
      // o usuário reviewer tem senha vazia — autenticação bypassa o Google
      const { error } = await supabase.auth.signInWithPassword({
        email: 'google_reviewer_001@gmail.com',
        password: 'reviewer_access_2026',
      });
      if (error) throw error;
      setReviewerModalVisible(false);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setReviewerLoading(false);
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
      textAlign: 'center',
      marginBottom: 6,
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
          <TouchableOpacity onPress={handleLogoTap} activeOpacity={1}>
            <Image
              source={require('@/assets/images/logo-nova-spl.png')}
              style={s.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
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

      <Modal
        visible={reviewerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewerModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}>
          <View style={{
            backgroundColor: '#1E293B',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}>
            <Text style={{ color: '#F1F5F9', fontSize: 16, fontFamily: 'Inter-SemiBold', marginBottom: 16 }}>
              Reviewer Access
            </Text>
            <TouchableOpacity
              onPress={() => setReviewerModalVisible(false)}
              style={{ alignSelf: 'flex-end', marginBottom: 8 }}
            >
              <Text style={{ color: '#94A3B8', fontSize: 22, lineHeight: 22 }}>✕</Text>
            </TouchableOpacity>
            <TextInput
              value={reviewerEmail}
              onChangeText={setReviewerEmail}
              placeholder="reviewer email"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                backgroundColor: '#0F172A',
                borderRadius: 10,
                padding: 14,
                color: '#F1F5F9',
                fontFamily: 'Inter-Regular',
                fontSize: 14,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            />
            <TouchableOpacity
              onPress={handleReviewerLogin}
              disabled={reviewerLoading}
              style={{
                backgroundColor: '#4F46E5',
                borderRadius: 10,
                padding: 14,
                alignItems: 'center',
              }}
            >
              {reviewerLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ color: '#fff', fontFamily: 'Inter-SemiBold', fontSize: 15 }}>Entrar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}
