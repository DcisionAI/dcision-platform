import React, { useState } from 'react';
import FinanceAgent from './FinanceAgent';
import UnderDevelopment from '@/components/UnderDevelopment';

const FinanceTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('agent');

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full">
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('agent')}
            className={`${
              activeTab === 'agent'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Finance Agent
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Dashboard
          </button>
        </nav>
      </div>
      <div>
        {activeTab === 'agent' && <FinanceAgent />}
        {activeTab === 'dashboard' && <UnderDevelopment pageName="Finance Dashboard" />}
      </div>
    </div>
  );
};

export default FinanceTabs; 