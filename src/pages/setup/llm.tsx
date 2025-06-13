import { useState } from 'react';
import SetupLayout from './layout';

export default function LLMSetup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState({
    provider: 'openai',
    apiKey: ''
  });

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      // Save the API key and provider
      const response = await fetch('/api/setup/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate API key');
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate API key');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SetupLayout
      currentStep={2}
      totalSteps={2}
      onNext={handleSubmit}
      isLastStep={true}
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-light mb-4">LLM Configuration</h1>
        <p className="text-[#8E8E93] text-lg">
          Choose your preferred LLM provider and configure API access
        </p>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-lg font-light text-white mb-4">
            Select Provider
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="relative flex cursor-pointer rounded-xl border border-[#2C2C2E] bg-[#2C2C2E]/50 p-4 hover:bg-[#2C2C2E] transition-colors">
              <input
                type="radio"
                name="provider"
                value="openai"
                checked={config.provider === 'openai'}
                onChange={() => setConfig({ ...config, provider: 'openai' })}
                className="sr-only"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-light text-white">OpenAI</p>
                    <p className="text-sm text-[#8E8E93]">GPT-4, GPT-3.5 Turbo</p>
                  </div>
                  <div className="h-5 w-5 rounded-full border-2 border-white flex items-center justify-center">
                    {config.provider === 'openai' && (
                      <div className="h-3 w-3 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </div>
            </label>
            <label className="relative flex cursor-pointer rounded-xl border border-[#2C2C2E] bg-[#2C2C2E]/50 p-4 hover:bg-[#2C2C2E] transition-colors">
              <input
                type="radio"
                name="provider"
                value="anthropic"
                checked={config.provider === 'anthropic'}
                onChange={() => setConfig({ ...config, provider: 'anthropic' })}
                className="sr-only"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-light text-white">Anthropic</p>
                    <p className="text-sm text-[#8E8E93]">Claude 3 Opus, Claude 3 Sonnet</p>
                  </div>
                  <div className="h-5 w-5 rounded-full border-2 border-white flex items-center justify-center">
                    {config.provider === 'anthropic' && (
                      <div className="h-3 w-3 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>
        <div>
          <label htmlFor="apiKey" className="block text-lg font-light text-white mb-2">
            API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            placeholder={`Enter your ${config.provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key`}
            className="block w-full rounded-xl border-0 py-3 px-4 text-lg bg-[#2C2C2E] text-white placeholder-[#8E8E93] focus:ring-0 focus:outline-none"
            required
          />
          <p className="mt-2 text-[#8E8E93] text-sm">
            Your API key will be encrypted and stored securely
          </p>
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