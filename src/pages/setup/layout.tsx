import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';

interface SetupLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onBack?: () => void;
  isLastStep?: boolean;
}

export default function SetupLayout({
  children,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  isLastStep = false
}: SetupLayoutProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Update user settings to mark setup as complete
      const { error } = await supabase
        .from('user_settings')
        .upsert({ setup_completed: true });

      if (error) throw error;
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to complete setup:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-2">
            <span className="text-[#8E8E93]">Setup Progress</span>
            <span className="text-[#8E8E93]">Step {currentStep} of {totalSteps}</span>
          </div>
          <div className="h-2 bg-[#2C2C2E] rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="bg-[#1C1C1E] rounded-2xl border border-[#2C2C2E] p-8">
          {children}
        </div>

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          {currentStep > 1 && (
            <button
              onClick={onBack}
              className="px-6 py-2.5 border border-[#3C3C3E] rounded-lg text-base font-light text-white hover:bg-[#2C2C2E] transition-colors"
            >
              Back
            </button>
          )}
          <div className="ml-auto">
            {isLastStep ? (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-6 py-2.5 bg-[#2C2C2E] rounded-lg text-base font-light text-white hover:bg-[#3C3C3E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Completing...' : 'Complete Setup'}
              </button>
            ) : (
              <button
                onClick={onNext}
                className="px-6 py-2.5 bg-[#2C2C2E] rounded-lg text-base font-light text-white hover:bg-[#3C3C3E] transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 