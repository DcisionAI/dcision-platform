import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from './layout/ThemeContext';
import dynamic from 'next/dynamic';
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CpuChipIcon,
  ServerIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import DecisionTreeGraph from './DecisionTreeGraph';
import ExperimentalAgentChat from './ExperimentalAgentChat';
import ReactMarkdown from 'react-markdown';

// Dynamically import heavy visualization libraries
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">Loading network graph...</div>
});

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">Loading 3D visualization...</div>
});

// Mock data for WebSocket simulation
const mockAgentData = {
  agents: [
    { id: 'intent', name: 'Intent Agent', status: 'running', cpu: 45, memory: 128, apiCalls: 12, responseTime: 234, successRate: 0.95 },
    { id: 'data', name: 'Data Agent', status: 'idle', cpu: 12, memory: 64, apiCalls: 8, responseTime: 156, successRate: 0.92 },
    { id: 'model', name: 'Model Builder', status: 'completed', cpu: 78, memory: 256, apiCalls: 25, responseTime: 892, successRate: 0.88 },
    { id: 'solver', name: 'Solver', status: 'running', cpu: 92, memory: 512, apiCalls: 45, responseTime: 1247, successRate: 0.96 },
    { id: 'explain', name: 'Explain Agent', status: 'idle', cpu: 23, memory: 96, apiCalls: 15, responseTime: 445, successRate: 0.91 },
  ],
  connections: [
    { source: 'intent', target: 'data', dataFlow: 'query' },
    { source: 'data', target: 'model', dataFlow: 'enriched_data' },
    { source: 'model', target: 'solver', dataFlow: 'optimization_model' },
    { source: 'solver', target: 'explain', dataFlow: 'solution' },
    { source: 'intent', target: 'explain', dataFlow: 'context' },
  ],
  pipeline: [
    { step: 'input_analysis', status: 'complete', duration: 234, dataSize: '2.3KB' },
    { step: 'intent_classification', status: 'complete', duration: 156, dataSize: '1.1KB' },
    { step: 'data_enrichment', status: 'running', duration: 892, dataSize: '15.7KB' },
    { step: 'model_building', status: 'pending', duration: 0, dataSize: '0KB' },
    { step: 'optimization', status: 'pending', duration: 0, dataSize: '0KB' },
    { step: 'explanation', status: 'pending', duration: 0, dataSize: '0KB' },
  ]
};

// Mock 3D solution data
const mockSolutionData = {
  points: Array.from({ length: 100 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: Math.random() * 100,
    cost: Math.random() * 1000000,
    duration: Math.random() * 365,
    efficiency: Math.random(),
    category: ['optimal', 'feasible', 'infeasible'][Math.floor(Math.random() * 3)]
  })),
  constraints: [
    { name: 'Budget', value: 800000, type: 'upper_bound' },
    { name: 'Timeline', value: 300, type: 'upper_bound' },
    { name: 'Min Efficiency', value: 0.7, type: 'lower_bound' },
  ]
};

interface ExperimentalAIAssistantProps {}

// Utility: Summarize text (first 2-3 sentences)
function summarizeText(text: string): string {
  if (!text) return '';
  // Simple extractive: split by sentence, take first 2-3
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return text;
  return sentences.slice(0, 3).join(' ');
}

// Hook: Typewriter effect
function useTypewriterEffect(fullText: string, speed: number = 30) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    if (!fullText) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => prev + fullText[i]);
      i++;
      if (i >= fullText.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [fullText, speed]);
  return displayed;
}

// Utility: Filter and map progress events to user-facing messages
function filterUserFacingEvents(events: any[]): string[] {
  if (!Array.isArray(events)) return [];
  const technicalKeywords = [
    'parsing error',
    'fallback',
    'debug',
    'trace',
    'internal',
    'exception',
    'error',
    'stack',
    'Creating fallback explanation',
    'Invalid',
    'Unhandled',
    'warn',
    'test',
    'dev',
    'deprecated',
    'not implemented',
    'undefined',
    'null',
  ];
  return events
    .map(ev => typeof ev === 'string' ? ev : ev.message || '')
    .filter(msg =>
      msg &&
      !technicalKeywords.some(keyword => msg.toLowerCase().includes(keyword))
    );
}

