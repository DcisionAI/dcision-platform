import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import {
  BeakerIcon,
  BoltIcon,
  ChartBarIcon,
  CpuChipIcon,
  LightBulbIcon,
  ArrowPathRoundedSquareIcon,
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/utils/apiFetch';
import { useTheme } from '@/components/layout/ThemeContext';

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
    <Layout>
      {showModal && <ApiKeyModal onSubmit={handleApiKeySubmit} />}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>
            Welcome to <span className="text-[#1F6FEB]">DcisionAI</span>
          </h1>
          <p className={`text-xl text-docs-muted max-w-3xl mx-auto mb-8`}>
            The intelligent construction management platform that combines AI-powered insights with real-time project analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/construction')}
              className="px-8 py-3 bg-[#1F6FEB] text-white rounded-lg font-semibold hover:bg-[#1F6FEB]/90 transition-colors"
            >
              Get Started
            </button>
            <button
              onClick={() => router.push('/agents')}
              className="px-8 py-3 border border-[#1F6FEB] text-[#1F6FEB] rounded-lg font-semibold hover:bg-[#1F6FEB]/10 transition-colors"
            >
              Explore Agents
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={ChartBarIcon}
            title="Smart Analytics"
            description="AI-powered dashboards that extract insights from your project data automatically."
          />
          <FeatureCard
            icon={BoltIcon}
            title="Real-time Monitoring"
            description="Track project progress, risks, and performance metrics in real-time."
          />
          <FeatureCard
            icon={CpuChipIcon}
            title="Intelligent Agents"
            description="Specialized AI agents for construction planning, risk assessment, and optimization."
          />
          <FeatureCard
            icon={LightBulbIcon}
            title="Scenario Analysis"
            description="Model different project scenarios and their potential impacts on timelines and costs."
          />
          <FeatureCard
            icon={BeakerIcon}
            title="Knowledge Graph"
            description="Interactive knowledge base connecting construction concepts, regulations, and best practices."
          />
          <FeatureCard
            icon={ArrowPathRoundedSquareIcon}
            title="Workflow Automation"
            description="Streamline construction workflows with intelligent automation and decision support."
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-docs-section rounded-xl p-8">
          <h2 className={`text-2xl font-bold mb-6 text-center ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => router.push('/construction')}
              className="p-6 border border-docs-section-border rounded-lg hover:bg-docs-section/80 transition-colors text-left"
            >
              <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>Construction Dashboard</h3>
              <p className="text-docs-muted text-sm">Access your project analytics, KPIs, and scenario analysis tools.</p>
            </button>
            <button
              onClick={() => router.push('/agents')}
              className="p-6 border border-docs-section-border rounded-lg hover:bg-docs-section/80 transition-colors text-left"
            >
              <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>AI Agents</h3>
              <p className="text-docs-muted text-sm">Interact with specialized AI agents for construction insights.</p>
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="p-6 border border-docs-section-border rounded-lg hover:bg-docs-section/80 transition-colors text-left"
            >
              <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>Settings</h3>
              <p className="text-docs-muted text-sm">Configure your API keys, preferences, and system settings.</p>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
} 