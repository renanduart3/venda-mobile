import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

type AppAlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AppAlertOptions = {
  cancelable?: boolean;
  onDismiss?: () => void;
};

type AppAlertRequest = {
  title: string;
  message?: string;
  buttons: AppAlertButton[];
  options?: AppAlertOptions;
};

function normalizeButtons(buttons?: AppAlertButton[]): AppAlertButton[] {
  if (!buttons || buttons.length === 0) {
    return [{ text: 'OK', style: 'default' }];
  }

  return buttons.map((button) => ({
    ...button,
    text: button.text || 'OK',
  }));
}

function getTone(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('erro') || lower.includes('falha') || lower.includes('inválido')) return 'error';
  if (lower.includes('sucesso') || lower.includes('confirmado') || lower.includes('salvo')) return 'success';
  if (lower.includes('atenção') || lower.includes('aviso') || lower.includes('premium') || lower.includes('confirmar')) return 'warning';
  return 'info';
}

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<AppAlertRequest | null>(null);
  const queueRef = useRef<AppAlertRequest[]>([]);
  const originalAlertRef = useRef(Alert.alert);

  const enqueueAlert = useCallback((request: AppAlertRequest) => {
    setCurrent((active) => {
      if (active) {
        queueRef.current.push(request);
        return active;
      }
      return request;
    });
  }, []);

  useEffect(() => {
    const originalAlert = originalAlertRef.current;
    Alert.alert = ((title: string, message?: string, buttons?: AppAlertButton[], options?: AppAlertOptions) => {
      enqueueAlert({
        title: String(title || ''),
        message,
        buttons: normalizeButtons(buttons),
        options,
      });
    }) as typeof Alert.alert;

    return () => {
      Alert.alert = originalAlert;
    };
  }, [enqueueAlert]);

  const closeAlert = useCallback((button?: AppAlertButton, dismissed = false) => {
    setCurrent(null);

    requestAnimationFrame(() => {
      const next = queueRef.current.shift() || null;
      setCurrent(next);
    });

    if (dismissed) {
      current?.options?.onDismiss?.();
      return;
    }

    button?.onPress?.();
  }, [current]);

  return (
    <>
      {children}
      <AppAlertModal alert={current} onClose={closeAlert} />
    </>
  );
}

function AppAlertModal({
  alert,
  onClose,
}: {
  alert: AppAlertRequest | null;
  onClose: (button?: AppAlertButton, dismissed?: boolean) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!alert) return null;

  const tone = getTone(alert.title);
  const toneColor =
    tone === 'error' ? colors.error :
    tone === 'success' ? colors.success :
    tone === 'warning' ? colors.warning :
    colors.primary;
  const Icon =
    tone === 'error' ? XCircle :
    tone === 'success' ? CheckCircle2 :
    tone === 'warning' ? AlertTriangle :
    Info;
  const cancelable = alert.options?.cancelable !== false;
  const stackedButtons = alert.buttons.length > 2;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.58)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Math.max(20, insets.top),
      paddingBottom: Math.max(20, insets.bottom + 12),
    },
    box: {
      width: '100%',
      maxWidth: 420,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 24,
      elevation: 12,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${toneColor}18`,
      borderWidth: 1,
      borderColor: `${toneColor}40`,
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: alert.message ? 8 : 0,
    },
    message: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: stackedButtons ? 'column' : 'row',
      gap: 10,
      marginTop: 18,
    },
    action: {
      flex: stackedButtons ? undefined : 1,
      minHeight: 44,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
    },
    actionText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      textAlign: 'center',
    },
  });

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => {
      if (cancelable) onClose(undefined, true);
    }}>
      <Pressable
        style={styles.overlay}
        onPress={() => {
          if (cancelable) onClose(undefined, true);
        }}
      >
        <Pressable style={styles.box}>
          <View style={styles.iconWrap}>
            <Icon size={22} color={toneColor} />
          </View>
          <Text style={styles.title}>{alert.title}</Text>
          {!!alert.message && <Text style={styles.message}>{alert.message}</Text>}

          <View style={styles.actions}>
            {alert.buttons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              const isDestructive = button.style === 'destructive';
              const isPrimary = !isCancel && index === alert.buttons.length - 1;
              const backgroundColor = isDestructive
                ? colors.error
                : isPrimary
                  ? colors.primary
                  : colors.surface;
              const borderColor = isDestructive
                ? colors.error
                : isPrimary
                  ? colors.primary
                  : colors.border;
              const textColor = isDestructive || isPrimary ? colors.white : colors.text;

              return (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  activeOpacity={0.85}
                  style={[styles.action, { backgroundColor, borderColor }]}
                  onPress={() => onClose(button)}
                >
                  <Text style={[styles.actionText, { color: textColor }]}>{button.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
