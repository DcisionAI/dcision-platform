import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from '../components/auth/AuthModal';

export default function Home() {
  const { 
    isLoading, 
    isAuthenticated, 
    showAuthModal, 
    authMode, 
    openSignIn, 
    openSignUp,
    closeAuthModal, 
    handleAuthSuccess,
    setAuthMode 
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  // Handle auth query parameter
  useEffect(() => {
    const authParam = router.query.auth as string;
    if (authParam === 'signin') {
      openSignIn();
      // Remove the query parameter after opening modal
      router.replace('/', undefined, { shallow: true });
    } else if (authParam === 'signup') {
      openSignUp();
      // Remove the query parameter after opening modal
      router.replace('/', undefined, { shallow: true });
    }
  }, [router.query.auth, openSignIn, openSignUp, router]);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <div className="relative min-h-screen bg-docs-bg">
      <div className={showAuthModal ? 'filter blur-sm' : ''}>
        {/* Hero Section */}
        <div className="relative px-6 lg:px-8">
          <div className="mx-auto max-w-3xl pt-20 pb-32 sm:pt-48 sm:pb-40">
            <div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-docs-text sm:text-6xl">
                  DcisionAI
                </h1>
                <p className="mt-6 text-lg leading-8 text-docs-muted">
                  Transform complex business decisions into intelligent workflows. Powered by explainable AI agents that understand your business context.
                </p>
                <div className="mt-8 flex gap-x-4">
                  <button
                    onClick={openSignIn}
                    className="inline-block rounded-lg bg-blue-600 px-4 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-blue-500"
                  >
                    Get started
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Section */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-docs-section p-6">
              <h3 className="text-lg font-semibold text-docs-text">Intelligent Decision Agents</h3>
              <p className="mt-2 text-docs-muted">
                Our AI agents understand your business context, validate decisions against rules, and ensure optimal outcomes while maintaining explainability.
              </p>
            </div>
            <div className="rounded-lg bg-docs-section p-6">
              <h3 className="text-lg font-semibold text-docs-text">Real-time Optimization</h3>
              <p className="mt-2 text-docs-muted">
                Adapt to changing conditions instantly with dynamic re-optimization. Handle disruptions, new constraints, and opportunities in real-time.
              </p>
            </div>
            <div className="rounded-lg bg-docs-section p-6">
              <h3 className="text-lg font-semibold text-docs-text">Business-First Approach</h3>
              <p className="mt-2 text-docs-muted">
                No PhD required. Express your business rules naturally, and let our agents translate them into optimal decisions that align with your goals.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        mode={authMode}
        onSuccess={handleAuthSuccess}
        onModeChange={setAuthMode}
      />
    </div>
  );
} 