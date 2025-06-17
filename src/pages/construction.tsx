import React from 'react';
import Layout from '@/components/Layout';
import ConstructionWorkflowTabs from '@/components/ConstructionWorkflowTabs';

const ConstructionPage: React.FC = () => {
  return (
    <Layout>
      <div className="h-full">
        <ConstructionWorkflowTabs />
      </div>
    </Layout>
  );
};

export default ConstructionPage; 