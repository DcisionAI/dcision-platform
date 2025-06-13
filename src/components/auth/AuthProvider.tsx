import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { type User } from '@supabase/auth-helpers-nextjs';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  resetPassword: (email: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  accessToken: null,
  resetPassword: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      const supabase = await getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
      setLoading(false);
    }
    loadUser();
  }, []);

  useEffect(() => {
    let unsubscribe: any;
    async function subscribeAuth() {
      const supabase = await getSupabaseClient();
      unsubscribe = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setAccessToken(session?.access_token ?? null);
      });
    }
    subscribeAuth();
    return () => {
      if (unsubscribe && typeof unsubscribe.unsubscribe === 'function') {
        unsubscribe.unsubscribe();
      }
    };
  }, []);

  const resetPassword = async (email: string) => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/update-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, accessToken, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
} 