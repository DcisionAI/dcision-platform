import React, { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/components/layout/ThemeContext';
import { SidebarProvider } from '@/components/layout/SidebarContext';

const API_KEY_STORAGE_KEY = 'dcisionai_api_key';

function ApiKeyPrompt() {
  const [apiKey, setApiKey] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
      setShow(!stored);
    }
  }, []);

  const handleSave = () => {
    if (apiKey) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
      setShow(false);
      window.location.reload(); // reload to ensure app picks up the key
    }
  };

  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: 32, borderRadius: 8, minWidth: 320 }}>
        <h2>Enter your API Key</h2>
        <input
          type="text"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          style={{ width: '100%', marginTop: 16, marginBottom: 16, padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
        />
        <button onClick={handleSave} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4 }}>
          Save
        </button>
      </div>
    </div>
  );
}

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
          <ApiKeyPrompt />
          <Component {...pageProps} />
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
} 