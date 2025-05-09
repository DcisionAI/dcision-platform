import React, { useState } from 'react';

const tabs = ['Mapping', 'Enrich', 'Validate'];

const Step2DataPrep: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 2: Data Prep</h2>
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 font-medium text-sm focus:outline-none ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <p className="text-gray-700 dark:text-gray-300 text-sm">
          {`Tab content for ${activeTab}`}
        </p>
        {/* TODO: Implement ${activeTab} UI */}
      </div>
    </div>
  );
};

export default Step2DataPrep;