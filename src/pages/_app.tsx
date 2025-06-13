import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/components/layout/ThemeContext';
import { SidebarProvider } from '@/components/layout/SidebarContext';

export default function App({ Component, pageProps }: AppProps) {
  const supabase = createClientComponentClient();
  // Debug: log the Supabase URL loaded from environment
  useEffect(() => {
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  }, []);
  
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