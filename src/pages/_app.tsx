import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/components/layout/ThemeContext';
import { SidebarProvider } from '@/components/layout/SidebarContext';

export default function App({ Component, pageProps }: AppProps) {
  const supabase = createClientComponentClient();
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <Component {...pageProps} />
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
} 