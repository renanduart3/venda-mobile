import React, { forwardRef, useCallback, useEffect, useRef } from 'react';
import { TextInput as RNTextInput, TextInputProps, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface CustomTextInputProps extends TextInputProps {
  variant?: 'default' | 'outlined';
  /**
   * Debounce user input before calling onChangeText (ms). Useful to avoid heavy renders that can blur the input.
   */
  debounce?: number;
}

export const TextInput = forwardRef<RNTextInput, CustomTextInputProps>(
  (
    {
      style,
      variant = 'default',
      debounce = 0,
      onChangeText,
      returnKeyType = 'next',
      blurOnSubmit = false,
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme();

    const defaultStyle = [
      styles.base,
      variant === 'outlined' && styles.outlined,
      {
        borderColor: colors.inputBorder,
        color: colors.text,
        backgroundColor: colors.surface,
      },
      style,
    ];

    // Keep latest onChangeText in a ref to avoid changing handler identity
    const onChangeRef = useRef<typeof onChangeText>(onChangeText);
    useEffect(() => {
      onChangeRef.current = onChangeText;
    }, [onChangeText]);

    // Debounced, stable handler to prevent Android focus loss on heavy re-renders
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    const handleChangeText = useCallback((text: string) => {
      if (!onChangeRef.current) return;
      if (debounce <= 0) {
        onChangeRef.current?.(text);
        return;
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onChangeRef.current?.(text);
      }, debounce);
    }, [debounce]);

    return (
      <RNTextInput
        ref={ref}
        style={defaultStyle}
        placeholderTextColor={colors.textSecondary}
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        // Android specifics
        {...(Platform.OS === 'android' && {
          importantForAutofill: 'no',
          textContentType: 'none',
          autoCorrect: false,
          autoComplete: 'off',
        })}
        blurOnSubmit={blurOnSubmit}
        returnKeyType={returnKeyType}
        onChangeText={handleChangeText}
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
