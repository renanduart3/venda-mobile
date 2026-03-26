import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
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
        <View style={styles.logoArea}>
          <Text style={styles.appName}>Vendas, Estoque e Fiado</Text>
          <Text style={styles.tagline}>PDV — Gestão simplificada do seu negócio</Text>
        </View>
        <ActivityIndicator size="large" color="#4F46E5" style={styles.spinner} />
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
  logoArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  spinner: {
    marginBottom: 20,
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
