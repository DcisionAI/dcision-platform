import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient, type User } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/router';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  resetPassword: (email: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  resetPassword: async () => {}
});

const DEMO_USER = {
  email: 'amdhavle@me.com',
  password: 'demouser123'
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const signInDemoUser = async () => {
    try {
      console.log('Attempting to sign in demo user...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: DEMO_USER.email,
        password: DEMO_USER.password,
      });
      
      if (error) {
        console.error('Demo user sign in failed:', error.message);
        return;
      }

      if (data?.user) {
        console.log('Demo user signed in successfully');
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error during demo user sign in:', error);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          // No active session, attempt demo user sign in
          await signInDemoUser();
        } else {
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        // If signed out, attempt demo user sign in
        await signInDemoUser();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, resetPassword }}>
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