import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import Constants from 'expo-constants';
import Svg, { Defs, LinearGradient, Stop, Circle, Rect } from 'react-native-svg';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
      justifyContent: 'center',
    },
    bgWrap: {
      ...StyleSheet.absoluteFillObject,
    },
    headerWrap: {
      alignItems: 'center',
      marginBottom: 40,
    },
    brand: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginTop: 8,
    },
    tagline: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 6,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
      elevation: 3,
    },
    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1F1F1F',
      borderColor: '#303134',
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 14,
    },
    googleText: {
      marginLeft: 10,
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    help: {
      marginTop: 16,
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
    },
    versionText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    logo: {
      width: 88,
      height: 88,
      borderRadius: 18,
      marginBottom: 12,
    },
  });

  const handleLogin = async () => {
    await signInWithGoogle();
    router.replace('/');
  };

  const appVersion = Constants?.expoConfig?.version || '1.0.0';

  return (
    <View style={styles.container}>
      {/* Background SVG */}
      <View pointerEvents="none" style={styles.bgWrap}>
        <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
          <Defs>
            <LinearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#0F172A" stopOpacity="1" />
              <Stop offset="100%" stopColor="#1E293B" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="grad2" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#6366F1" stopOpacity="0.35" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="400" height="800" fill="url(#grad1)" />
          <Circle cx="60" cy="120" r="90" fill="url(#grad2)" />
          <Circle cx="360" cy="90" r="120" fill="url(#grad2)" />
          <Circle cx="340" cy="720" r="160" fill="url(#grad2)" />
          <Circle cx="40" cy="640" r="100" fill="url(#grad2)" />
        </Svg>
      </View>
      <View style={styles.headerWrap}>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brand}>Loja Inteligente</Text>
        <Text style={styles.tagline}>Acesse com sua conta Google para continuar</Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.googleBtn} onPress={handleLogin} disabled={loading}>
          <AntDesign name="google" size={20} color="#4285F4" />
          <Text style={styles.googleText}>{loading ? 'Carregando...' : 'Continuar com Google'}</Text>
        </TouchableOpacity>
        <Text style={styles.help}>Usaremos apenas para identificar e sincronizar seus dados.</Text>
        <Text style={[styles.versionText, { marginTop: 16 }]}>Versão {appVersion} • PT-BR</Text>
      </View>
    </View>
  );
}


