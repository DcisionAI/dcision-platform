'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { ProblemType } from '../mcp/types';

// Types
type AgentStatus = 'pending' | 'running' | 'completed' | 'error';

interface AgentStep {
  name: string;
  description: string;
  status: AgentStatus;
  output?: string;
  agent: string;
}

interface Session {
  id: string;
  sessionId: string;
  version: string;
  description: string;
  problemType: ProblemType;
  dataFormat: string;
  sampleData: string;
  steps: AgentStep[];
  startTime: string;
  lastModified: string;
  status: AgentStatus;
}

export default function PlaygroundPage() {
  const [userInput, setUserInput] = useState('');
  const [problemType, setProblemType] = useState('custom');
  const [dataFormat, setDataFormat] = useState('json');
  const [sampleData, setSampleData] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(true);

  // Default Agent Steps Template
  const baseSteps: AgentStep[] = [
    { name: 'Intent Interpreter Agent', description: 'Understand the business request', status: 'pending', agent: 'Intent Interpreter Agent' },
    { name: 'Data Mapping Agent', description: 'Map customer fields to required schema', status: 'pending', agent: 'Data Mapping Agent' },
    { name: 'Data Integration Agent', description: 'Fetch and align internal data', status: 'pending', agent: 'Data Integration Agent' },
    { name: 'Data Enrichment Agent', description: 'Suggest and fetch external data', status: 'pending', agent: 'Data Enrichment Agent' },
    { name: 'Model Runner Agent', description: 'Build and solve optimization model', status: 'pending', agent: 'Model Runner Agent' },
    { name: 'Solution Explanation Agent', description: 'Explain solution in business terms', status: 'pending', agent: 'Solution Explanation Agent' },
    { name: 'Human-in-the-Loop Agent', description: 'Facilitate human review (if enabled)', status: 'pending', agent: 'Human-in-the-Loop Agent' },
    { name: 'Process Automation Agent', description: 'Deploy as API or scheduled workflow', status: 'pending', agent: 'Process Automation Agent' },
  ];

  const getCurrentSession = (): Session | undefined =>
    sessions.find((session) => session.id === activeSessionId);

  const handleStartSession = () => {
    const newSession: Session = {
      id: uuidv4(),
      sessionId: uuidv4(),
      version: uuidv4(),
      description: userInput,
      problemType: problemType as ProblemType,
      dataFormat,
      sampleData,
      steps: baseSteps,
      startTime: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      status: 'running' as AgentStatus
    };
    
    setSessions([...sessions, newSession]);
    setActiveSessionId(newSession.id);
    setShowInput(false);
    runSession(newSession.id, newSession);
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
    setShowInput(true);
  };

  const runSession = async (sessionId: string, initialSession?: Session) => {
    const mockOutputs: Record<string, string | undefined> = {
      'Intent Interpreter Agent': undefined,
      'Data Mapping Agent': 'Successfully mapped input data:\n- 15 delivery locations identified\n- 5 available vehicles\n- Time windows validated\n- Capacity constraints applied',
      'Model Runner Agent': 'Optimization model solved successfully:\n- Total route distance: 213.5 miles\n- Average vehicle utilization: 85%\n- All time windows satisfied\n- Solution found in 2.3 seconds',
      'Solution Explanation Agent': 'Your fleet optimization achieved:\n- 22% reduction in total distance\n- 15% improvement in delivery times\n- Balanced workload across all vehicles\n- All customer time windows respected\n\nRecommended routes have been generated for each vehicle.',
    };

    for (let i = 0; i < baseSteps.length; i++) {
      updateStepStatus(sessionId, i, 'running');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      let output = mockOutputs[baseSteps[i].name];
      
      // Call intent interpreter API for the first step
      if (baseSteps[i].name === 'Intent Interpreter Agent') {
        try {
          const session = initialSession || sessions.find(s => s.id === sessionId);
          if (!session) throw new Error('Session not found');
          
          const response = await fetch('/api/mcp/intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: session.description })
          });
          
          if (!response.ok) throw new Error('Intent interpretation failed');
          
          const result = await response.json();
          if (result.output?.success) {
            output = `Problem Type: ${result.output.selectedModel}\nConfidence: ${(result.output.details.confidence * 100).toFixed(1)}%\n\nReasoning: ${result.output.details.reasoning}\n\nAlternative Types: ${result.output.details.alternativeTypes.join(', ')}`;
            
            // Update the session's problem type
            setSessions(prev => prev.map(s => 
              s.id === sessionId 
                ? { ...s, problemType: result.output.selectedModel as ProblemType }
                : s
            ));
          } else {
            output = `Error: ${result.output?.error || 'Unknown error'}`;
          }
        } catch (error) {
          console.error('Intent interpreter error:', error);
          output = `Error: ${error instanceof Error ? error.message : 'Failed to interpret intent'}`;
        }
      }
      
      updateStepStatus(sessionId, i, 'completed', output);
    }
  };

  const updateStepStatus = (sessionId: string, stepIndex: number, status: AgentStatus, output?: string) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) return session;
        const updatedSteps = [...session.steps];
        updatedSteps[stepIndex] = { 
          ...updatedSteps[stepIndex], 
          status, 
          output: output || undefined // Only set output if provided
        };
        return { ...session, steps: updatedSteps };
      })
    );
  };

  const updateSolutionSummary = (sessionId: string, summary: string) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, solutionSummary: summary } : session))
    );
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] bg-[#0D1117]">
        <div className="grid grid-cols-12 h-full">
          {/* Left Sidebar: Session History */}
          <aside className="col-span-2 bg-[#161B22] border-r border-[#30363D] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-normal text-white mb-6">Sessions</h2>
              {!showInput && (
                <button
                  className="mb-6 w-full bg-[#2F81F7] text-white py-2 rounded hover:bg-[#2F81F7]/90 transition-colors text-sm font-normal"
                  onClick={handleNewSession}
                >
                  + New Session
                </button>
              )}
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setShowInput(false);
                    }}
                    className={`p-3 rounded cursor-pointer ${
                      session.id === activeSessionId ? 'bg-[#21262D]' : 'hover:bg-[#21262D]/50'
                    }`}
                  >
                    <p className="text-sm font-normal text-white">Session {session.id.slice(-5)}</p>
                    <p className="text-xs text-[#8B949E] truncate">{session.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className={`${showInput ? 'col-span-10' : 'col-span-4'} bg-[#0D1117] overflow-y-auto`}>
            {showInput ? (
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#8B949E] mb-2">
                    Problem Description
                  </label>
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Describe your optimization problem... (e.g., Optimize delivery fleet for cost and time)"
                    className="w-full p-4 border border-[#30363D] rounded-md h-32 bg-[#161B22] text-white placeholder-[#8B949E]/50"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#8B949E] mb-2">
                    Problem Type
                  </label>
                  <select
                    value={problemType}
                    onChange={(e) => setProblemType(e.target.value)}
                    className="w-full p-3 border border-[#30363D] rounded-md bg-[#161B22] text-white"
                  >
                    <option value="custom">Custom Problem</option>
                    <option value="vehicle_routing">Vehicle Routing</option>
                    <option value="job_shop">Job Shop Scheduling</option>
                    <option value="bin_packing">Bin Packing</option>
                    <option value="resource_scheduling">Resource Scheduling</option>
                    <option value="fleet_scheduling">Fleet Scheduling</option>
                    <option value="project_scheduling">Project Scheduling</option>
                    <option value="nurse_scheduling">Nurse Scheduling</option>
                    <option value="production_planning">Production Planning</option>
                  </select>
                </div>

                <div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-[#2F81F7] hover:text-[#2F81F7]/90 transition-colors text-sm flex items-center gap-2"
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                    <svg className={`w-4 h-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {showAdvanced && (
                  <div className="space-y-6 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-[#8B949E] mb-2">
                        Data Format
                      </label>
                      <select
                        value={dataFormat}
                        onChange={(e) => setDataFormat(e.target.value)}
                        className="w-full p-3 border border-[#30363D] rounded-md bg-[#161B22] text-white"
                      >
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                        <option value="excel">Excel</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#8B949E] mb-2">
                        Sample Data (Optional)
                      </label>
                      <textarea
                        value={sampleData}
                        onChange={(e) => setSampleData(e.target.value)}
                        placeholder="Paste your sample data here..."
                        className="w-full p-4 border border-[#30363D] rounded-md h-48 bg-[#161B22] text-white placeholder-[#8B949E]/50 font-mono text-sm"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStartSession}
                  disabled={!userInput.trim()}
                  className="w-full mt-6 px-6 py-3 bg-[#2F81F7] text-white rounded hover:bg-[#2F81F7]/90 transition-colors disabled:opacity-50"
                >
                  Start Optimization
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-normal text-white">Agent Execution Timeline</h2>
                  <button
                    onClick={() => {
                      setShowInput(true);
                      setUserInput('');
                      setProblemType('custom');
                      setDataFormat('json');
                      setSampleData('');
                      setShowAdvanced(false);
                    }}
                    className="px-4 py-2 text-sm text-[#2F81F7] hover:bg-[#2F81F7]/10 rounded transition-colors"
                  >
                    + New Session
                  </button>
                </div>
                
                <div className="space-y-4">
                  {getCurrentSession()?.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`transition-all duration-700 ease-in-out overflow-hidden p-4 rounded-lg bg-[#161B22] ${
                        step.status === 'completed' 
                          ? 'border border-green-500/20' 
                          : step.status === 'running'
                          ? 'border border-[#2F81F7]/20'
                          : 'border border-[#30363D]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-normal text-white">{step.name}</h3>
                            <span className="text-xs text-[#8B949E] px-2 py-1 rounded bg-[#30363D]/50">
                              {step.agent}
                            </span>
                          </div>
                          <p className="text-sm text-[#8B949E] mt-1">{step.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {step.status === 'pending' && (
                            <span className="text-[#8B949E]">Pending</span>
                          )}
                          {step.status === 'running' && (
                            <>
                              <div className="w-4 h-4 border-2 border-[#2F81F7] border-t-transparent rounded-full animate-spin" />
                              <span className="text-[#2F81F7]">Running</span>
                            </>
                          )}
                          {step.status === 'completed' && (
                            <>
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-green-500">Completed</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {step.output && (
                        <div className="mt-4 p-4 rounded bg-[#0D1117] border border-[#30363D]">
                          <pre className="text-sm text-[#8B949E] whitespace-pre-wrap">
                            {typeof step.output === 'string' ? step.output : JSON.stringify(step.output, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Right Panel: Agent Logs */}
          {activeSessionId && !showInput && (
            <aside className="col-span-6 bg-[#161B22] border-l border-[#30363D] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-normal text-white mb-6">Agent Interaction Log</h2>
                
                <div className="space-y-4">
                  {/* Original Request */}
                  <div>
                    <h3 className="text-lg font-normal text-white mb-3">Original Request</h3>
                    <div className="bg-[#0D1117] rounded-lg p-4">
                      <p className="text-[#8B949E]">{getCurrentSession()?.description}</p>
                    </div>
                  </div>

                  {/* Agent Communication */}
                  <div>
                    <h3 className="text-lg font-normal text-white mb-3">Agent Communication</h3>
                    <div className="space-y-4">
                      {getCurrentSession()?.steps.map((step, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              step.status === 'completed' ? 'bg-green-500' :
                              step.status === 'running' ? 'bg-[#2F81F7]' :
                              step.status === 'error' ? 'bg-red-500' : 'bg-[#8B949E]'
                            }`} />
                            <span className="text-sm font-normal text-white">{step.name}</span>
                          </div>
                          {step.output && (
                            <div className="ml-4 pl-4 border-l border-[#30363D]">
                              <pre className="text-xs text-[#8B949E] whitespace-pre-wrap font-mono bg-[#0D1117] p-3 rounded">{step.output}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Raw Session Data */}
                  <div>
                    <h3 className="text-lg font-normal text-white mb-3">Raw Session Data</h3>
                    <div className="bg-[#0D1117] rounded-lg p-4">
                      <pre className="text-xs text-[#8B949E] whitespace-pre-wrap overflow-x-auto font-mono">
                        {JSON.stringify(getCurrentSession(), null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </Layout>
  );
} 