// Helper: Extract agent thinking summaries from the response
function getAgentSummaries(response: any) {
  if (!response) return [];
  const summaries = [];
  // Intent Agent
  if (response.intentAgentAnalysis) {
    summaries.push({
      agent: 'Intent Agent',
      summary: `Classified the query as "${response.intentAgentAnalysis.primaryIntent}" (decision type: ${response.intentAgentAnalysis.decisionType}). Key concepts: ${response.intentAgentAnalysis.keywords?.join(', ') || 'N/A'}. Confidence: ${(response.intentAgentAnalysis.confidence * 100).toFixed(0)}%. Reasoning: ${response.intentAgentAnalysis.reasoning}`
    });
  }
  // Data Agent (if present)
  if (response.dataAgentAnalysis) {
    summaries.push({
      agent: 'Data Agent',
      summary: response.dataAgentAnalysis.summary || 'No additional data required for this query.'
    });
  }
  // Model Builder Agent (if present)
  if (response.modelBuilderAnalysis) {
    summaries.push({
      agent: 'Model Builder',
      summary: response.modelBuilderAnalysis.summary || 'No optimization model built for this query.'
    });
  }
  // Solver (if present)
  if (response.solverAnalysis) {
    summaries.push({
      agent: 'Solver',
      summary: response.solverAnalysis.summary || 'No solver run for this query.'
    });
  }
  // Explain Agent (if present)
  if (response.explainAgentAnalysis) {
    summaries.push({
      agent: 'Explain Agent',
      summary: response.explainAgentAnalysis.summary || 'Synthesized explanation for the user.'
    });
  }
  // Fallback: If only intentAgentAnalysis is present
  if (summaries.length === 0 && response.intentAgentAnalysis) {
    summaries.push({
      agent: 'Intent Agent',
      summary: `Classified the query as "${response.intentAgentAnalysis.primaryIntent}" (decision type: ${response.intentAgentAnalysis.decisionType}). Key concepts: ${response.intentAgentAnalysis.keywords?.join(', ') || 'N/A'}. Confidence: ${(response.intentAgentAnalysis.confidence * 100).toFixed(0)}%. Reasoning: ${response.intentAgentAnalysis.reasoning}`
    });
  }
  return summaries;
}

