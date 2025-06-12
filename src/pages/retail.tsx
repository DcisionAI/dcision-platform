import React from 'react';
import Layout from '@/components/Layout';
import RetailTabs from '@/components/RetailTabs';

const RetailPage: React.FC = () => {
  return (
    <Layout>
      <div className="h-full">
        <RetailTabs />
      </div>
    </Layout>
  );
};

export default RetailPage; 