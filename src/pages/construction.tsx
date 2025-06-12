import React from 'react';
import Layout from '@/components/Layout';
import ConstructionDecisionWorkflows from '@/components/ConstructionDecisionWorkflows';

const ConstructionPage: React.FC = () => {
  return (
    <Layout>
      <div className="h-full">
        <ConstructionDecisionWorkflows />
      </div>
    </Layout>
  );
};

export default ConstructionPage; 