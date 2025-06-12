import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabaseClient';

export default function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-docs-section dark:bg-docs-dark-bg p-6 rounded shadow w-full max-w-sm">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1e40af',
                  inputBorder: '#21262D',
                  inputLabelText: '#8B949E',
                  messageText: '#f87171',
                  anchorTextColor: '#2563eb',
                },
                radii: {
                  borderRadiusButton: '0.5rem',
                  inputBorderRadius: '0.5rem',
                },
                fontSizes: {
                  baseBodySize: '1rem',
                  baseInputSize: '1rem',
                },
              },
            },
          }}
          theme="dark"
          providers={['google']}
        />
        <button onClick={onClose} className="mt-4 text-sm text-docs-muted">Cancel</button>
      </div>
    </div>
  );
} 