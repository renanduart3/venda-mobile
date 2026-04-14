import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Nomes dos temas disponíveis ─────────────────────────────────────────────
export type ThemeName =
  | 'brisa-do-oceano'   // claro — tons de azul/verde
  | 'coat-vibe'         // claro — tons de índigo/vermelho
  | 'golden'            // escuro — azul marinho + amarelo
  | 'deep-sea';         // escuro — azul profundo + dourado suave

// Mantemos 'theme' como 'light' | 'dark' para compatibilidade interna
type ThemeMode = 'light' | 'dark';

// ─── Interface de cores ───────────────────────────────────────────────────────
export interface Colors {
  primary: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;
  background: string;
  surface: string;
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
  /** Fundo da aba ativa nas abas de navegação */
  tabActiveBg: string;
  /** Cor do texto/ícone na aba ativa */
  tabActiveText: string;
}

// ─── Paletas dos 4 temas ─────────────────────────────────────────────────────

/** Brisa do Oceano — claro, mais vibrante */
const brisaDoOceano: Colors = {
  primary: '#457b9d',        // cerulean
  primaryLight: '#a8dadc',   // frosted-blue
  secondary: '#e63946',      // punch-red
  secondaryLight: '#f1faee', // honeydew
  background: '#f1faee',     // honeydew
  surface: '#cce8ec',        // frosted-blue suave
  topbar: '#457b9d',
  bottombar: '#457b9d',
  onTopbar: '#f1faee',
  onBottombar: '#f1faee',
  card: '#ffffff',
  text: '#1d3557',
  textSecondary: '#457b9d',
  border: '#a8dadc',
  inputBorder: '#a8dadc',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#e63946',
  white: '#ffffff',
  black: '#000000',
  tabActiveBg: '#1d3557',
  tabActiveText: '#f1faee',
};

/** Coat Vibe — claro, mais suave/elegante */
const coatVibe: Colors = {
  primary: '#2b2d42',        // space-indigo
  primaryLight: '#8d99ae',   // lavender-grey
  secondary: '#ef233c',      // punch-red
  secondaryLight: '#edf2f4', // platinum
  background: '#edf2f4',     // platinum
  surface: '#dde3ea',        // platinum mais escuro
  topbar: '#2b2d42',
  bottombar: '#2b2d42',
  onTopbar: '#edf2f4',
  onBottombar: '#edf2f4',
  card: '#ffffff',
  text: '#2b2d42',
  textSecondary: '#8d99ae',
  border: '#c4ccd6',
  inputBorder: '#c4ccd6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#d90429',
  white: '#ffffff',
  black: '#000000',
  tabActiveBg: '#2b2d42',
  tabActiveText: '#edf2f4',
};

/** Golden — escuro, azul marinho + amarelo */
const golden: Colors = {
  primary: '#ffc300',        // school-bus-yellow
  primaryLight: '#ffd60a',
  secondary: '#003566',      // regal-navy
  secondaryLight: '#001d3d',
  background: '#000814',     // ink-black
  surface: '#001d3d',        // prussian-blue
  topbar: '#000814',
  bottombar: '#000814',
  onTopbar: '#ffc300',
  onBottombar: '#ffc300',
  card: '#001d3d',           // prussian-blue
  text: '#f0e6cc',           // branco quente
  textSecondary: '#8899aa',
  border: '#003566',
  inputBorder: '#003566',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
  black: '#000000',
  tabActiveBg: '#003566',
  tabActiveText: '#ffc300',
};

/** Deep Sea — escuro, azul profundo + dourado suave */
const deepSea: Colors = {
  primary: '#ffd60a',        // gold
  primaryLight: '#778da9',   // dusty-denim
  secondary: '#415a77',      // dusk-blue
  secondaryLight: '#1b263b',
  background: '#0d1b2a',     // ink-black profundo
  surface: '#1b263b',        // prussian-blue
  topbar: '#0d1b2a',
  bottombar: '#0d1b2a',
  onTopbar: '#e0e1dd',
  onBottombar: '#e0e1dd',
  card: '#1d3557',           // oxford-navy
  text: '#e0e1dd',           // alabaster-grey
  textSecondary: '#778da9',  // dusty-denim
  border: '#415a77',
  inputBorder: '#415a77',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
  black: '#000000',
  tabActiveBg: '#415a77',
  tabActiveText: '#e0e1dd',
};

// ─── Mapa de temas ────────────────────────────────────────────────────────────
export const THEME_PALETTES: Record<ThemeName, Colors> = {
  'brisa-do-oceano': brisaDoOceano,
  'coat-vibe': coatVibe,
  'golden': golden,
  'deep-sea': deepSea,
};

export const DARK_THEMES: ThemeName[] = ['golden', 'deep-sea'];
export const LIGHT_THEMES: ThemeName[] = ['brisa-do-oceano', 'coat-vibe'];

export const THEME_LABELS: Record<ThemeName, string> = {
  'brisa-do-oceano': 'Brisa do Oceano',
  'coat-vibe': 'Coat Vibe',
  'golden': 'Golden',
  'deep-sea': 'Deep Sea',
};

// ─── Context ──────────────────────────────────────────────────────────────────
interface ThemeContextType {
  themeName: ThemeName;
  theme: ThemeMode;   // 'light' | 'dark' — mantido para compatibilidade
  isDark: boolean;
  colors: Colors;
  setThemeName: (name: ThemeName) => Promise<void>;
  /** @deprecated Use setThemeName. Mantido para compatibilidade. */
  setTheme: (mode: 'light' | 'dark') => void;
  /** @deprecated Cores customizadas substituídas por temas predefinidos. */
  setPrimaryColor: (color: string) => void;
  /** @deprecated Cores customizadas substituídas por temas predefinidos. */
  setSecondaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = '@theme_name';

// Migração de valores antigos ('light'/'dark'/'system') para ThemeName
function migrateThemeName(raw: string | null): ThemeName {
  if (!raw) return 'brisa-do-oceano';
  if (raw === 'light' || raw === 'system') return 'brisa-do-oceano';
  if (raw === 'dark') return 'golden';
  if (raw in THEME_PALETTES) return raw as ThemeName;
  return 'brisa-do-oceano';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>('brisa-do-oceano');

  const isDark = DARK_THEMES.includes(themeName);
  const theme: ThemeMode = isDark ? 'dark' : 'light';
  const colors = React.useMemo(() => THEME_PALETTES[themeName], [themeName]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      setThemeNameState(migrateThemeName(raw));
    }).catch(() => {});
  }, []);

  const setThemeName = React.useCallback(async (name: ThemeName) => {
    setThemeNameState(name);
    await AsyncStorage.setItem(STORAGE_KEY, name);
  }, []);

  /** Compat: mapeia 'light'→'brisa-do-oceano', 'dark'→'golden' */
  const setTheme = React.useCallback((mode: 'light' | 'dark') => {
    const target: ThemeName = mode === 'dark' ? 'golden' : 'brisa-do-oceano';
    setThemeName(target);
  }, [setThemeName]);

  // Stubs de compatibilidade — cores customizadas substituídas por temas predefinidos
  const setPrimaryColor = React.useCallback((_color: string) => {}, []);
  const setSecondaryColor = React.useCallback((_color: string) => {}, []);

  const contextValue = React.useMemo(() => ({
    themeName,
    theme,
    isDark,
    colors,
    setThemeName,
    setTheme,
    setPrimaryColor,
    setSecondaryColor,
  }), [themeName, theme, isDark, colors, setThemeName, setTheme, setPrimaryColor, setSecondaryColor]);

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
