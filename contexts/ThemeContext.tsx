import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

interface Colors {
  primary: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;
  background: string;
  surface: string;
  // New: dedicated bars for top header and bottom navigation for better contrast
  topbar: string;
  bottombar: string;
  onTopbar: string;
  onBottombar: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  inputBorder: string;
  success: string;
  warning: string;
  error: string;
  white: string;
  black: string;
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: Colors;
  setTheme: (theme: Theme) => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
}

const lightColors: Colors = {
  primary: '#124559', // Dark Teal
  primaryLight: '#598392', // Air Force Blue
  secondary: '#598392',
  secondaryLight: '#aec3b0',
  background: '#eff6e0', // Beige
  surface: '#aec3b0', // Ash Grey
  topbar: '#124559',
  bottombar: '#124559',
  onTopbar: '#eff6e0',
  onBottombar: '#eff6e0',
  card: '#ffffff', // Keeping pure white for clean contrast inside Beige or Ash Grey
  text: '#01161e', // Ink Black
  textSecondary: '#598392', // Air Force Blue
  border: '#aec3b0', // Ash Grey
  inputBorder: '#aec3b0',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
  black: '#000000',
};

const darkColors: Colors = {
  primary: '#598392', // Air Force Blue
  primaryLight: '#aec3b0', // Ash Grey
  secondary: '#124559', // Dark Teal
  secondaryLight: '#598392',
  background: '#01161e', // Ink Black
  surface: '#124559', // Dark Teal
  topbar: '#01161e', // Ink Black
  bottombar: '#01161e', // Ink Black
  onTopbar: '#eff6e0',
  onBottombar: '#eff6e0',
  card: '#124559', // Dark Teal
  text: '#eff6e0', // Beige
  textSecondary: '#aec3b0', // Ash Grey
  border: '#598392', // Air Force Blue
  inputBorder: '#598392',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
  black: '#000000',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [customPrimary, setCustomPrimary] = useState<string | null>(null);
  const [customSecondary, setCustomSecondary] = useState<string | null>(null);
  const [systemTheme, setSystemTheme] = useState(Appearance.getColorScheme());

  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  // Memoize colors object to avoid recreating on every render (performance optimization)
  const colors = React.useMemo(() => {
    const base = isDark ? darkColors : lightColors;
    return {
      ...base,
      primary: customPrimary || base.primary,
      secondary: customSecondary || base.secondary,
    };
  }, [isDark, customPrimary, customSecondary]);

  useEffect(() => {
    loadThemeSettings();
    
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const loadThemeSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      const savedPrimary = await AsyncStorage.getItem('primaryColor');
      const savedSecondary = await AsyncStorage.getItem('secondaryColor');

      if (savedTheme) setThemeState(savedTheme as Theme);
      if (savedPrimary) setCustomPrimary(savedPrimary);
      if (savedSecondary) setCustomSecondary(savedSecondary);
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  };

  const setTheme = React.useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  }, []);

  const setPrimaryColor = React.useCallback(async (color: string) => {
    setCustomPrimary(color);
    await AsyncStorage.setItem('primaryColor', color);
  }, []);

  const setSecondaryColor = React.useCallback(async (color: string) => {
    setCustomSecondary(color);
    await AsyncStorage.setItem('secondaryColor', color);
  }, []);

  // Memoize context value to prevent unnecessary re-renders (performance optimization)
  const contextValue = React.useMemo(() => ({
    theme,
    isDark,
    colors,
    setTheme,
    setPrimaryColor,
    setSecondaryColor,
  }), [theme, isDark, colors, setTheme, setPrimaryColor, setSecondaryColor]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
