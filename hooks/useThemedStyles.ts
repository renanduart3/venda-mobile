/**
 * Custom hook to memoize styles based on theme colors
 * Avoids recreating StyleSheet objects unnecessarily for better performance
 */

import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

/**
 * Hook that memoizes styles based on theme colors
 * Only recreates styles when colors change
 * 
 * @param createStyles - Function that creates styles using theme colors
 * @param colors - Theme colors object
 * @returns Memoized styles
 * 
 * @example
 * ```tsx
 * const styles = useThemedStyles((colors) => ({
 *   container: {
 *     backgroundColor: colors.background,
 *   },
 *   text: {
 *     color: colors.text,
 *   },
 * }), colors);
 * ```
 */
export function useThemedStyles<T>(
  createStyles: (colors: any) => { [key: string]: any },
  colors: any
): T {
  return useMemo(() => StyleSheet.create(createStyles(colors)), [
    colors.background,
    colors.surface,
    colors.card,
    colors.text,
    colors.textSecondary,
    colors.primary,
    colors.secondary,
    colors.success,
    colors.warning,
    colors.error,
    colors.border,
  ]) as T;
}
