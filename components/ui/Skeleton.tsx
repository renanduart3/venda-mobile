import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  const { colors } = useTheme();
  
  return (
    <View 
      style={[
        {
          width,
          height,
          backgroundColor: colors.border,
          borderRadius,
        },
        style
      ]} 
    />
  );
}

interface SkeletonCardProps {
  showImage?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showActions?: boolean;
}

export function SkeletonCard({ 
  showImage = true, 
  showTitle = true, 
  showSubtitle = true, 
  showActions = true 
}: SkeletonCardProps) {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    image: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: colors.border,
    },
    info: {
      flex: 1,
      gap: 8,
    },
    title: {
      height: 16,
      backgroundColor: colors.border,
      borderRadius: 4,
    },
    subtitle: {
      height: 14,
      backgroundColor: colors.border,
      borderRadius: 4,
      width: '70%',
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    action: {
      width: 32,
      height: 32,
      borderRadius: 6,
      backgroundColor: colors.border,
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        {showImage && <View style={styles.image} />}
        <View style={styles.info}>
          {showTitle && <View style={styles.title} />}
          {showSubtitle && <View style={styles.subtitle} />}
        </View>
        {showActions && (
          <View style={styles.actions}>
            <View style={styles.action} />
            <View style={styles.action} />
          </View>
        )}
      </View>
    </View>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionText, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    actionButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    actionText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.white,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionText && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
