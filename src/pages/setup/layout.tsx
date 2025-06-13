import { useRouter } from 'next/router';
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
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
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
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-2 rounded-lg bg-[#2C2C2E] text-white hover:bg-[#3A3A3C]"
            >
              Back
            </button>
          )}
          {onNext && !isLastStep && (
            <button
              onClick={onNext}
              className="px-6 py-2 rounded-lg bg-white text-black hover:bg-gray-200"
            >
              Next
            </button>
          )}
          {isLastStep && (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-white text-black hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? 'Completing...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 