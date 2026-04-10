import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

// ─── Configuração do Google Sign-In ───────────────────────────────────────────
// webClientId = Client ID do tipo "Web application" no Google Cloud Console
// (é o mesmo que o Supabase usa no provider Google)
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SignInResult = { error: string | null; cancelled?: boolean };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<SignInResult>;
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

  // ─── Google Sign-In Nativo ───────────────────────────────────────────────────
  // Usa o fluxo nativo do Android: abre o seletor de conta do sistema operacional
  // (sem abrir nenhum navegador ou exibir URLs do Supabase).
  // O Google retorna um idToken que é validado diretamente no Supabase.

  const signInWithGoogle = async (): Promise<SignInResult> => {
    console.log('[Auth][LOGIN] Iniciando autenticação Google nativa...');
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const response = await GoogleSignin.signIn();

      // Suporte a ambas as versões da API:
      // v13+ retorna { data: { idToken } }, v12 retorna { idToken } direto
      const idToken = (response as any)?.data?.idToken ?? (response as any)?.idToken;

      if (!idToken) {
        console.warn('[Auth][LOGIN] idToken não recebido do Google.');
        return { error: 'Não foi possível obter token do Google.', cancelled: false };
      }

      console.log('[Auth][LOGIN] idToken recebido. Autenticando no Supabase...');
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        console.error('[Auth][LOGIN] Erro no signInWithIdToken:', error.message);
        return { error: error.message, cancelled: false };
      }

      console.log('[Auth][LOGIN] Autenticação concluída com sucesso.');
      // onAuthStateChange vai disparar SIGNED_IN → AuthGate redireciona para /loading
      return { error: null, cancelled: false };
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[Auth][LOGIN] Usuário cancelou o seletor de conta.');
        return { error: null, cancelled: true };
      } else if (e.code === statusCodes.IN_PROGRESS) {
        console.warn('[Auth][LOGIN] Login já em andamento.');
        return { error: null, cancelled: true };
      } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.error('[Auth][LOGIN] Google Play Services não disponível.');
        return { error: 'Google Play Services não está disponível neste dispositivo.', cancelled: false };
      }
      console.error('[Auth][LOGIN] Erro inesperado no fluxo de login:', e?.message ?? e);
      return { error: e?.message ?? 'Erro inesperado ao fazer login com Google.', cancelled: false };
    }
  };

  // ─── Sign Out ────────────────────────────────────────────────────────────────

  const signOut = async () => {
    console.log('[Auth][SIGNOUT] Iniciando signOut...');
    try {
      await GoogleSignin.signOut();
      await supabase.auth.signOut();
      console.log('[Auth][SIGNOUT] signOut concluído.');
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
