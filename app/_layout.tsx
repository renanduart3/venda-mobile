import { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, LogBox } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

// ─── Silencia todos os logs em produção ───────────────────────────────────────
// Em desenvolvimento (__DEV__ === true) tudo funciona normalmente.
// Em produção (APK/AAB) console.log/warn/info/debug viram no-ops automaticamente.
// console.error é mantido silencioso também — erros reais devem usar um serviço
// de crash reporting (ex: Sentry) se necessário no futuro.
if (!__DEV__) {
  console.log   = () => {};
  console.warn  = () => {};
  console.error = () => {};
  console.info  = () => {};
  console.debug = () => {};
}

LogBox.ignoreLogs(['Unable to activate keep awake']);
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useEffect as useEffect2 } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import db from '@/lib/db';
import { initializeIAP } from '@/lib/iap';
import { checkSubscriptionFromDatabase, isPremium } from '@/lib/premium';

// SplashScreen handles preventing auto hide
// SplashScreen.preventAutoHideAsync(); is called above
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const hasShownLoading = useRef(false);

  useEffect(() => {
    if (loading) return;

    const inLogin = segments[0] === 'login';

    console.log('[AuthGate] Estado atualizado.', {
      isAuthenticated,
      inLogin,
      segment: segments[0],
      hasShownLoading: hasShownLoading.current,
    });

    if (!isAuthenticated && !inLogin) {
      hasShownLoading.current = false; // reset para próximo login
      console.log('[AuthGate] Não autenticado fora do login → router.replace(/login)');
      router.replace('/login');
      setTimeout(() => setIsReady(true), 150);
    } else if (isAuthenticated && inLogin) {
      if (!hasShownLoading.current) {
        // Primeiro login da sessão: passa pela tela de loading para inicializar dados
        hasShownLoading.current = true;
        console.log('[AuthGate] Autenticado na tela de login (1ª vez) → router.replace(/loading)');
        router.replace('/loading');
      } else {
        // Reload em dev ou retorno à tela de login após já ter carregado:
        // pula o loading, vai direto para home
        console.log('[AuthGate] Autenticado na tela de login (reload/retorno) → router.replace(/)');
        router.replace('/');
      }
      setTimeout(() => setIsReady(true), 150);
    } else {
      // Sessão restaurada do storage (INITIAL_SESSION) enquanto já estava em outra rota:
      // SubscriptionBootstrapper + telas individuais cuidam dos dados — não precisa de /loading
      if (isAuthenticated) {
        console.log('[AuthGate] Sessão restaurada, já em rota autenticada → sem redirect.');
      }
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
      } catch (err) {
        console.error('Error initializing app:', err);
      }
    };

    initializeApp();

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemeBootstrapper />
        <AuthProvider>
          <SubscriptionBootstrapper />
          <OfflineProvider>
            <NotificationProvider>
              <AuthGate>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="login" />
                  <Stack.Screen name="loading" />
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

function SubscriptionBootstrapper() {
  const { loading, isAuthenticated, user } = useAuth();
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user?.id) {
      setSyncedUserId(null);
      return;
    }

    if (syncedUserId === user.id) {
      return;
    }

    let cancelled = false;

    const syncSubscription = async () => {
      try {
        await checkSubscriptionFromDatabase();
        await isPremium();
      } catch (error) {
        console.warn('[Premium] Falha ao sincronizar assinatura no bootstrap:', error);
      } finally {
        if (!cancelled) {
          setSyncedUserId(user.id);
        }
      }
    };

    syncSubscription();

    return () => {
      cancelled = true;
    };
  }, [loading, isAuthenticated, user?.id, syncedUserId]);

  return null;
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
