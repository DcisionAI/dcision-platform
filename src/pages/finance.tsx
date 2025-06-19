import React from 'react';
import HeroSection from '@/components/HeroSection';
import FinanceTabs from '@/workflows/finance/components/FinanceTabs';

const FinancePage: React.FC = () => {
  return (
    <div className="h-full">
      <HeroSection tagline="Optimizing financial decisions with intelligent analysis" />
      <FinanceTabs />
    </div>
  );
};

export default FinancePage; 