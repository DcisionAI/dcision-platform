import React from 'react';
import Layout from '@/components/Layout';
import FinanceTabs from '@/components/FinanceTabs';

const FinancePage: React.FC = () => {
  return (
    <Layout>
      <div className="h-full">
        <FinanceTabs />
      </div>
    </Layout>
  );
};

export default FinancePage; 