import React from 'react';
import HeroSection from '@/components/HeroSection';
import Layout from '@/components/Layout';
import FinanceTabs from '@/workflows/finance/components/FinanceTabs';

const FinancePage = () => {
  return (
    <Layout>
      <div className="p-4 md:p-8">
        <HeroSection title="DcisionAI" tagline="Optimizing financial decisions with intelligent analysis" />
        <FinanceTabs />
      </div>
    </Layout>
  );
};

export default FinancePage; 