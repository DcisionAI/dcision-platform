import { useEffect } from 'react';
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

function FeatureCard({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="border border-docs-section-border shadow-sm rounded-xl p-6 bg-docs-section hover:bg-docs-section/80 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-[#1F6FEB]/10 rounded-lg">
          <Icon className="w-5 h-5 text-[#1F6FEB]" />
        </div>
        <h2 className="text-xl font-semibold text-docs-text">{title}</h2>
      </div>
      <p className="text-docs-muted">{description}</p>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  return null;
} 