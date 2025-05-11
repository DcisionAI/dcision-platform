import React, { useState, useEffect } from 'react';
import PlaygroundEditor from './PlaygroundEditor';
import PlaygroundSettings from './PlaygroundSettings';
import { MCPExamples } from './MCPExamples';
import AgentResponse from './AgentResponse';
import { MCP } from '@/mcp/MCPTypes';
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
    <div className="bg-docs-section border border-docs-section-border shadow rounded-lg p-4 flex flex-col h-full">
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
  const [mcpConfig, setMcpConfig] = useState<MCP>({
    id: 'new-mcp',
    sessionId: 'new-session',
    version: '1.0',
    status: 'pending',
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    model: {
      variables: [
        {
          name: 'location',
          type: 'object',
          description: 'Location coordinates',
          metadata: {
            properties: {
              lat: 'number',
              lng: 'number'
            }
          }
        },
        {
          name: 'timestamp',
          type: 'datetime',
          description: 'Event timestamp'
        }
      ],
      constraints: [
        {
          type: 'distance',
          description: 'Maximum distance constraint',
          operator: 'lte',
          field: 'distance',
          value: 100,
          priority: 'must'
        }
      ],
      objective: {
        type: 'minimize',
        field: 'total_distance',
        description: 'Minimize total distance traveled',
        weight: 1
      }
    },
    context: {
      environment: {
        region: 'US-East',
        timezone: 'America/New_York'
      },
      dataset: {
        internalSources: ['vehicles', 'orders'],
        dataQuality: 'good',
        requiredFields: ['location', 'timestamp']
      },
      problemType: 'vehicle_routing',
      industry: 'logistics'
    },
    protocol: {
      steps: [
        {
          id: 'step1',
          action: 'collect_data',
          description: 'Collect vehicle and order data',
          required: true
        },
        {
          id: 'step2',
          action: 'enrich_data',
          description: 'Enrich with geolocation data',
          required: true
        },
        {
          id: 'step3',
          action: 'build_model',
          description: 'Build optimization model',
          required: true
        },
        {
          id: 'step4',
          action: 'solve_model',
          description: 'Solve routing problem',
          required: true
        },
        {
          id: 'step5',
          action: 'explain_solution',
          description: 'Generate solution explanation',
          required: true
        }
      ]
    },
    metadata: {
      solver: 'or_tools',
      timeLimit: 600,
      solutionGap: 1
    }
  });

  const [agentResponse, setAgentResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const event = new CustomEvent('toggle-sidebar', { detail: { show: false } });
    window.dispatchEvent(event);
    
    return () => {
      const restoreEvent = new CustomEvent('toggle-sidebar', { detail: { show: true } });
      window.dispatchEvent(restoreEvent);
    };
  }, []);

  const handleExampleSelect = (example: MCP) => {
    setMcpConfig(example);
  };

  const handleConfigChange = (newConfig: MCP) => {
    setMcpConfig(newConfig);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/mcp/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mcpConfig),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      // Check if the response is from DataMappingAgent
      if (data.output && data.output.fieldRequirements) {
        setAgentResponse(data.output);
      } else {
        // Handle other agent responses
        setAgentResponse(data);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAgentResponse(null);
    }
  };

  const problemType = mcpConfig.context?.problemType || 'vehicle_routing';
  const currentInfo = exampleInfo[problemType as keyof typeof exampleInfo] || exampleInfo.vehicle_routing;

  return (
    <div className="min-h-screen bg-[#0D1117] text-gray-300 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mt-8">
          <h2 className="text-white font-medium mb-4">How It Works</h2>
          <div className="grid grid-cols-3 gap-4">
            {currentInfo.cards.map((card, index) => (
              <InfoCard key={index} {...card} />
            ))}
          </div>
        </div>

        <div className="flex gap-8">
          <div className="w-1/4">
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-white">EXAMPLES</h2>
            </div>
            <div className="bg-[#161B22] rounded-lg p-3">
              <MCPExamples onSelect={handleExampleSelect} />
            </div>
          </div>

          <div className="flex-1">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <PlaygroundEditor
                  config={mcpConfig}
                  onConfigChange={handleConfigChange}
                />
                <div className="mt-4">
                  <button
                    className="px-4 py-2 bg-[#4F46E5] text-white rounded hover:bg-[#4338CA] focus:outline-none"
                    onClick={handleSubmit}
                  >
                    Run MCP
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                <PlaygroundSettings
                  config={mcpConfig}
                  onConfigChange={handleConfigChange}
                />
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
                    {error}
                  </div>
                )}

                {agentResponse && agentResponse.fieldRequirements && (
                  <AgentResponse response={agentResponse} />
                )}

                {agentResponse && !agentResponse.fieldRequirements && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm">
                      {JSON.stringify(agentResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
            <PlaygroundSettings
              config={mcpConfig}
              onConfigChange={handleConfigChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 