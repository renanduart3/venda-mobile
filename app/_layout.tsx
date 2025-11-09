import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import db from '@/lib/db';
import { initializeIAP, restorePurchases } from '@/lib/iap';
import { checkSubscriptionFromDatabase, isPremium } from '@/lib/premium';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inLogin = segments.join('/') === 'login';
    if (!isAuthenticated && !inLogin) {
      router.replace('/login');
    }
    if (isAuthenticated && inLogin) {
      router.replace('/');
    }
  }, [isAuthenticated, loading, segments]);

  if (loading) return null;
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
          try { await restorePurchases(); } catch {}
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

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
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
