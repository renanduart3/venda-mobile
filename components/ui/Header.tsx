import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, Settings, Crown, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'expo-router';
import { isPremium } from '@/lib/premium';

interface HeaderProps {
  title: string;
  showSettings?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
}

export function Header({ title, showSettings = false, showBack = false, onBackPress }: HeaderProps) {
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
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
    premiumBadge: {
      position: 'relative',
      padding: 6,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    premiumBadgeText: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: colors.warning,
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 2,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    premiumBadgeLabel: {
      fontSize: 8,
      fontFamily: 'Inter-Bold',
      color: colors.white,
    },
  });

  return (
    <View style={styles.header}>
      {showBack && (
        <TouchableOpacity 
          onPress={onBackPress || (() => router.back())}
          style={{ padding: 8, marginRight: 8 }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
      )}
      <Text style={[styles.title, showBack && { flex: 1, textAlign: 'center' }]}>{title}</Text>

      <View style={styles.rightSection}>
        {!premium && (
          <TouchableOpacity
            style={styles.premiumBadge}
            onPress={() => router.push('/planos')}
          >
            <Crown size={16} color={colors.white} />
            <View style={styles.premiumBadgeText}>
              <Text style={styles.premiumBadgeLabel}>PREMIUM</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.notificationButton, { padding: 6 }]}
          onPress={() => router.push('/notifications')}
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
          <TouchableOpacity onPress={() => {
            console.log('Navegando para settings...');
            try {
              router.push('/settings' as any);
            } catch (error) {
              console.error('Erro na navegação:', error);
            }
          }} style={{ padding: 6 }}>
            <Settings size={24} color={colors.text} />
          </TouchableOpacity>
        )}

      </View>
    </View>
  );
}