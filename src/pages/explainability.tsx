import Layout from '@/components/Layout';
import { useState } from 'react';
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
  {
    id: 'feature-importance',
    name: 'Feature Importance',
    description: 'Understand which factors most influence the model\'s decisions',
    icon: ChartBarIcon
  },
  {
    id: 'decision-path',
    name: 'Decision Path',
    description: 'Visualize the step-by-step reasoning process',
    icon: ArrowPathIcon
  },
  {
    id: 'counterfactuals',
    name: 'Counterfactuals',
    description: 'Explore "what-if" scenarios and alternative outcomes',
    icon: AdjustmentsHorizontalIcon
  },
  {
    id: 'local-explanations',
    name: 'Local Explanations',
    description: 'Detailed explanations for individual predictions',
    icon: LightBulbIcon
  },
  {
    id: 'global-insights',
    name: 'Global Insights',
    description: 'Overall patterns and model behavior analysis',
    icon: ChartPieIcon
  },
  {
    id: 'data-distributions',
    name: 'Data Distributions',
    description: 'Visualize input data patterns and distributions',
    icon: DocumentChartBarIcon
  }
];

const visualizationTypes = [
  {
    id: 'table',
    name: 'Table View',
    icon: TableCellsIcon
  },
  {
    id: 'chart',
    name: 'Chart View',
    icon: ChartBarIcon
  },
  {
    id: 'expanded',
    name: 'Expanded View',
    icon: ArrowsPointingOutIcon
  }
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ExplainabilityPage() {
  const [selectedSection, setSelectedSection] = useState(explanationSections[0].id);
  const [selectedVisualization, setSelectedVisualization] = useState(visualizationTypes[0].id);

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] bg-docs-body overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 border-r border-docs-border bg-docs-section overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-docs-heading mb-4">
                Explanation Types
              </h2>
              <nav className="space-y-2">
                {explanationSections.map((section) => {
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
                        <div className="font-medium text-sm">
                          {section.name}
                        </div>
                        <div className="text-xs text-docs-muted mt-0.5">
                          {section.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-docs-heading">
                  {explanationSections.find(s => s.id === selectedSection)?.name}
                </h1>
                <p className="mt-2 text-docs-muted">
                  {explanationSections.find(s => s.id === selectedSection)?.description}
                </p>
              </div>

              {/* Visualization Controls */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {visualizationTypes.map((type) => {
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
                </div>

                <button
                  className="px-4 py-2 text-sm font-medium text-docs-text bg-docs-section rounded-lg border border-docs-border hover:bg-docs-hover"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content Area */}
              <div className="bg-docs-section rounded-xl p-6 shadow-lg border border-docs-section-border">
                <div className="h-[500px] flex items-center justify-center text-docs-muted">
                  <div className="text-center">
                    <LightBulbIcon className="h-12 w-12 mx-auto mb-4 text-docs-accent/20" />
                    <p>Select data and run analysis to view explanations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 