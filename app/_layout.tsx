import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import * as Linking from 'expo-linking';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useEffect as useEffect2 } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import db from '@/lib/db';
import { initializeIAP, restorePurchases } from '@/lib/iap';
import { checkSubscriptionFromDatabase, isPremium } from '@/lib/premium';
import { supabase } from '@/lib/supabase';

// SplashScreen handles preventing auto hide
// SplashScreen.preventAutoHideAsync(); is called above
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loading) return;

    const inLogin = segments[0] === 'login';

    if (!isAuthenticated && !inLogin) {
      router.replace('/login');
      // Espera um pouco para garantir que a rota de navegação mudou e não piscar a interface
      setTimeout(() => setIsReady(true), 150);
    } else if (isAuthenticated && inLogin) {
      router.replace('/');
      setTimeout(() => setIsReady(true), 150);
    } else {
      setIsReady(true);
    }
  }, [isAuthenticated, loading, segments]);

  // Se estiver carregando auth ou ainda roteando, exibe uma tela de transição suave
  if (loading || !isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // Double check de segurança
  const inLogin = segments[0] === 'login';
  if (!isAuthenticated && !inLogin) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await db.initDB();
        await initializeIAP();
        await checkSubscriptionFromDatabase();
        const premium = await isPremium();
        if (!premium) {
          try { await restorePurchases(); } catch { }
        }
      } catch (err) {
        console.error('Error initializing app:', err);
      }
    };

    initializeApp();

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // ─── Deep Link Listener — captura o callback do Google OAuth ─────────────
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (!url) return;
      // Supabase envia o code PKCE ou access_token no deep link lojaapp://
      if (typeof url === 'string' && (url.includes('code=') || url.includes('access_token'))) {
        try {
          const codeMatch = url.match(/code=([^&#]+)/);
          if (codeMatch && codeMatch[1]) {
            await supabase.auth.exchangeCodeForSession(codeMatch[1]);
          } else if (url.includes('access_token=')) {
            // Implicit flow web compat, usually not used in iOS/Android PKCE
            console.warn('[Auth] Implicit flow access_token recebido');
          }
          // onAuthStateChange vai detectar SIGNED_IN → AuthGate navega para '/'
        } catch (e) {
          console.warn('[Auth] Falha ao processar deep link:', e);
        }
      }
    };

    // 1. App em background — recebe o deep link via evento
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // 2. App estava fechado — foi aberto diretamente pelo deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemeBootstrapper />
        <AuthProvider>
          <OfflineProvider>
            <NotificationProvider>
              <AuthGate>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="login" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="settings" />
                  <Stack.Screen name="relatorios" />
                  <Stack.Screen name="premium" />
                  <Stack.Screen name="planos" />
                  <Stack.Screen name="notifications" />
                  <Stack.Screen name="cliente-detalhe" />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </AuthGate>
              <ThemedStatusBar />
            </NotificationProvider>
          </OfflineProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedStatusBar() {
  // Color the status bar to match the header and force light icons for contrast
  const { colors } = useTheme();
  return (
    <StatusBar backgroundColor={colors.topbar} style="light" />
  );
}


function ThemeBootstrapper() {
  const { setPrimaryColor, setSecondaryColor } = useTheme();
  useEffect2(() => {
    (async () => {
      try {
        const { loadStoreSettings } = await import('@/lib/data-loader');
        const data = await loadStoreSettings() as any;
        if (data && typeof data === 'object') {
          if (data.primaryColor) setPrimaryColor(data.primaryColor);
          if (data.secondaryColor) setSecondaryColor(data.secondaryColor);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);
  return null;
}
