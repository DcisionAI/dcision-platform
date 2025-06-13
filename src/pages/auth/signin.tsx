import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useEffect } from 'react';

export default function SignIn() {
  console.log('SignIn: Component rendering');
  const router = useRouter();
  
  try {
    console.log('SignIn: Getting auth context');
    const { user, loading } = useAuthContext();
    console.log('SignIn: Auth context received:', { user, loading });

    useEffect(() => {
      console.log('SignIn: useEffect running', { user, loading });
      if (typeof window !== 'undefined' && !loading && user) {
        console.log('SignIn: Redirecting to dashboard');
        router.push('/dashboard');
      }
    }, [user, loading, router]);

    if (loading) {
      console.log('SignIn: Showing loading state');
      return (
        <AuthLayout title="Sign In">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </AuthLayout>
      );
    }

    console.log('SignIn: Rendering sign in form');
    return (
      <AuthLayout
        title="Sign In"
        subtitle="Welcome back! Please sign in to your account."
      >
        <AuthForm
          mode="signin"
          onSuccess={() => {
            console.log('SignIn: Sign in successful');
            router.push('/dashboard');
          }}
        />
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col space-y-4 text-sm text-center">
            <Link
              href="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Don't have an account? Sign up
            </Link>
            <Link
              href="/auth/reset-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  } catch (error) {
    console.error('SignIn: Error rendering:', error);
    return (
      <AuthLayout title="Error">
        <div className="text-red-600">
          An error occurred while loading the sign in page. Please try refreshing.
        </div>
      </AuthLayout>
    );
  }
} 