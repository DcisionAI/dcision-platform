import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AuthProvider } from '@/components/auth/AuthProvider';

export default function App({ Component, pageProps }: AppProps) {
  const supabase = createClientComponentClient();
  
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
} 