import React, { useState, useEffect } from 'react';
import PlaygroundEditor from './PlaygroundEditor';
import PlaygroundSettings from './PlaygroundSettings';
import MCPExamples from './MCPExamples';
import { MCP } from '../../server/mcp/types/MCPTypes';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  CubeIcon,
  GlobeAltIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const exampleInfo = {
  'vehicle_routing': {
    cards: [
      {
        icon: CubeIcon,
        title: 'Model',
        description: 'Structures your fleet management decisions including vehicle load planning, delivery scheduling, and time management. Focuses on minimizing operational costs while maintaining service quality.',
        highlight: 'Smart Fleet Planning & Route Design',
        agents: 'ProblemAnalyst Agent understands business needs\nModelBuilder Agent structures decision rules\nConstraintValidator Agent ensures business rule compliance'
      },
      {
        icon: GlobeAltIcon,
        title: 'Context',
        description: 'Adapts decisions to your New York Metro operations, considering local traffic patterns, weather conditions, and delivery requirements specific to your business environment.',
        highlight: 'Real-time Market Intelligence',
        agents: 'BusinessContext Agent analyzes operational environment\nDataEnrichment Agent adds real-time insights\nDomainExpert Agent applies industry best practices'
      },
      {
        icon: ArrowPathIcon,
        title: 'Protocol',
        description: 'Guides the decision-making process from data gathering to final recommendations, ensuring transparency and business rule compliance at every step.',
        highlight: 'Intelligent Decision Flow',
        agents: 'Orchestrator Agent coordinates workflow\nQualityAssurance Agent validates decisions\nExplainabilityAgent provides business insights\nStakeholderAgent ensures alignment with goals'
      }
    ]
  },
  'workforce_optimization': {
    cards: [
      {
        icon: CubeIcon,
        title: 'Model',
        description: 'Structures your workforce decisions including skill matching, schedule planning, and resource allocation. Focuses on maximizing service delivery while maintaining team satisfaction.',
        highlight: 'Smart Workforce Planning',
        agents: 'ProblemAnalyst Agent understands staffing needs\nModelBuilder Agent structures scheduling rules\nSkillMatcher Agent aligns capabilities with requirements'
      },
      {
        icon: GlobeAltIcon,
        title: 'Context',
        description: 'Tailors decisions to your Los Angeles service operations, considering local business conditions, team capabilities, and service requirements specific to your market.',
        highlight: 'Team & Market Intelligence',
        agents: 'BusinessContext Agent analyzes market conditions\nProfileAnalyzer Agent understands team capabilities\nPerformancePredictor Agent forecasts service outcomes'
      },
      {
        icon: ArrowPathIcon,
        title: 'Protocol',
        description: 'Manages the decision process from requirement analysis to final scheduling, ensuring fair workload distribution and service level achievement.',
        highlight: 'Intelligent Service Flow',
        agents: 'Orchestrator Agent manages workflow\nScheduleValidator Agent ensures feasibility\nFairnessAgent balances workload distribution\nStakeholderAgent aligns with business goals'
      }
    ]
  }
};

