import React from 'react';
import HeroSection from "@/components/HeroSection";
import ExperimentalAIAssistant from '@/components/ExperimentalAIAssistant';

const ConstructionPage: React.FC = () => {
  return (
    <div className="p-4 md:p-8">
      <HeroSection title="DcisionAI" tagline="Optimizing construction workflows with intelligent decision-making" />
      <div className="mt-8">
        <ExperimentalAIAssistant />
      </div>
    </div>
  );
};

export default ConstructionPage; 