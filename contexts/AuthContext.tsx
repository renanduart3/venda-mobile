import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ─── Google OAuth ────────────────────────────────────────────────────────────

  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    try {
      // makeRedirectUri detecta o ambiente automaticamente:
      // • Expo Go      → exp://IP:PORT/-- (precisa de exp://** no Supabase)
      // • Build nativo → lojaapp://
      const redirectTo = makeRedirectUri({ scheme: 'lojaapp' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) return { error: error.message };
      if (!data.url) return { error: 'Não foi possível iniciar o login com Google.' };

      // Usa WebBrowser em vez de Linking puro para garantir o retorno no Android
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        // Log para ajudar a debugar sucesso/erros vindos do supabase/google
        console.log('[Auth] Retorno do WebBrowser:', result.url);

        // Verifica se a URL retornou com um error
        const errorMatch = result.url.match(/error_description=([^&#]+)/) || result.url.match(/error=([^&#]+)/);
        if (errorMatch && errorMatch[1]) {
          return { error: decodeURIComponent(errorMatch[1]).replace(/\+/g, ' ') };
        }

        // Pega o código retornado na URL: lojaapp://?code=xxxx
        const codeMatch = result.url.match(/code=([^&#]+)/);

        // Ou pega o access_token se for fluxo implicito
        const accessTokenMatch = result.url.match(/access_token=([^&#]+)/);
        const refreshTokenMatch = result.url.match(/refresh_token=([^&#]+)/);

        if (codeMatch && codeMatch[1]) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeMatch[1]);
          if (exchangeError) {
            console.error('[Auth] Erro ao trocar código por sessão:', exchangeError);
            return { error: exchangeError.message };
          }
        } else if (accessTokenMatch && accessTokenMatch[1] && refreshTokenMatch && refreshTokenMatch[1]) {
          console.log('[Auth] Detectado Implicit Flow, configurando sessão diretamente...');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessTokenMatch[1],
            refresh_token: refreshTokenMatch[1]
          });
          if (sessionError) {
            console.error('[Auth] Erro ao configurar sessão implicita:', sessionError);
            return { error: sessionError.message };
          }
        } else {
          console.warn('[Auth] Nenhum código ou token encontrado na URL:', result.url);
          return { error: 'Falha na autenticação: dados de login ausentes no retorno.' };
        }
      } else if (result.type !== 'cancel') {
        console.warn('[Auth] WebBrowser retornou tipo inesperado:', result.type);
      }

      return { error: null };
    } catch (e: any) {
      console.error('[Auth] Erro catastrófico no login:', e);
      return { error: e?.message ?? 'Erro inesperado ao fazer login com Google.' };
    }
  };


  // ─── Sign Out ────────────────────────────────────────────────────────────────

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // ─── Value ───────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        isAuthenticated: !!session,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
