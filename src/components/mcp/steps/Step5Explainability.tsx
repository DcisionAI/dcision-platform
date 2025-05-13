import React, { useState } from 'react';
import {
  ChartBarIcon,
  TableCellsIcon,
  DocumentChartBarIcon,
  ArrowsPointingOutIcon,
  AdjustmentsHorizontalIcon,
  LightBulbIcon,
  ChartPieIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ExplanationSection {
  id: string;
  name: string;
  description: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
}

const explanationSections: ExplanationSection[] = [
  { id: 'feature-importance', name: 'Feature Importance', description: 'Understand which factors most influence the solution', icon: ChartBarIcon },
  { id: 'decision-path', name: 'Decision Path', description: 'Visualize the step-by-step reasoning', icon: ArrowPathIcon },
  { id: 'counterfactuals', name: 'Counterfactuals', description: 'Explore what-if scenarios', icon: AdjustmentsHorizontalIcon },
  { id: 'local-explanations', name: 'Local Explanations', description: 'Detailed insights for this specific run', icon: LightBulbIcon },
  { id: 'global-insights', name: 'Global Insights', description: 'Overall patterns and solution behavior', icon: ChartPieIcon },
  { id: 'data-distributions', name: 'Data Distributions', description: 'Inspect key data distributions', icon: DocumentChartBarIcon }
];

const visualizationTypes = [
  { id: 'table', name: 'Table View', icon: TableCellsIcon },
  { id: 'chart', name: 'Chart View', icon: ChartBarIcon },
  { id: 'expanded', name: 'Expanded View', icon: ArrowsPointingOutIcon }
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Step5Explainability() {
  const [selectedSection, setSelectedSection] = useState(explanationSections[0].id);
  const [selectedVisualization, setSelectedVisualization] = useState(visualizationTypes[0].id);

  const currentSection = explanationSections.find(s => s.id === selectedSection)!;

  return (
    <div className="flex w-full bg-docs-body overflow-hidden rounded-lg shadow">
      {/* Sidebar */}
      <div className="w-64 border-r border-docs-border bg-docs-section overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-docs-heading mb-4">Explanation Types</h2>
          <nav className="space-y-2">
            {explanationSections.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className={classNames(
                    'w-full flex items-start p-3 text-left rounded-lg transition-colors',
                    selectedSection === section.id
                      ? 'bg-docs-accent/10 text-docs-accent'
                      : 'hover:bg-docs-hover text-docs-text'
                  )}
                >
                  <Icon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">{section.name}</div>
                    <div className="text-xs text-docs-muted mt-0.5">{section.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-docs-heading">{currentSection.name}</h3>
          <p className="mt-1 text-docs-muted text-sm">{currentSection.description}</p>
        </div>

        {/* Visualization Controls */}
        <div className="mb-6 flex items-center space-x-4">
          {visualizationTypes.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedVisualization(type.id)}
                className={classNames(
                  'flex items-center px-3 py-2 rounded-lg text-sm font-medium',
                  selectedVisualization === type.id
                    ? 'bg-docs-accent text-white'
                    : 'text-docs-text hover:bg-docs-hover'
                )}
              >
                <Icon className="h-5 w-5 mr-2" />
                {type.name}
              </button>
            );
          })}
          <button className="ml-auto px-4 py-2 text-sm font-medium text-docs-text bg-docs-section rounded-lg border border-docs-border hover:bg-docs-hover">
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-docs-section rounded-lg p-6 shadow-lg border border-docs-section-border h-64 flex items-center justify-center">
          <div className="text-docs-muted text-center">
            <LightBulbIcon className="h-10 w-10 mx-auto mb-2 text-docs-accent/20" />
            <p>Select data and run solve to view explanations</p>
          </div>
        </div>
      </div>
    </div>
  );
} 