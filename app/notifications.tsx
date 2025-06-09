import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { 
  ArrowLeft,
  Bell,
  AlertTriangle,
  Package,
  DollarSign,
  TrendingDown,
  CheckCircle,
  Trash2
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { router } from 'expo-router';

export default function Notifications() {
  const { colors } = useTheme();
  const { notifications, markAsResolved, clearAll } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <Package size={20} color={colors.warning} />;
      case 'overdue_expense':
        return <DollarSign size={20} color={colors.error} />;
      case 'no_sales':
        return <TrendingDown size={20} color={colors.warning} />;
      default:
        return <Bell size={20} color={colors.primary} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'low_stock':
        return colors.warning;
      case 'overdue_expense':
        return colors.error;
      case 'no_sales':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  const handleNotificationAction = (notification: any) => {
    // Navigate to relevant screen based on notification type
    switch (notification.type) {
      case 'low_stock':
        router.push('/(tabs)/produtos');
        break;
      case 'overdue_expense':
        router.push('/(tabs)/financas');
        break;
      case 'no_sales':
        router.push('/(tabs)/vendas');
        break;
    }
    markAsResolved(notification.id);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Agora há pouco';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
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
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.card,
    },
    title: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    clearButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.error + '20',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      marginBottom: 16,
      padding: 20,
      borderRadius: 50,
      backgroundColor: colors.surface,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    notificationCard: {
      marginBottom: 12,
    },
    notificationItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    notificationIcon: {
      padding: 8,
      borderRadius: 8,
      marginTop: 4,
    },
    notificationContent: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    notificationTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    notificationTime: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    notificationMessage: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 12,
      lineHeight: 20,
    },
    notificationActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
    },
    resolveButton: {
      backgroundColor: colors.success + '20',
      borderColor: colors.success,
    },
    resolveButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: colors.success,
    },
    dismissButton: {
      backgroundColor: colors.border,
      borderColor: colors.border,
    },
    dismissButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: colors.textSecondary,
    },
    resolvedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.success + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    resolvedText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: colors.success,
    },
  });

  if (notifications.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Notificações</Text>
          </View>
        </View>
        
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Bell size={40} color={colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
          <Text style={styles.emptyText}>
            Você está em dia! Não há alertas ou notificações pendentes.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Notificações</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearAll}
        >
          <Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: notification }) => (
          <Card style={styles.notificationCard}>
            <View style={styles.notificationItem}>
              <View style={[
                styles.notificationIcon,
                { backgroundColor: getNotificationColor(notification.type) + '20' }
              ]}>
                {getNotificationIcon(notification.type)}
              </View>
              
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {formatTimestamp(notification.timestamp)}
                  </Text>
                </View>
                
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                
                {notification.resolved ? (
                  <View style={styles.resolvedBadge}>
                    <CheckCircle size={12} color={colors.success} />
                    <Text style={styles.resolvedText}>Resolvido</Text>
                  </View>
                ) : (
                  <View style={styles.notificationActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.resolveButton]}
                      onPress={() => handleNotificationAction(notification)}
                    >
                      <Text style={styles.resolveButtonText}>Resolver</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.dismissButton]}
                      onPress={() => markAsResolved(notification.id)}
                    >
                      <Text style={styles.dismissButtonText}>Dispensar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}