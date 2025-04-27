import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { DEMO_CREDENTIALS } from '../../constants/auth';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
  onModeChange?: (mode: 'signin' | 'signup') => void;
}

export function AuthForm({ mode, onSuccess, onModeChange }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const supabase = createClientComponentClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      if (mode === 'signin') {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } else {
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
      }

      if (result.error) throw result.error;
      
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      await supabase.auth.signInWithPassword({
        email: DEMO_CREDENTIALS.email,
        password: DEMO_CREDENTIALS.password,
      });
      onSuccess?.();
    } catch (err) {
      setError('Demo login failed. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex justify-center mb-8">
        <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16L7 11L8.4 9.55L12 13.15L15.6 9.55L17 11L12 16ZM12 8L7 3L8.4 1.55L12 5.15L15.6 1.55L17 3L12 8Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center text-docs-text mb-2">
        {mode === 'signin' ? 'Sign In' : 'Sign Up'}
      </h2>
      <p className="text-center text-docs-muted mb-8">
        {mode === 'signin' 
          ? 'Welcome back! Please sign in to your account.'
          : 'Create an account to get started.'}
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-900/10 border border-red-900/20 p-4">
            <div className="text-sm text-red-500">{error}</div>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-docs-text">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border-0 bg-docs-section text-docs-text shadow-sm ring-1 ring-inset ring-docs-section-border focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-docs-text">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                className="block w-full rounded-md border-0 bg-docs-section text-docs-text shadow-sm ring-1 ring-inset ring-docs-section-border focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </div>

        <div className="text-center">
          {mode === 'signin' ? (
            <p className="text-sm text-docs-muted">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => onModeChange?.('signup')}
                className="font-medium text-blue-500 hover:text-blue-400"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-sm text-docs-muted">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onModeChange?.('signin')}
                className="font-medium text-blue-500 hover:text-blue-400"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  );
} 