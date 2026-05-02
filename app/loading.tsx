import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';

const STEPS = [
  'Carregando configurações...',
  'Verificando plano...',
  'Preparando dados...',
  'Quase pronto...',
];

export default function LoadingScreen() {
  const [step, setStep] = useState(0);
  const appVersion = Constants?.expoConfig?.version || '1.0.0';

  // Breathe animation
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();

    // Continuous breathe loop
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.08,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    );
    breatheLoop.start();
    return () => breatheLoop.stop();
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setStep(0);
        const { loadStoreSettings } = await import('@/lib/data-loader');
        await loadStoreSettings();
        if (!mounted) return;

        setStep(1);
        try {
          const { checkSubscriptionFromDatabase, isPremium } = await import('@/lib/premium');
          await checkSubscriptionFromDatabase();
          await isPremium();
        } catch {
          // premium check is non-critical
        }
        if (!mounted) return;

        setStep(2);
        const { loadProducts, loadCustomers } = await import('@/lib/data-loader');
        await Promise.all([loadProducts(), loadCustomers()]);
        if (!mounted) return;

        setStep(3);
        await new Promise(resolve => setTimeout(resolve, 350));
        if (!mounted) return;

        router.replace('/');
      } catch (error) {
        console.error('[Loading] Erro na inicialização:', error);
        if (mounted) router.replace('/');
      }
    };

    initialize();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: fadeAnim,
              transform: [{ scale: breatheAnim }],
            },
          ]}
        >
          <Image
            source={require('../assets/images/logo-nova-spl.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.textArea, { opacity: fadeAnim }]}>
          <Text style={styles.appName}>Venda, Estoque & Fiado</Text>
          <Text style={styles.tagline}>PDV — Gestão simplificada do seu negócio</Text>
        </Animated.View>

        <ActivityIndicator size="large" color="#6366F1" style={styles.spinner} />
        <Text style={styles.stepText}>{STEPS[step]}</Text>
      </View>
      <Text style={styles.version}>Versão {appVersion} • PT-BR</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoWrapper: {
    marginBottom: 28,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  logoImage: {
    width: 160,
    height: 160,
  },
  textArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  tagline: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    textAlign: 'center',
  },
  spinner: {
    marginBottom: 16,
  },
  stepText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  version: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
    paddingBottom: 32,
  },
});
