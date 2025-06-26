import React from 'react';
import HeroSection from '@/components/HeroSection';
import ExperimentalAIAssistant from '@/components/ExperimentalAIAssistant';

const FinancePage = () => {
  return (
    <div className="p-4 md:p-8">
      <HeroSection title="DcisionAI" tagline="Optimizing financial decisions with intelligent analysis" />
      <div className="mt-8">
        <ExperimentalAIAssistant />
      </div>
    </div>
  );
};

export default FinancePage; 