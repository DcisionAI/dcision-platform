import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AuthLayout } from '../../src/components/auth/AuthLayout';
import { useAuthContext } from '../../src/components/auth/AuthProvider';

export default function ResetPassword() {
  const router = useRouter();
  const { resetPassword } = useAuthContext();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We've sent you a link to reset your password."
      >
        <div className="text-center">
          <p className="mt-4 text-sm text-gray-600">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setSuccess(false)}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Try another email
            </button>
          </div>
          <div className="mt-4">
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Return to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email address and we'll send you a link to reset your password."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>

        <div className="text-center">
          <Link
            href="/auth/signin"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Return to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
} 