import React, { useState } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';

interface Scenario {
  id: string;
  name: string;
  description: string;
  metrics: {
    [key: string]: number;
  };
  probability: number;
  impact: 'high' | 'medium' | 'low';
}

interface ScenarioAnalysisProps {
  scenarios: Scenario[];
  onScenarioSelect?: (scenario: Scenario) => void;
}

const ScenarioAnalysis: React.FC<ScenarioAnalysisProps> = ({ scenarios, onScenarioSelect }) => {
  const { theme } = useTheme();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const handleScenarioSelect = (scenario: Scenario) => {
    setSelectedScenario(scenario.id);
    onScenarioSelect?.(scenario);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return '';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-docs-section-border">
        <h2 className="text-xl font-semibold">Scenario Analysis</h2>
        <p className={`text-sm ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'}`}>
          Compare different scenarios and their potential impacts
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Scenarios List */}
        <div className={`w-64 border-r ${theme === 'dark' ? 'border-docs-dark-muted' : 'border-docs-muted'}`}>
          <div className="p-3 border-b border-docs-section-border">
            <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>
              Scenarios
            </h3>
          </div>
          <div className="overflow-y-auto h-[calc(100%-2.5rem)]">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleScenarioSelect(scenario)}
                className={`w-full text-left p-3 hover:bg-docs-section dark:hover:bg-docs-dark-bg border-b ${
                  theme === 'dark' ? 'border-docs-dark-muted' : 'border-docs-muted'
                } ${selectedScenario === scenario.id ? 'bg-docs-section dark:bg-docs-dark-bg' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>
                    {scenario.name}
                  </span>
                  <span className={`text-xs ${getImpactColor(scenario.impact)}`}>
                    {scenario.impact.toUpperCase()}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'}`}>
                  {scenario.description}
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                      className="h-1 bg-docs-accent rounded-full"
                      style={{ width: `${scenario.probability}%` }}
                    />
                  </div>
                  <span className={`text-xs ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'}`}>
                    {scenario.probability}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Scenario Details */}
        <div className="flex-1 p-4 overflow-auto">
          {selectedScenario ? (
            <div>
              <h3 className="text-lg font-medium mb-4">
                {scenarios.find(s => s.id === selectedScenario)?.name}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(scenarios.find(s => s.id === selectedScenario)?.metrics || {}).map(([key, value]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-docs-dark-bg border-docs-dark-muted'
                        : 'bg-white border-docs-muted'
                    }`}
                  >
                    <div className={`text-sm ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'}`}>
                      {key}
                    </div>
                    <div className={`text-xl font-semibold mt-1 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>
                      {value.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`text-center p-8 ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'}`}>
              Select a scenario to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioAnalysis; 