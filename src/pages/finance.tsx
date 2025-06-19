import React from 'react';
import FinanceTabs from '@/workflows/finance/components/FinanceTabs';

const FinancePage: React.FC = () => {
  return (
    <div className="h-full bg-gray-100">
      <FinanceTabs />
    </div>
  );
};

export default FinancePage; 