const ExperimentalAIAssistant: React.FC<ExperimentalAIAssistantProps> = () => {
  const { theme } = useTheme();
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [agentData, setAgentData] = useState(mockAgentData);
  const [activeTab, setActiveTab] = useState('agent-response');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [latestQuery, setLatestQuery] = useState<string | null>(null);
  const [latestResponse, setLatestResponse] = useState<any>(null);

  // --- FIX: Move these hooks to the top level ---
  const [isProcessing, setIsProcessing] = React.useState(true);
  const [showFullAnalysis, setShowFullAnalysis] = React.useState(false);

  // Enterprise-grade progress messages during processing
  const processingSteps = [
    "DcisionAI Orchestration Engine: Initializing multi-agent workflow...",
    "Intent Agent: Conducting advanced intent analysis...",
    "Extracting key concepts and operational parameters...",
    "Classifying query: Determining optimal execution path (RAG/Optimization/Hybrid)...",
    "AI Reasoning: Synthesizing domain knowledge and operational constraints...",
    "Awaiting agent responses..."
  ];

  // Full analysis messages once backend data is available
  const fullAnalysisSteps = latestResponse?.intentAgentAnalysis ? [
    `Intent Analysis: Primary Intent: ${latestResponse.intentAgentAnalysis.primaryIntent}`,
    `Key Concepts: ${latestResponse.intentAgentAnalysis.keywords?.join(', ') || 'N/A'}`,
    `Classification & Reasoning: Execution Path: ${latestResponse.intentAgentAnalysis.decisionType}. Reasoning: ${latestResponse.intentAgentAnalysis.reasoning}`,
    `AI Reasoning: Synthesizing ${latestResponse.intentAgentAnalysis.primaryIntent} based on domain knowledge and operational constraints.`
  ] : [];

  const [summary, setSummary] = useState('');

  React.useEffect(() => {
    setIsProcessing(true);
    setShowFullAnalysis(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < processingSteps.length) {
        setSummary(processingSteps[i++]);
      } else {
        clearInterval(interval);
        // After processing steps, show full analysis if we have data
        if (latestResponse?.intentAgentAnalysis) {
          setTimeout(() => {
            setIsProcessing(false);
            setShowFullAnalysis(true);
            setSummary(fullAnalysisSteps.join('\n'));
          }, 1000);
        }
      }
    }, 900);
    return () => clearInterval(interval);
  }, [latestQuery, latestResponse]);

  // Handle chat response
  const handleChatResponse = (payload: { query: string; response: any }) => {
    setLatestQuery(payload.query);
    setLatestResponse(payload.response);
  };

  // Simulate WebSocket connection
  useEffect(() => {
    if (isConnected && isRunning) {
      // Simulate real-time updates
      intervalRef.current = setInterval(() => {
        setAgentData(prev => ({
          ...prev,
          agents: prev.agents.map(agent => ({
            ...agent,
            cpu: Math.max(0, Math.min(100, agent.cpu + (Math.random() - 0.5) * 10)),
            memory: Math.max(0, Math.min(1024, agent.memory + (Math.random() - 0.5) * 20)),
            apiCalls: agent.apiCalls + Math.floor(Math.random() * 3),
            responseTime: Math.max(100, agent.responseTime + (Math.random() - 0.5) * 50),
            successRate: Math.max(0.8, Math.min(1, agent.successRate + (Math.random() - 0.5) * 0.02)),
          }))
        }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isConnected, isRunning]);

  const toggleConnection = () => {
    setIsConnected(!isConnected);
    if (!isConnected) {
      setTimeout(() => setIsRunning(true), 500);
    } else {
      setIsRunning(false);
    }
  };

  const resetSimulation = () => {
    setAgentData(mockAgentData);
    setSelectedAgent(null);
  };

  const tabs = [
    { id: 'agent-response', label: 'Agent Response', icon: CheckCircleIcon },
    { id: '3d', label: '3D Solution Space', icon: CpuChipIcon },
    { id: 'pipeline', label: 'Pipeline Flow', icon: ServerIcon },
    { id: 'metrics', label: 'Performance Metrics', icon: ClockIcon },
    { id: 'decision-tree', label: 'Decision Tree', icon: CheckCircleIcon },
  ];

  const summaryText = React.useMemo(() => {
    if (!showFullAnalysis || !latestResponse) return '';
    let content = '';
    if (typeof latestResponse.content === 'string') {
      content = latestResponse.content;
    } else if (typeof latestResponse.message === 'string') {
      content = latestResponse.message;
    } else if (latestResponse.content) {
      content = JSON.stringify(latestResponse.content);
    }
    return summarizeText(content);
  }, [showFullAnalysis, latestResponse]);

  const animatedSummary = useTypewriterEffect(summaryText, 18);

  const renderAgentCollaboration = (query: string | null, response: any) => {
    const agentSummaries = getAgentSummaries(response);
    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Agent Collaboration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agentSummaries.map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow p-6 flex flex-col">
              <div className="flex items-center mb-2">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.agent}</span>
              </div>
              <div className="text-gray-700 dark:text-gray-300 text-base whitespace-pre-line">{item.summary}</div>
            </div>
          ))}
          {agentSummaries.length === 0 && (
            <div className="text-gray-500 dark:text-gray-400">No agent analysis available for this query.</div>
          )}
        </div>
      </div>
    );
  };

  const render3DSolutionSpace = (query: string | null, response: any) => {
    const colors = mockSolutionData.points.map(point => {
      switch (point.category) {
        case 'optimal': return '#10b981';
        case 'feasible': return '#3b82f6';
        case 'infeasible': return '#ef4444';
        default: return '#6b7280';
      }
    });

    const plotData = [
      {
        type: 'scatter3d',
        mode: 'markers',
        x: mockSolutionData.points.map(p => p.x),
        y: mockSolutionData.points.map(p => p.y),
        z: mockSolutionData.points.map(p => p.z),
        marker: {
          size: mockSolutionData.points.map(p => p.efficiency * 10 + 2),
          color: colors,
          opacity: 0.8,
        },
        text: mockSolutionData.points.map(p => 
          `Cost: $${p.cost.toLocaleString()}<br>Duration: ${p.duration} days<br>Efficiency: ${(p.efficiency * 100).toFixed(1)}%`
        ),
        hovertemplate: '<b>%{text}</b><extra></extra>',
      }
    ];

    const layout = {
      title: '3D Solution Space',
      scene: {
        xaxis: { title: 'Cost ($)' },
        yaxis: { title: 'Duration (days)' },
        zaxis: { title: 'Efficiency (%)' },
        camera: {
          eye: { x: 1.5, y: 1.5, z: 1.5 }
        }
      },
      margin: { l: 0, r: 0, b: 0, t: 40 },
      height: 500,
      paper_bgcolor: '#f4f1ea',
      plot_bgcolor: '#f4f1ea',
      font: { color: theme === 'dark' ? '#ffffff' : '#000000' },
    };

    return (
      <div className="space-y-8">
        <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">3D Solution Space</h3>
        
        <div className="bg-docs-section dark:bg-[#181a1b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Optimal</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Feasible</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Infeasible</span>
              </div>
            </div>
          </div>
          
          <div className="bg-docs-bg dark:bg-docs-dark-bg rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <Plot
              data={plotData}
              layout={layout}
              config={{ responsive: true }}
              style={{ width: '100%', height: '500px' }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockSolutionData.constraints.map((constraint, index) => (
              <div key={index} className="bg-docs-bg dark:bg-docs-dark-bg rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="font-semibold mb-2">{constraint.name}</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {typeof constraint.value === 'number' && constraint.value > 1000 
                    ? `$${constraint.value.toLocaleString()}`
                    : constraint.value
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {constraint.type.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPipelineFlow = (query: string | null, response: any) => {
    return (
      <div className="space-y-8">
        <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Pipeline Flow</h3>
        
        <div className="bg-docs-section dark:bg-[#181a1b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-8 mb-8">
          <div className="space-y-4">
            {agentData.pipeline.map((step, index) => (
              <div key={step.step} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === 'complete' ? 'bg-green-500' :
                    step.status === 'running' ? 'bg-blue-500 animate-pulse' :
                    'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    {step.status === 'complete' ? (
                      <CheckCircleIcon className="w-5 h-5 text-white" />
                    ) : step.status === 'running' ? (
                      <PlayIcon className="w-4 h-4 text-white" />
                    ) : (
                      <ClockIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium capitalize">
                      {step.step.replace('_', ' ')}
                    </h4>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {step.duration > 0 ? `${step.duration}ms` : 'Pending'}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        step.status === 'complete' ? 'bg-green-500' :
                        step.status === 'running' ? 'bg-blue-500' :
                        'bg-gray-300 dark:bg-gray-600'
                      }`}
                      style={{
                        width: step.status === 'complete' ? '100%' :
                               step.status === 'running' ? '60%' : '0%'
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {step.dataSize}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {step.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceMetrics = (query: string | null, response: any) => {
    const metrics = [
      { name: 'Average Response Time', value: '456ms', trend: 'down', change: '-12%' },
      { name: 'Success Rate', value: '94.2%', trend: 'up', change: '+2.1%' },
      { name: 'Total API Calls', value: '1,247', trend: 'up', change: '+8.3%' },
      { name: 'Memory Usage', value: '1.2GB', trend: 'stable', change: '0%' },
      { name: 'CPU Utilization', value: '67%', trend: 'down', change: '-5.2%' },
      { name: 'Active Sessions', value: '23', trend: 'up', change: '+15%' },
    ];

    return (
      <div className="space-y-8">
        <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Performance Metrics</h3>
        
        <div className="bg-docs-section dark:bg-[#181a1b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-8 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.name}
                </h4>
                <span className={`text-xs font-medium ${
                  metric.trend === 'up' ? 'text-green-600' :
                  metric.trend === 'down' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {metric.change}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <h4 className="text-lg font-semibold mb-4">Agent Performance Comparison</h4>
            <div className="space-y-4">
              {agentData.agents.map((agent, index) => (
                <div key={agent.id} className="flex items-center space-x-4">
                  <div className="w-32 text-sm font-medium">{agent.name}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Response Time</span>
                      <span className="text-xs font-medium">{agent.responseTime}ms</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (agent.responseTime / 1500) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Success Rate</span>
                      <span className="text-xs font-medium">{(agent.successRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${agent.successRate * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDecisionTree = (query: string | null, response: any) => (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Decision Tree Visualization</h3>
      <div className="bg-docs-section dark:bg-[#181a1b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-8 mb-8">
        <DecisionTreeGraph />
      </div>
    </div>
  );

  const renderAgentResponse = (query: string | null, response: any) => {
    console.log('Agent Response:', response);
    return (
      <div className="space-y-8">
        <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Agent Response</h3>
        <div className="bg-docs-section dark:bg-[#181a1b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-8 mb-8">
          {response && (response.rag || response.content || response.message) ? (
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>
                {response.rag
                  || response.content
                  || response.message
                  || 'No response content available.'}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No agent response available. Submit a query to see results.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'agent-response':
        return renderAgentResponse(latestQuery, latestResponse);
      case '3d':
        return render3DSolutionSpace(latestQuery, latestResponse);
      case 'pipeline':
        return renderPipelineFlow(latestQuery, latestResponse);
      case 'metrics':
        return renderPerformanceMetrics(latestQuery, latestResponse);
      case 'decision-tree':
        return renderDecisionTree(latestQuery, latestResponse);
      default:
        return renderAgentResponse(latestQuery, latestResponse);
    }
  };

  return (
    <div className="bg-docs-bg dark:bg-docs-dark-bg min-h-screen w-full">
      {/* Chat Box at the Top */}
      <div className="p-6">
        <ExperimentalAgentChat
          placeholder="Ask anything or upload a file to get started..."
          showSmartPrompts={true}
          onResponse={({ query, response }) => {
            setLatestQuery(query);
            setLatestResponse(response);
          }}
        />
      </div>
      {/* Tab Navigation */}
      <div className="bg-transparent border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      {/* Main Content */}
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default ExperimentalAIAssistant;
