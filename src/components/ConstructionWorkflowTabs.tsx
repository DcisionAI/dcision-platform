import React, { useState } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';

interface ConstructionWorkflowTabsProps {
  workflowType?: string;
}

const mainTabs = [
  { id: 'upload', label: 'Upload Data' },
  { id: 'review', label: 'Review & Tabulate' },
  { id: 'select', label: 'Select Optimization' },
  { id: 'configure', label: 'Configure & Submit' },
  { id: 'results', label: 'Results' },
];

const resultSubTabs = [
  { id: 'chat', label: 'Chat' },
  { id: 'data', label: 'Data' },
  { id: 'api', label: 'API' },
  { id: 'scenarios', label: 'Scenario Analysis' },
];

const ConstructionWorkflowTabs: React.FC<ConstructionWorkflowTabsProps> = ({ workflowType = 'scheduling' }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('upload');
  const [activeResultTab, setActiveResultTab] = useState('chat');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="p-8">
            <h2 className="text-xl font-semibold mb-4">Upload Project Data (CSV)</h2>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <p className="mb-2">Drag and drop your CSV file here, or click to select a file.</p>
              <button className="mt-2 px-4 py-2 bg-docs-accent text-white rounded">Select File</button>
            </div>
            <p className="mt-4 text-sm text-docs-muted">Supported: Task lists, resources, dependencies, etc.</p>
          </div>
        );
      case 'review':
        return (
          <div className="p-8">
            <h2 className="text-xl font-semibold mb-4">Review & Tabulate Data</h2>
            <div className="border rounded-lg p-4 bg-docs-section dark:bg-docs-dark-bg">
              <p className="mb-2">Here the agent will display a table summarizing your uploaded data.</p>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border-b">Task</th>
                      <th className="px-4 py-2 border-b">Duration</th>
                      <th className="px-4 py-2 border-b">Resource</th>
                      <th className="px-4 py-2 border-b">Dependency</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border-b">Excavation</td>
                      <td className="px-4 py-2 border-b">2 days</td>
                      <td className="px-4 py-2 border-b">Crew A</td>
                      <td className="px-4 py-2 border-b">-</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border-b">Foundation</td>
                      <td className="px-4 py-2 border-b">3 days</td>
                      <td className="px-4 py-2 border-b">Crew B</td>
                      <td className="px-4 py-2 border-b">Excavation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button className="mt-4 px-4 py-2 bg-docs-accent text-white rounded">Confirm & Continue</button>
            </div>
          </div>
        );
      case 'select':
        return (
          <div className="p-8">
            <h2 className="text-xl font-semibold mb-4">Select Optimization Problem</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-4 border rounded-lg hover:bg-docs-section dark:hover:bg-docs-dark-bg">
                <div className="font-semibold mb-1">Project Scheduling</div>
                <div className="text-sm text-docs-muted">Minimize project duration while respecting dependencies and resource limits.</div>
              </button>
              <button className="p-4 border rounded-lg hover:bg-docs-section dark:hover:bg-docs-dark-bg">
                <div className="font-semibold mb-1">Resource Allocation</div>
                <div className="text-sm text-docs-muted">Assign crews and equipment to tasks to minimize idle time and costs.</div>
              </button>
              <button className="p-4 border rounded-lg hover:bg-docs-section dark:hover:bg-docs-dark-bg">
                <div className="font-semibold mb-1">Crew Scheduling</div>
                <div className="text-sm text-docs-muted">Optimize crew shifts and assignments for productivity and compliance.</div>
              </button>
            </div>
            <button className="mt-8 px-4 py-2 bg-docs-accent text-white rounded">Continue</button>
          </div>
        );
      case 'configure':
        return (
          <div className="p-8">
            <h2 className="text-xl font-semibold mb-4">Configure & Submit</h2>
            <div className="border rounded-lg p-4 bg-docs-section dark:bg-docs-dark-bg">
              <p className="mb-2">Review the optimization configuration below. Adjust constraints or objectives if needed.</p>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto">
{`{
  "problem_type": "project_scheduling",
  "tasks": [...],
  "resources": [...],
  "constraints": [...],
  "objectives": ["minimize_duration"]
}`}
              </pre>
              <button className="mt-4 px-4 py-2 bg-docs-accent text-white rounded">Submit for Optimization</button>
            </div>
          </div>
        );
      case 'results':
        return (
          <div className="p-8">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <div className="mb-4">
              <nav className="flex space-x-4" aria-label="Result Tabs">
                {resultSubTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveResultTab(tab.id)}
                    className={`px-4 py-2 rounded-t font-medium text-sm ${
                      activeResultTab === tab.id
                        ? 'bg-docs-accent text-white'
                        : theme === 'dark'
                        ? 'bg-docs-dark-bg text-docs-dark-muted'
                        : 'bg-docs-section text-docs-muted'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="border rounded-b-lg p-6 bg-docs-section dark:bg-docs-dark-bg min-h-[200px]">
              {activeResultTab === 'chat' && <div>Chat with the agent about your results here.</div>}
              {activeResultTab === 'data' && <div>View/download input and output data here.</div>}
              {activeResultTab === 'api' && <div>API endpoint and usage examples here.</div>}
              {activeResultTab === 'scenarios' && <div>Scenario analysis and comparison tools here.</div>}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main Tabs */}
      <div className={`border-b ${theme === 'dark' ? 'border-docs-dark-muted' : 'border-docs-muted'}`}>
        <nav className="flex space-x-8 px-6" aria-label="Workflow Tabs">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-docs-accent text-docs-accent'
                    : `border-transparent ${
                        theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'
                      } hover:${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ConstructionWorkflowTabs; 