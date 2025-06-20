import React from 'react';
import HeroSection from '@/components/HeroSection';
import Layout from '@/components/Layout';
import RetailTabs from '@/workflows/retail/components/RetailTabs';

const RetailPage = () => {
  return (
    <Layout>
      <div className="p-4 md:p-8">
        <HeroSection title="DcisionAI" tagline="Optimizing retail operations with intelligent decision-making" />
        <RetailTabs />
      </div>
    </Layout>
  );
};

export default RetailPage; 