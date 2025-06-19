import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  BeakerIcon,
  BoltIcon,
  ChartBarIcon,
  CpuChipIcon,
  LightBulbIcon,
  ArrowPathRoundedSquareIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChartPieIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/utils/apiFetch';
import { useTheme } from '@/components/layout/ThemeContext';
import ExampleQueries from '@/components/ExampleQueries';
import HowIntentAnalysisWorks from '@/components/HowIntentAnalysisWorks';
import DecisionTypes from '@/components/DecisionTypes';

function FeatureCard({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  const { theme } = useTheme();
  return (
    <div className="border border-docs-section-border shadow-sm rounded-xl p-6 bg-docs-section hover:bg-docs-section/80 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-[#1F6FEB]/10 rounded-lg">
          <Icon className="w-5 h-5 text-[#1F6FEB]" />
        </div>
        <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>{title}</h2>
      </div>
      <p className="text-docs-muted dark:text-gray-400">{description}</p>
    </div>
  );
}

function ApiKeyModal({ onSubmit }: { onSubmit: (key: string) => void }) {
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded shadow-lg w-full max-w-md">
        <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>Enter your DcisionAI API Key</h2>
        <input
          className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white mb-4"
          placeholder="API Key"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          className="w-full px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-semibold"
          onClick={() => onSubmit(input)}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { theme } = useTheme();
  const [valid, setValid] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkKey() {
      let key: string | null = null;
      if (typeof window !== 'undefined') {
        key = localStorage.getItem('DCISIONAI_KEY');
      }
      if (!key && process.env.NEXT_PUBLIC_DCISIONAI_KEY) {
        key = process.env.NEXT_PUBLIC_DCISIONAI_KEY || null;
      }
      if (!key) {
        setShowModal(true);
        setValid(false);
        return;
      }
      const res = await apiFetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.valid) {
        setValid(true);
        setShowModal(false);
      } else {
        setValid(false);
        setShowModal(true);
      }
    }
    checkKey();
  }, []);

  const handleApiKeySubmit = async (key: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('DCISIONAI_KEY', key);
    // Re-run validation
    const res = await apiFetch('/api/validate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    const data = await res.json();
    if (data.valid) {
      setValid(true);
      setShowModal(false);
    } else {
      setValid(false);
      alert('Invalid API key. Please try again.');
    }
  };

  if (valid === null) return <div>Loading...</div>;
  if (!valid && !showModal) return <div className="text-red-500 p-8">Invalid or missing DcisionAI API key. Please contact your admin.</div>;

  return (
    <>
      {showModal && <ApiKeyModal onSubmit={handleApiKeySubmit} />}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#18181b] leading-tight mb-4 text-center">
            DcisionAI is a <span className="underline decoration-4 decoration-[#e07a4a] underline-offset-4">modern decision layer</span> to drive<br/>intelligent enterprise actions.
          </h1>
          <p className="text-base md:text-lg font-light tracking-wide text-[#e07a4a] mb-4">
            Beyond AI. A decision layer powered by agents — built for industries that need to act, not just analyze.
          </p>
        </div>
      </div>
      <HowIntentAnalysisWorks />
      <DecisionTypes />
      <ExampleQueries />
    </>
  );
} 