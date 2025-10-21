import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import db from '@/lib/db';
import { initializeIAP } from '@/lib/iap';
import { checkSubscriptionFromDatabase } from '@/lib/premium';

SplashScreen.preventAutoHideAsync();

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
    <ThemeProvider>
      <OfflineProvider>
        <NotificationProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="relatorios" />
            <Stack.Screen name="premium" />
            <Stack.Screen name="planos" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="cliente-detalhe" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </NotificationProvider>
      </OfflineProvider>
    </ThemeProvider>
  );
}