function InfoCard({ icon: Icon, title, description, highlight, agents }: { 
  icon: React.ElementType;
  title: string;
  description: string;
  highlight: string;
  agents: string;
}) {
  return (
    <div className="bg-[#1C2128] rounded-lg p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-[#2D333B] rounded-lg">
          <Icon className="w-4 h-4 text-[#58A6FF]" />
        </div>
        <h3 className="text-white font-medium">{title}</h3>
      </div>
      <p className="text-[#8B949E] text-sm mb-3 flex-grow">{description}</p>
      <div className="space-y-1.5">
        <div className="bg-[#2D333B] rounded-lg px-3 py-1.5">
          <p className="text-[#58A6FF] text-sm font-medium">{highlight}</p>
        </div>
        <div className="bg-[#2D333B]/50 rounded-lg px-3 py-2">
          <div className="text-[#58A6FF]/90 text-sm">
            <p className="font-medium mb-1">🤖 Agents at Play:</p>
            {agents.split('\n').map((agent, index) => (
              <p key={index} className="pl-3 text-xs leading-snug">{`• ${agent}`}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MCPResponse {
  error?: string;
  details?: string;
  // Add other response fields as needed
}

export default function Playground() {
  const [mcpConfig, setMcpConfig] = useState<Partial<MCP>>({
    context: {
      problemType: 'vehicle_routing', // Set default problem type
      industry: 'logistics',
      environment: {
        region: 'New York Metro',
        timezone: 'EST'
      },
      dataset: {
        internalSources: [],
        externalEnrichment: []
      }
    }
  });
  const [response, setResponse] = useState<MCPResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const event = new CustomEvent('toggle-sidebar', { detail: { show: false } });
    window.dispatchEvent(event);
    
    return () => {
      const restoreEvent = new CustomEvent('toggle-sidebar', { detail: { show: true } });
      window.dispatchEvent(restoreEvent);
    };
  }, []);

  const handleExampleSelect = async (example: MCP) => {
    try {
      setLoading(true);
      // Ensure we're creating a new object and not just referencing
      setMcpConfig({
        ...example,
        context: {
          ...example.context,
          dataset: {
            ...example.context.dataset
          },
          environment: {
            ...example.context.environment
          }
        }
      });
    } catch (error) {
      console.error('Error loading example:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      // Validate required fields before submission
      if (!mcpConfig.context?.problemType) {
        setResponse({
          error: "Invalid MCP configuration",
          details: "Missing required field: context.problemType"
        });
        return;
      }

      const result = await fetch('/api/mcp/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: mcpConfig,
        }),
      });
      const data = await result.json();
      setResponse(data);
    } catch (err: any) {
      console.error('Error submitting MCP:', err);
      setResponse({
        error: "Submission failed",
        details: err?.message || "An unknown error occurred"
      });
    } finally {
      setLoading(false);
    }
  };

  const problemType = mcpConfig.context?.problemType || 'vehicle_routing';
  const currentInfo = exampleInfo[problemType as keyof typeof exampleInfo] || exampleInfo.vehicle_routing;

  return (
    <div className="relative min-h-screen bg-[#0D1117]">
      {/* Top Cards Section - More compact */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {currentInfo.cards.map((card, index) => (
            <InfoCard key={index} {...card} />
          ))}
        </div>
      </div>

      {/* Main Content Section - Reduced top margin */}
      <div className="px-4 pb-4 flex gap-4">
        {/* Examples Section */}
        <div className="w-1/4">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-white">EXAMPLES</h2>
          </div>
          <div className="bg-[#161B22] rounded-lg p-3">
            <MCPExamples onSelectExample={handleExampleSelect} />
          </div>
        </div>

        {/* Configuration Section */}
        <div className="flex-1">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-white">
              MCP Configuration
            </h2>
            <p className="text-sm text-[#8B949E] mt-0.5">
              Select an example from the sidebar or create your own MCP configuration
            </p>
          </div>
          <div className="bg-[#161B22] rounded-lg p-4">
            <PlaygroundEditor
              config={mcpConfig}
              onConfigChange={setMcpConfig}
            />
            <div className="mt-3">
              <button 
                className={`px-4 py-2 bg-[#4F46E5] text-white rounded hover:bg-[#4338CA] focus:outline-none ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Submit MCP'}
              </button>
            </div>
          </div>
          {response && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-white mb-2">
                Response
              </h3>
              <div className="bg-[#161B22] rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-sm text-[#8B949E]">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Settings Panel */}
      <div 
        className={`fixed top-20 right-0 transition-transform duration-300 transform ${
          showSettings ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="absolute -left-8 top-4 bg-[#1C2128] h-12 w-8 flex items-center justify-center rounded-l-lg hover:bg-[#2D333B] transition-colors"
        >
          {showSettings ? (
            <ChevronRightIcon className="h-5 w-5 text-[#8B949E]" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5 text-[#8B949E]" />
          )}
        </button>
        <div className="w-80 bg-[#1C2128] h-[calc(100vh-5rem)] overflow-y-auto border-l border-[#30363D] shadow-xl">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">SETTINGS</h2>
            <PlaygroundSettings />
          </div>
        </div>
      </div>
    </div>
  );
} 