import React, { forwardRef } from 'react';
import { TextInput as RNTextInput, TextInputProps, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface CustomTextInputProps extends TextInputProps {
  variant?: 'default' | 'outlined';
}

export const TextInput = forwardRef<RNTextInput, CustomTextInputProps>(
  ({ style, variant = 'default', ...props }, ref) => {
    const { colors } = useTheme();

    const defaultStyle = [
      styles.base,
      variant === 'outlined' && styles.outlined,
      {
        borderColor: colors.border,
        color: colors.text,
        backgroundColor: colors.surface,
      },
      style,
    ];

    return (
      <RNTextInput
        ref={ref}
        style={defaultStyle}
        placeholderTextColor={colors.textSecondary}
        // Configurações para melhorar o comportamento em emuladores
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        // Configurações específicas para Android
        {...(Platform.OS === 'android' && {
          importantForAutofill: 'no',
          textContentType: 'none',
          autoCorrect: false,
          autoComplete: 'off',
        })}
        // Configurações para melhorar o foco
        blurOnSubmit={false}
        returnKeyType="next"
        {...props}
      />
    );
  }
);

TextInput.displayName = 'TextInput';

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 44, // Altura mínima para melhor toque
  },
  outlined: {
    borderWidth: 1,
  },
});
