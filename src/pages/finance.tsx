import React from 'react';
import HeroSection from '@/components/HeroSection';
import FinanceTabs from '@/workflows/finance/components/FinanceTabs';

const FinancePage = () => {
  return (
    <>
      <HeroSection title="DcisionAI" tagline="Optimizing financial decisions with intelligent analysis" />
      <FinanceTabs />
    </>
  );
};

export default FinancePage; 