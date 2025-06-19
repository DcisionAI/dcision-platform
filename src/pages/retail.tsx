import React from 'react';
import HeroSection from '@/components/HeroSection';
import RetailTabs from '@/workflows/retail/components/RetailTabs';

const RetailPage: React.FC = () => {
  return (
    <div className="h-full">
      <HeroSection tagline="Optimizing retail operations with intelligent decision-making" />
      <RetailTabs />
    </div>
  );
};

export default RetailPage; 