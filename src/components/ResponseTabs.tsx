import React, { useState } from 'react';
import { useTheme } from './layout/ThemeContext';
import MermaidChart from './ui/MermaidChart';

interface SubIntent {
  name: string;
  confidence: number;
}

interface IdentifiedEntities {
  resources: string[];
  phases: string[];
  timeframe: string;
}

interface IntentAnalysis {
  primaryIntent: string;
  confidence: number;
  subIntents: SubIntent[];
  keyConstraints: string[];
  identifiedEntities: IdentifiedEntities;
}

interface ResponseTabsProps {
  content: {
    intentAnalysis?: IntentAnalysis;
    visualization?: string;
    zoom?: string;
  };
}

const ResponseTabs: React.FC<ResponseTabsProps> = ({ content }) => {
  const [activeTab, setActiveTab] = useState('analysis');
  const { theme } = useTheme();

  const tabs = [
    { id: 'analysis', label: 'Analysis' },
    { id: 'details', label: 'Solution Details' },
    { id: 'summary', label: 'Summary' },
    { id: 'visualization', label: 'Visualization' }
  ];

  const renderSummary = () => {
    const stats = [
      { label: 'Workers per Phase', value: 'worker_1: 2, worker_2: 2, worker_3: 1, worker_4: 1' },
      { label: 'Total Workers', value: '6' },
      { label: 'Total Duration', value: '11 weeks' },
      { label: 'Solve Time', value: '384ms' }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{stat.value}</div>
            </div>
          ))}
        </div>
        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Optimization Result</div>
          <div className="mt-2 text-gray-900 dark:text-gray-100">
            The optimal solution achieves efficient crew assignments while maintaining safety and quality standards.
          </div>
        </div>
      </div>
    );
  };

  const renderAnalysis = () => {
    const intentAnalysis: IntentAnalysis = content.intentAnalysis || {
      primaryIntent: 'Construction Resource Optimization',
      confidence: 0.95,
      subIntents: [
        { name: 'Worker Assignment', confidence: 0.92 },
        { name: 'Timeline Planning', confidence: 0.88 },
        { name: 'Cost Optimization', confidence: 0.85 }
      ],
      keyConstraints: [
        'Safety requirements must be met',
        'Resource availability limits',
        'Project timeline constraints',
        'Skill matching requirements'
      ],
      identifiedEntities: {
        resources: ['Carpenters', 'Electricians', 'HVAC Technicians', 'Plumbers'],
        phases: ['Foundation', 'Framing', 'MEP Installation', 'Finishing'],
        timeframe: '11 weeks'
      }
    };

    return (
      <div className="space-y-6">
        {/* Primary Intent */}
        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Primary Intent</h3>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{intentAnalysis.primaryIntent}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Confidence</div>
              <div className="text-lg font-semibold text-[#FF7F50]">{(intentAnalysis.confidence * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Sub-Intents */}
        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Sub-Intents</h3>
          <div className="space-y-3">
            {intentAnalysis.subIntents.map((intent: SubIntent, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-900 dark:text-gray-100">{intent.name}</span>
                <span className="text-[#FF7F50] font-medium">{(intent.confidence * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Identified Entities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Resources</h3>
            <div className="space-y-2">
              {intentAnalysis.identifiedEntities.resources.map((resource: string, index: number) => (
                <div key={index} className="text-gray-700 dark:text-gray-300">• {resource}</div>
              ))}
            </div>
          </div>
          <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Project Phases</h3>
            <div className="space-y-2">
              {intentAnalysis.identifiedEntities.phases.map((phase: string, index: number) => (
                <div key={index} className="text-gray-700 dark:text-gray-300">• {phase}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Constraints */}
        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Identified Constraints</h3>
          <div className="space-y-2">
            {intentAnalysis.keyConstraints.map((constraint: string, index: number) => (
              <div key={index} className="text-gray-700 dark:text-gray-300">• {constraint}</div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDetails = () => {
    const phases = [
      { name: 'Foundation', duration: '2 weeks', workers: ['2 Carpenters', '1 HVAC Tech'] },
      { name: 'Framing', duration: '3 weeks', workers: ['2 Carpenters', '2 Electricians'] },
      { name: 'MEP Installation', duration: '4 weeks', workers: ['3 Plumbers', '2 Electricians', '1 HVAC Tech'] },
      { name: 'Finishing', duration: '2 weeks', workers: ['2 Carpenters', '1 Electrician'] }
    ];

    const constraints = [
      { name: 'Safety Requirements', description: 'Minimum skilled workers per phase maintained' },
      { name: 'Resource Limits', description: 'Worker assignments within available capacity' },
      { name: 'Quality Standards', description: 'Proper skill distribution across phases' },
      { name: 'Timeline Optimization', description: 'Efficient scheduling to minimize total duration' }
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Phase Details</h3>
          <div className="grid grid-cols-1 gap-4">
            {phases.map((phase, index) => (
              <div key={index} className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{phase.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Duration: {phase.duration}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Assigned Workers:</div>
                    {phase.workers.map((worker, i) => (
                      <div key={i} className="text-sm text-gray-500 dark:text-gray-400">{worker}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Optimization Constraints</h3>
          <div className="grid grid-cols-1 gap-4">
            {constraints.map((constraint, index) => (
              <div key={index} className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{constraint.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{constraint.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'summary':
        return renderSummary();
      case 'analysis':
        return renderAnalysis();
      case 'details':
        return renderDetails();
      case 'visualization':
        return content.visualization ? (
          <div className="w-full">
            <div className="overflow-x-auto bg-gray-100/50 dark:bg-gray-800/50 rounded-lg">
              <MermaidChart content={content.visualization} />
            </div>
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            No visualization available for this solution.
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full -mx-6">
      <div className="border-b border-gray-200 dark:border-gray-700 w-full">
        <nav className="-mb-px flex w-full" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-[#FF7F50] text-[#FF7F50]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6 w-full px-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default ResponseTabs; 