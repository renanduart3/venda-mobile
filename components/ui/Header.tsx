import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, Settings, Wifi, WifiOff, Crown } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useOffline } from '@/contexts/OfflineContext';
import { useRouter } from 'expo-router';
import { isPremium } from '@/lib/premium';

interface HeaderProps {
  title: string;
  showSettings?: boolean;
}

export function Header({ title, showSettings = false }: HeaderProps) {
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
  const { isOnline } = useOffline();
  const router = useRouter();
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await isPremium();
        if (mounted) setPremium(p);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const styles = StyleSheet.create({
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    notificationButton: {
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: colors.white,
      fontSize: 12,
      fontFamily: 'Inter-Bold',
    },
    connectionIndicator: {
      padding: 4,
      borderRadius: 4,
      backgroundColor: isOnline ? colors.success : colors.error,
    },
  });

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.rightSection}>
        <View style={styles.connectionIndicator}>
          {premium ? (
            isOnline ? (
              <Wifi size={16} color={colors.white} />
            ) : (
              <WifiOff size={16} color={colors.white} />
            )
          ) : (
            <TouchableOpacity onPress={() => router.push('/premium' as any)}>
              <Crown size={16} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.notificationButton, { padding: 6 }]}
          onPress={() => router.push('/notifications' as any)}
        >
          <Bell size={24} color={colors.text} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {showSettings && (
          <TouchableOpacity onPress={() => router.push('/settings' as any)} style={{ padding: 6 }}>
            <Settings size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}