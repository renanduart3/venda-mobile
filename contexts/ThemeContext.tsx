import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Nomes dos temas disponíveis ─────────────────────────────────────────────
export type ThemeName =
  | 'brisa-do-oceano'   // claro — tons de azul/verde
  | 'sunset-bliss'      // claro — coral quente + dourado + teal
  | 'crimson-coast'     // escuro — índigo suave + vermelho
  | 'harmony';          // escuro — carvão + areia + dourado suave

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

/** Sunset Bliss — claro, tons quentes de coral + dourado + teal */
const sunsetBliss: Colors = {
  primary: '#247ba0',        // cerulean — ação principal, não muito saturado
  primaryLight: '#70c1b3',   // tropical-teal — suave
  secondary: '#c4553f',      // coral escurecido para melhor contraste no claro
  secondaryLight: '#f0d080', // royal-gold clareado
  background: '#f5f0eb',     // areia quente (não branco puro, mais suave aos olhos)
  surface: '#ede6de',        // superfície levemente mais escura que o fundo
  topbar: '#3d6a82',         // cerulean escurecido para contraste na barra
  bottombar: '#3d6a82',
  onTopbar: '#f5f0eb',
  onBottombar: '#f5f0eb',
  card: '#faf7f3',           // quase branco com toque quente
  text: '#50514f',           // charcoal — leitura confortável sem ser preto puro
  textSecondary: '#7a7b79',  // charcoal suavizado
  border: '#d4c9bc',         // borda discreta e quente
  inputBorder: '#b8aa9c',    // borda de input um pouco mais visível
  success: '#2a9d6f',        // verde teal escuro
  warning: '#c8902a',        // âmbar escurecido para contraste
  error: '#c0392b',          // vermelho menos saturado
  white: '#ffffff',
  black: '#000000',
  tabActiveBg: '#247ba0',
  tabActiveText: '#f5f0eb',
};

/** Crimson Coast — escuro confortável, índigo suave + vermelho discreto */
const crimsonCoast: Colors = {
  primary: '#7fa8c0',        // azul acinzentado claro — contraste suave no escuro
  primaryLight: '#a8c4d4',   // azul ainda mais suave
  secondary: '#c05060',      // vermelho rosado, menos agressivo que punch-red
  secondaryLight: '#d4808c',
  background: '#2b2d42',     // space-indigo — escuro mas não preto, confortável
  surface: '#363855',        // um tom acima do fundo
  topbar: '#22243a',         // levemente mais escuro que o fundo
  bottombar: '#22243a',
  onTopbar: '#c8cfe0',       // platinum acinzentado suave
  onBottombar: '#c8cfe0',
  card: '#363855',
  text: '#dde3ed',           // platinum levemente azulado
  textSecondary: '#8d99ae',  // lavender-grey original
  border: '#4a4d68',         // borda sutil, pouco contraste
  inputBorder: '#5a5d7a',    // borda de input um pouco mais visível
  success: '#5cb88a',        // verde suave para fundo escuro
  warning: '#d4a940',        // âmbar discreto
  error: '#c06070',          // classic-crimson suavizado
  white: '#ffffff',
  black: '#000000',
  tabActiveBg: '#4a4d68',
  tabActiveText: '#dde3ed',
};

/** Harmony — escuro aconchegante, carvão + areia + toque dourado */
const harmony: Colors = {
  primary: '#c8b86a',        // tuscan-sun escurecido — dourado discreto
  primaryLight: '#d9cca0',   // dourado ainda mais suave
  secondary: '#8aaa96',      // alabaster-grey com toque verde
  secondaryLight: '#aac4b2',
  background: '#2e2e2c',     // carvão médio — não é preto, é aconchegante
  surface: '#3a3a38',        // graphite ligeiramente mais claro
  topbar: '#242423',         // carbon-black original como barra
  bottombar: '#242423',
  onTopbar: '#cfdbd5',       // alabaster-grey
  onBottombar: '#cfdbd5',
  card: '#3a3a38',
  text: '#e8ede8',           // soft-linen levemente esverdeado — suave
  textSecondary: '#a8b4ae',  // alabaster-grey escurecido
  border: '#4a4a48',         // borda muito sutil
  inputBorder: '#5c5c5a',    // borda de input visível mas discreta
  success: '#7ab898',        // verde cinzento suave
  warning: '#c8b86a',        // tuscan-sun
  error: '#c07878',          // vermelho rosado suave
  white: '#ffffff',
  black: '#000000',
  tabActiveBg: '#4a4a48',
  tabActiveText: '#e8ede8',
};

// ─── Mapa de temas ────────────────────────────────────────────────────────────
export const THEME_PALETTES: Record<ThemeName, Colors> = {
  'brisa-do-oceano': brisaDoOceano,
  'sunset-bliss': sunsetBliss,
  'crimson-coast': crimsonCoast,
  'harmony': harmony,
};

export const DARK_THEMES: ThemeName[] = ['crimson-coast', 'harmony'];
export const LIGHT_THEMES: ThemeName[] = ['brisa-do-oceano', 'sunset-bliss'];

export const THEME_LABELS: Record<ThemeName, string> = {
  'brisa-do-oceano': 'Brisa do Oceano',
  'sunset-bliss': 'Sunset Bliss',
  'crimson-coast': 'Crimson Coast',
  'harmony': 'Harmony',
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

// Migração de valores antigos ('light'/'dark'/'system'/'coat-vibe'/'golden'/'deep-sea') para ThemeName
function migrateThemeName(raw: string | null): ThemeName {
  if (!raw) return 'brisa-do-oceano';
  if (raw === 'light' || raw === 'system') return 'brisa-do-oceano';
  if (raw === 'dark' || raw === 'golden' || raw === 'deep-sea') return 'crimson-coast';
  if (raw === 'coat-vibe') return 'sunset-bliss';
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

  /** Compat: mapeia 'light'→'brisa-do-oceano', 'dark'→'crimson-coast' */
  const setTheme = React.useCallback((mode: 'light' | 'dark') => {
    const target: ThemeName = mode === 'dark' ? 'crimson-coast' : 'brisa-do-oceano';
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
