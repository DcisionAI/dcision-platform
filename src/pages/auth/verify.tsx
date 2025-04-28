import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function VerifyEmail() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { token_hash, type } = router.query;

    if (token_hash && type) {
      verifyEmail(token_hash as string, type as string);
    } else {
      setLoading(false);
    }
  }, [router.query]);

  const verifyEmail = async (token_hash: string, type: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });

      if (error) throw error;

      // Redirect to dashboard on successful verification
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verifying Your Email"
      subtitle="Please wait while we verify your email address."
    >
      <div className="text-center">
        {loading ? (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Verifying your email...</p>
          </div>
        ) : error ? (
          <div className="mt-4">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Return to sign in
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              If you're not redirected automatically,{' '}
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-500"
              >
                click here
              </button>
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
} 