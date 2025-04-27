import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthLayout } from '../../src/components/auth/AuthLayout';
import { supabase } from '../../src/lib/supabase';

export default function VerifyEmail() {
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get the refresh token from the URL
        const refreshToken = router.query.refresh_token;
        if (!refreshToken || typeof refreshToken !== 'string') {
          throw new Error('Invalid verification link');
        }

        // Exchange refresh token for a new session
        const { error } = await supabase.auth.refreshSession({
          refresh_token: refreshToken
        });

        if (error) throw error;

        // Redirect to dashboard on success
        router.push('/dashboard?verified=true');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed');
      } finally {
        setVerifying(false);
      }
    };

    if (router.isReady) {
      handleEmailVerification();
    }
  }, [router.isReady, router.query]);

  if (verifying) {
    return (
      <AuthLayout
        title="Verifying Email"
        subtitle="Please wait while we verify your email address..."
      >
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout
        title="Verification Failed"
        subtitle="We couldn't verify your email address."
      >
        <div className="text-center">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Return to sign in
          </button>
        </div>
      </AuthLayout>
    );
  }

  return null; // This will only show briefly before redirect
} 