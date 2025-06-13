import SettingsLayout from './layout';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

interface LLMSettings {
  provider: 'openai' | 'anthropic';
  apiKey: string;
}

export default function LLMSettings() {
  const router = useRouter();
  const [settings, setSettings] = useState<LLMSettings>({
    provider: 'openai',
    apiKey: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/setup/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: settings.provider, apiKey: settings.apiKey })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save settings');
      }
      router.push('/settings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">LLM Provider Settings</h1>
          <p className="text-[#8E8E93] text-lg">
            Choose your preferred LLM provider and configure API access
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-[#1C1C1E] rounded-2xl border border-[#2C2C2E] p-8">
            <h2 className="text-2xl font-light text-white mb-6">Select Provider</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* OpenAI Card */}
              <label className="relative flex cursor-pointer rounded-xl border border-[#2C2C2E] bg-[#2C2C2E]/50 p-4 hover:bg-[#2C2C2E] transition-colors">
                <input
                  type="radio"
                  name="provider"
                  value="openai"
                  checked={settings.provider === 'openai'}
                  onChange={() => setSettings({ ...settings, provider: 'openai' })}
                  className="sr-only"
                />
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-black mr-4">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.051 6.051 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.0264 1.1706a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4929 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0264 1.1706a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1302 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0454-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1658a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="#fff"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-light text-white">OpenAI</p>
                          <p className="text-[#8E8E93]">GPT-4 & GPT-3.5 Turbo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${settings.provider === 'openai' ? 'border-white bg-transparent' : 'border-[#3C3C3E] bg-transparent'}`}>
                    {settings.provider === 'openai' && (
                      <div className="h-3 w-3 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </label>

              {/* Anthropic Card */}
              <label className="relative flex cursor-pointer rounded-xl border border-[#2C2C2E] bg-[#2C2C2E]/50 p-4 hover:bg-[#2C2C2E] transition-colors">
                <input
                  type="radio"
                  name="provider"
                  value="anthropic"
                  checked={settings.provider === 'anthropic'}
                  onChange={() => setSettings({ ...settings, provider: 'anthropic' })}
                  className="sr-only"
                />
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-[#000B1D] mr-4">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M19.4012 16.5477H13.3617V19.0307H19.4012V16.5477Z" fill="#fff"/>
                            <path d="M13.3617 8.45312H19.4012V10.9361H13.3617V8.45312Z" fill="#fff"/>
                            <path d="M13.3617 12.5004H19.4012V14.9834H13.3617V12.5004Z" fill="#fff"/>
                            <path d="M4.60059 4.96875H10.64V19.0308H4.60059V4.96875Z" fill="#fff"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-light text-white">Anthropic</p>
                          <p className="text-[#8E8E93]">Claude 3 Sonnet</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${settings.provider === 'anthropic' ? 'border-white bg-transparent' : 'border-[#3C3C3E] bg-transparent'}`}>
                    {settings.provider === 'anthropic' && (
                      <div className="h-3 w-3 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </label>
            </div>

            {/* API Key Input */}
            <div className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-lg font-light text-white mb-2">
                  API Key
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    id="apiKey"
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                    placeholder={`Enter your ${settings.provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key`}
                    className={`block w-full rounded-xl border-0 py-3 px-4 text-lg ${settings.apiKey ? 'bg-[#FFFBE6] text-black' : 'bg-[#2C2C2E] text-white placeholder-[#8E8E93]'} focus:ring-0 focus:outline-none transition-colors`}
                  />
                </div>
                <p className="mt-2 text-[#8E8E93] text-base">
                  Your API key will be encrypted and stored securely
                </p>
              </div>

              {error && (
                <div className="text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => router.push('/settings')}
                  className="px-6 py-2.5 border border-[#3C3C3E] rounded-lg text-base font-light text-white hover:bg-[#2C2C2E] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !settings.apiKey}
                  className="px-6 py-2.5 bg-[#2C2C2E] rounded-lg text-base font-light text-white hover:bg-[#3C3C3E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </SettingsLayout>
  );
} 