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
  primary: '#4f46e5',
  primaryLight: '#818cf8',
  secondary: '#7c3aed',
  secondaryLight: '#a78bfa',
  background: '#ffffff',
  surface: '#f8fafc',
  topbar: '#3b3b4c',
  bottombar: '#3b3b4c',
  onTopbar: '#ffffff',
  onBottombar: '#ffffff',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  inputBorder: '#cbd5e1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
  black: '#000000',
};

const darkColors: Colors = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  secondary: '#8b5cf6',
  secondaryLight: '#a78bfa',
  background: '#0f172a',
  surface: '#1e293b',
  topbar: '#515163',
  bottombar: '#515163',
  onTopbar: '#ffffff',
  onBottombar: '#ffffff',
  card: '#334155',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  border: '#475569',
  inputBorder: '#334155',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
  black: '#000000',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [customPrimary, setCustomPrimary] = useState<string>('#4f46e5');
  const [customSecondary, setCustomSecondary] = useState<string>('#7c3aed');
  const [systemTheme, setSystemTheme] = useState(Appearance.getColorScheme());

  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  // Memoize colors object to avoid recreating on every render (performance optimization)
  const colors = React.useMemo(() => ({
    ...(isDark ? darkColors : lightColors),
    primary: customPrimary,
    secondary: customSecondary,
  }), [isDark, customPrimary, customSecondary]);

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
