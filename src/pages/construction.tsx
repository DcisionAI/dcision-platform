import React from 'react';
import HeroSection from '@/components/HeroSection';
import ConstructionWorkflowTabs from '@/workflows/construction/components/ConstructionWorkflowTabs';

const ConstructionPage: React.FC = () => {
  return (
    <div className="h-full">
      <HeroSection tagline="Optimizing construction workflows with intelligent decision-making" />
      <ConstructionWorkflowTabs />
    </div>
  );
};

export default ConstructionPage; 