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
  card: string;
  text: string;
  textSecondary: string;
  border: string;
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
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
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
  card: '#334155',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  border: '#475569',
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

  const colors = {
    ...(isDark ? darkColors : lightColors),
    primary: customPrimary,
    secondary: customSecondary,
  };

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

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const setPrimaryColor = async (color: string) => {
    setCustomPrimary(color);
    await AsyncStorage.setItem('primaryColor', color);
  };

  const setSecondaryColor = async (color: string) => {
    setCustomSecondary(color);
    await AsyncStorage.setItem('secondaryColor', color);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      isDark,
      colors,
      setTheme,
      setPrimaryColor,
      setSecondaryColor,
    }}>
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