import React from 'react';
import HeroSection from '@/components/HeroSection';
import RetailTabs from '@/workflows/retail/components/RetailTabs';

const RetailPage = () => {
  return (
    <>
      <HeroSection title="DcisionAI" tagline="Optimizing retail operations with intelligent decision-making" />
      <RetailTabs />
    </>
  );
};

export default RetailPage; 