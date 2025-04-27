import { useRouter } from 'next/router';
import Link from 'next/link';
import { AuthLayout } from '../../src/components/auth/AuthLayout';
import { AuthForm } from '../../src/components/auth/AuthForm';
import { useAuthContext } from '../../src/components/auth/AuthProvider';
import { useEffect } from 'react';

export default function SignUp() {
  const router = useRouter();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <AuthLayout title="Sign Up">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Sign Up"
      subtitle="Create your DcisionAI account"
    >
      <AuthForm
        mode="signup"
        onSuccess={() => router.push('/dashboard')}
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

        <div className="mt-6 text-sm text-center">
          <Link
            href="/auth/signin"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
} 