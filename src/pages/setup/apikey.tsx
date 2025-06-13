import { useState, useEffect } from 'react';
import SetupLayout from './layout';
import { useRouter } from 'next/router';
import { apiFetch } from '@/utils/apiFetch';

export default function ApiKeySetup() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for existing API key
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('DCISIONAI_KEY');
      if (storedKey) {
        // Validate the stored key
        validateKey(storedKey, true);
      }
    }
  }, []);

  const validateKey = async (key: string, silent = false) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        if (!silent) throw new Error(data.error || 'Invalid DcisionAI API key');
        // If silent, just clear localStorage and stay on page
        localStorage.removeItem('DCISIONAI_KEY');
        setLoading(false);
        return;
      }
      // Store the key in localStorage
      localStorage.setItem('DCISIONAI_KEY', key);
      // Proceed to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate API key');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    await validateKey(apiKey);
  };

  return (
    <SetupLayout
      currentStep={1}
      totalSteps={2}
      onNext={handleSubmit}
      isLastStep={false}
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-light mb-4">DcisionAI API Key</h1>
        <p className="text-[#8E8E93] text-lg">
          Enter your DcisionAI API key to get started. You can find this key in your admin dashboard or from your platform administrator.
        </p>
      </div>
      <div className="space-y-6">
        <div>
          <label htmlFor="apiKey" className="block text-lg font-light text-white mb-2">
            API Key
          </label>
          <input
            type="text"
            id="apiKey"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Enter your DcisionAI API key"
            className="block w-full rounded-xl border-0 py-3 px-4 text-lg bg-[#2C2C2E] text-white placeholder-[#8E8E93] focus:ring-0 focus:outline-none"
            required
          />
        </div>
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
            {error}
          </div>
        )}
      </div>
    </SetupLayout>
  );
} 