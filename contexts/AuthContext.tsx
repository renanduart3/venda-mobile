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
  signInWithGoogle: (onBrowserClose?: () => void) => Promise<{ error: string | null }>;
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

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[Auth][STATE] onAuthStateChange disparado.', {
        event,
        hasSession: !!newSession,
        userId: newSession?.user?.id,
        email: newSession?.user?.email,
      });
      setSession(newSession);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ─── Google OAuth ────────────────────────────────────────────────────────────

  const signInWithGoogle = async (onBrowserClose?: () => void): Promise<{ error: string | null }> => {
    console.log('[Auth][LOGIN] Iniciando autenticação Google...');
    try {
      // makeRedirectUri detecta o ambiente automaticamente:
      // • Expo Go      → exp://IP:PORT/-- (precisa de exp://** no Supabase)
      // • Build nativo → lojaapp://
      const redirectTo = makeRedirectUri({ scheme: 'lojaapp' });
      console.log('[Auth][LOGIN] redirectUri gerado.', { redirectTo });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.warn('[Auth][LOGIN] Erro ao gerar URL OAuth:', error.message);
        return { error: error.message };
      }
      if (!data.url) {
        console.warn('[Auth][LOGIN] URL OAuth não retornada pelo Supabase.');
        return { error: 'Não foi possível iniciar o login com Google.' };
      }

      console.log('[Auth][LOGIN] URL OAuth gerada. Abrindo WebBrowser (Chrome Custom Tab)...');
      const browserStart = Date.now();
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      const browserDuration = Date.now() - browserStart;

      console.log('[Auth][LOGIN] WebBrowser fechou.', {
        type: result.type,
        durationMs: browserDuration,
        hasUrl: result.type === 'success' ? !!(result as any).url : false,
      });

      if (result.type === 'success' && result.url) {
        // Notifica imediatamente que o browser fechou com sucesso, antes de qualquer
        // chamada de rede — permite mostrar overlay de loading sem esperar exchangeCode
        console.log('[Auth][LOGIN] Callback onBrowserClose disparado — overlay de loading ativo.');
        onBrowserClose?.();

        // Verifica se a URL retornou com um error
        const errorMatch = result.url.match(/error_description=([^&#]+)/) || result.url.match(/error=([^&#]+)/);
        if (errorMatch && errorMatch[1]) {
          const errMsg = decodeURIComponent(errorMatch[1]).replace(/\+/g, ' ');
          console.warn('[Auth][LOGIN] Erro retornado pelo Google/Supabase na URL:', errMsg);
          return { error: errMsg };
        }

        // Pega o código retornado na URL: lojaapp://?code=xxxx
        const codeMatch = result.url.match(/code=([^&#]+)/);

        // Ou pega o access_token se for fluxo implicito
        const accessTokenMatch = result.url.match(/access_token=([^&#]+)/);
        const refreshTokenMatch = result.url.match(/refresh_token=([^&#]+)/);

        if (codeMatch && codeMatch[1]) {
          console.log('[Auth][LOGIN] Código PKCE recebido. Iniciando exchangeCodeForSession... (chamada de rede ao Supabase)');
          const exchangeStart = Date.now();
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeMatch[1]);
          const exchangeDuration = Date.now() - exchangeStart;

          if (exchangeError) {
            console.error('[Auth][LOGIN] Erro no exchangeCodeForSession.', {
              message: exchangeError.message,
              durationMs: exchangeDuration,
            });
            return { error: exchangeError.message };
          }
          console.log('[Auth][LOGIN] exchangeCodeForSession concluído com sucesso.', { durationMs: exchangeDuration });
          // onAuthStateChange vai disparar SIGNED_IN → AuthGate redireciona para /loading
        } else if (accessTokenMatch && accessTokenMatch[1] && refreshTokenMatch && refreshTokenMatch[1]) {
          console.log('[Auth][LOGIN] Implicit Flow detectado. Configurando sessão diretamente...');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessTokenMatch[1],
            refresh_token: refreshTokenMatch[1]
          });
          if (sessionError) {
            console.error('[Auth][LOGIN] Erro ao configurar sessão (implicit flow):', sessionError.message);
            return { error: sessionError.message };
          }
          console.log('[Auth][LOGIN] Sessão configurada via implicit flow.');
        } else {
          console.warn('[Auth][LOGIN] Nenhum código ou token encontrado na URL de retorno.', {
            url: result.url.substring(0, 80) + '...',
          });
          return { error: 'Falha na autenticação: dados de login ausentes no retorno.' };
        }
      } else if (result.type === 'cancel') {
        console.log('[Auth][LOGIN] Usuário cancelou o browser ou fechou sem autenticar.');
      } else if (result.type === 'dismiss') {
        // No Android, Chrome Custom Tab às vezes retorna 'dismiss' mesmo após auth bem-sucedida.
        // O deep link handler em _layout.tsx pode ter capturado o code= e estabelecido a sessão.
        // Aguarda brevemente e verifica se já há sessão ativa antes de decidir o que fazer.
        console.log('[Auth][LOGIN] WebBrowser retornou "dismiss". Verificando se sessão foi estabelecida via deep link (aguardando 600ms)...');
        await new Promise(r => setTimeout(r, 600));
        const { data: sessionCheck } = await supabase.auth.getSession();
        if (sessionCheck.session) {
          console.log('[Auth][LOGIN] Sessão detectada após dismiss — deep link handler processou o código com sucesso. Ativando overlay.');
          onBrowserClose?.();
        } else {
          console.log('[Auth][LOGIN] Nenhuma sessão após dismiss — usuário provavelmente voltou sem autenticar.');
        }
      } else {
        console.warn('[Auth][LOGIN] WebBrowser retornou tipo inesperado:', result.type);
      }

      return { error: null };
    } catch (e: any) {
      console.error('[Auth][LOGIN] Erro inesperado no fluxo de login:', e?.message ?? e);
      return { error: e?.message ?? 'Erro inesperado ao fazer login com Google.' };
    }
  };


  // ─── Sign Out ────────────────────────────────────────────────────────────────

  const signOut = async () => {
    console.log('[Auth][SIGNOUT] Iniciando signOut — chamando supabase.auth.signOut()...');
    const start = Date.now();
    try {
      await supabase.auth.signOut();
      console.log('[Auth][SIGNOUT] supabase.auth.signOut() concluído.', { durationMs: Date.now() - start });
    } catch (e: any) {
      console.warn('[Auth][SIGNOUT] Erro durante signOut (continuando mesmo assim):', e?.message ?? e);
    } finally {
      setSession(null);
      console.log('[Auth][SIGNOUT] Sessão local limpa. AuthGate deve redirecionar para /login.');
    }
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
