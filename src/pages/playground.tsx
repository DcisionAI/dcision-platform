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

interface IntentReasoning {
  mainReason: string;
  keyFactors: string[];
  businessBenefits: string[];
  potentialChallenges: string[];
}

interface ConfidenceFactors {
  problemClarity: number;
  dataAvailability: number;
  constraintComplexity: number;
  domainMatch: number;
}

interface Alternative {
  type: string;
  reasoning: string;
  confidence: number;
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
}

interface Factor {
  name: string;
  description: string;
}

interface Tradeoff {
  pros: string[];
  cons: string[];
}

interface StreamingOutput {
  plainEnglish: string;
  json: {
    warnings?: string[];
    [key: string]: any;
  };
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
  const [responseFormat, setResponseFormat] = useState<'plain' | 'json'>('plain');

  // Default Agent Steps Template
  const baseSteps: AgentStep[] = [
    { 
      name: 'IntentInterpreterAgent', 
      description: 'Analyzes business request and classifies the optimization problem type (e.g., vehicle routing, job shop scheduling)',
      status: 'pending', 
      agent: 'IntentInterpreterAgent'
    },
    { 
      name: 'DataMappingAgent', 
      description: 'Maps customer data fields to optimization schema, validates field requirements, and suggests transformations',
      status: 'pending', 
      agent: 'DataMappingAgent'
    },
    { 
      name: 'DataIntegrationAgent', 
      description: 'Connects to data sources, collects required data, and performs feature engineering for optimization model',
      status: 'pending', 
      agent: 'DataIntegrationAgent'
    },
    { 
      name: 'DataEnrichmentAgent', 
      description: 'Enhances dataset with external data sources (weather, traffic, market data) to improve optimization',
      status: 'pending', 
      agent: 'DataEnrichmentAgent'
    },
    { 
      name: 'ModelRunnerAgent', 
      description: 'Constructs and solves optimization model using appropriate solver (OR-Tools) based on problem type',
      status: 'pending', 
      agent: 'ModelRunnerAgent'
    },
    { 
      name: 'SolutionExplanationAgent', 
      description: 'Translates optimization results into business insights and actionable recommendations',
      status: 'pending', 
      agent: 'SolutionExplanationAgent'
    },
    { 
      name: 'HumanInTheLoopAgent', 
      description: 'Manages review workflow for solutions requiring human validation or adjustment',
      status: 'pending', 
      agent: 'HumanInTheLoopAgent'
    },
    { 
      name: 'ProcessAutomationAgent', 
      description: 'Deploys solution as API endpoint or scheduled optimization workflow with monitoring',
      status: 'pending', 
      agent: 'ProcessAutomationAgent'
    }
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
      'IntentInterpreterAgent': undefined,
      'ModelRunnerAgent': 'Optimization model solved successfully:\n- Total route distance: 213.5 miles\n- Average vehicle utilization: 85%\n- All time windows satisfied\n- Solution found in 2.3 seconds',
      'SolutionExplanationAgent': 'Your fleet optimization achieved:\n- 22% reduction in total distance\n- 15% improvement in delivery times\n- Balanced workload across all vehicles\n- All customer time windows respected\n\nRecommended routes have been generated for each vehicle.',
    };

    // Get the initial session data
    const session = initialSession || sessions.find(s => s.id === sessionId);
    if (!session) {
      console.error('Session not found:', sessionId);
      return;
    }

    for (let i = 0; i < baseSteps.length; i++) {
      updateStepStatus(sessionId, i, 'running');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      let output = mockOutputs[baseSteps[i].name];
      
      // Call intent interpreter API for the first step
      if (baseSteps[i].name === 'IntentInterpreterAgent') {
        try {          
          const response = await fetch('/api/mcp/intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: session.description })
          });
          
          if (!response.ok) throw new Error('Intent interpretation failed');
          
          const result = await response.json();
          if (result.output?.success) {
            const confidence = result.output.details.confidence as { overall: number; factors: ConfidenceFactors };
            const reasoning = result.output.details.reasoning as IntentReasoning;
            const alternatives = result.output.details.alternatives as Alternative[];
            
            // Generate an executive summary based on the main points
            const summary = `Executive Summary:\nBased on your business needs, I recommend a solution that will ${reasoning.businessBenefits[0].toLowerCase()}. ` +
                           `I'm highly confident this approach will work well for your specific case. ` +
                           `To ensure success, we should focus on ${reasoning.potentialChallenges[0].toLowerCase()}.`;

            const outputData = {
              plainEnglish: `${summary}\n\n` +
                           `Detailed Analysis:\n\n` +
                           `I've analyzed your business requirements and identified the best approach to solve your challenges. ` +
                           `Here's my comprehensive assessment:\n\n` +
                           `Key Business Drivers:\n` +
                           reasoning.keyFactors.map((f: string) => `• ${f}`).join('\n') + '\n\n' +
                           `Expected Business Outcomes:\n` +
                           reasoning.businessBenefits.map((b: string) => `• ${b}`).join('\n') + '\n\n' +
                           `Implementation Considerations:\n` +
                           reasoning.potentialChallenges.map((c: string) => `• ${c}`).join('\n') + '\n\n' +
                           `Assessment Confidence:\n` +
                           Object.entries(confidence.factors)
                             .map(([factor, score]) => {
                               const numScore = typeof score === 'number' ? score : parseFloat(String(score));
                               return `• ${factor.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${(numScore * 100).toFixed(1)}%`;
                             })
                             .join('\n') + '\n\n' +
                           `Alternative Solutions Considered:\n` +
                           alternatives.map((alt: Alternative) => 
                             `${alt.type}\n` +
                             `Context: ${alt.reasoning}\n\n` +
                             `Benefits:\n${alt.tradeoffs.pros.map((p: string) => `• ${p}`).join('\n')}\n\n` +
                             `Limitations:\n${alt.tradeoffs.cons.map((c: string) => `• ${c}`).join('\n')}`
                           ).join('\n\n'),
              json: {
                selectedModel: result.output.selectedModel,
                confidence: {
                  overall: confidence.overall,
                  factors: confidence.factors
                },
                reasoning: {
                  mainReason: reasoning.mainReason,
                  keyFactors: reasoning.keyFactors,
                  businessBenefits: reasoning.businessBenefits,
                  potentialChallenges: reasoning.potentialChallenges
                },
                alternatives: alternatives.map(alt => ({
                  type: alt.type,
                  confidence: alt.confidence,
                  reasoning: alt.reasoning,
                  tradeoffs: alt.tradeoffs
                }))
              }
            };
            
            output = JSON.stringify(outputData);
            
            // Update the session's problem type
            setSessions(prev => prev.map(s => 
              s.id === sessionId 
                ? { ...s, problemType: result.output.selectedModel as ProblemType }
                : s
            ));
            
            // Update the session object for subsequent steps
            session.problemType = result.output.selectedModel as ProblemType;
          } else {
            const errorData = {
              plainEnglish: `Sorry, I encountered an error while analyzing your request: ${result.output?.error || 'Unknown error'}`,
              json: {
                error: result.output?.error || 'Unknown error'
              }
            };
            output = JSON.stringify(errorData);
          }
        } catch (error) {
          console.error('Intent interpreter error:', error);
          const errorData = {
            plainEnglish: `Sorry, I ran into a problem while trying to understand your request: ${error instanceof Error ? error.message : 'Failed to interpret intent'}`,
            json: {
              error: error instanceof Error ? error.message : 'Failed to interpret intent'
            }
          };
          output = JSON.stringify(errorData);
        }
      }

      // Call data mapping API for the second step
      if (baseSteps[i].name === 'DataMappingAgent') {
        try {          
          const response = await fetch('/api/mcp/map', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: session.sessionId,
              problemType: session.problemType,
              userInput: session.description,
              sampleData: session.sampleData
            })
          });

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('Stream not available');
          }

          let streamingOutput: StreamingOutput = {
            plainEnglish: '',
            json: {}
          };
          
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (let line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  switch (data.type) {
                    case 'start':
                      streamingOutput.plainEnglish = `Starting Data Mapping Process\n` +
                                                   `I'll analyze your ${data.problemType} problem based on your description: "${data.userInput}"\n\n`;
                      streamingOutput.json = {
                        type: 'start',
                        problemType: data.problemType,
                        userInput: data.userInput
                      };
                      break;
                    
                    case 'progress':
                      streamingOutput.plainEnglish += `${data.message}\n`;
                      if (data.stage) {
                        streamingOutput.plainEnglish += `Currently working on: ${data.stage}\n`;
                      }
                      if (data.customerFields) {
                        streamingOutput.plainEnglish += `I found these fields in your data: ${data.customerFields.join(', ')}\n`;
                      }
                      if (data.requiredFields) {
                        streamingOutput.plainEnglish += `The optimization model needs these fields: ${data.requiredFields.join(', ')}\n`;
                      }
                      
                      streamingOutput.json = {
                        ...streamingOutput.json,
                        progress: {
                          message: data.message,
                          stage: data.stage,
                          customerFields: data.customerFields,
                          requiredFields: data.requiredFields
                        }
                      };
                      break;
                    
                    case 'warning':
                      streamingOutput.plainEnglish += `⚠️ Warning: ${data.message}\n`;
                      streamingOutput.json = {
                        ...streamingOutput.json,
                        warnings: [...(streamingOutput.json.warnings || []), data.message]
                      };
                      break;
                    
                    case 'complete':
                      if (data.output?.success) {
                        const { fieldRequirements, mappings, unmappedFields, suggestedActions } = data.output;
                        
                        // Generate an executive summary of the data analysis
                        const totalFields = (Object.values(fieldRequirements) as Record<string, any>[]).reduce(
                          (acc: number, category: Record<string, any>) => acc + Object.keys(category).length, 
                          0
                        );
                        const mappedFields = Object.keys(mappings).length;
                        const unmappedCount = unmappedFields?.length || 0;
                        
                        const summary = `Executive Summary:\nI've analyzed your business data and identified ${mappedFields} key data points we can use immediately. ` +
                                       `${unmappedCount > 0 ? `There are ${unmappedCount} additional data points we could leverage to enhance the solution. ` : ''}` +
                                       `${suggestedActions?.length ? `To maximize value, consider ${suggestedActions[0].toLowerCase()}.` : ''}`;

                        // Plain English format
                        streamingOutput.plainEnglish = `${summary}\n\n` +
                                                      `Detailed Analysis:\n\n` +
                                                      `Here's a breakdown of how we can use your business data:\n\n` +
                                                      `Required Information:\n`;
                        Object.entries(fieldRequirements).forEach(([category, fields]: [string, any]) => {
                          streamingOutput.plainEnglish += `\n${category}:\n`;
                          Object.entries(fields).forEach(([fieldName, details]: [string, any]) => {
                            streamingOutput.plainEnglish += `• ${fieldName}:\n`;
                            streamingOutput.plainEnglish += `  - Purpose: ${details.description}\n`;
                            streamingOutput.plainEnglish += `  - Format: ${details.data_type}\n`;
                            streamingOutput.plainEnglish += `  - Priority: ${details.importance}\n`;
                            if (details.validation?.length > 0) {
                              streamingOutput.plainEnglish += `  - Data Quality Needs: ${details.validation.join(', ')}\n`;
                            }
                          });
                        });
                        
                        streamingOutput.plainEnglish += '\nHow your data maps to what we need:\n';
                        Object.entries(mappings).forEach(([source, target]) => {
                          streamingOutput.plainEnglish += `• Your "${source}" field will be used as our "${target}"\n`;
                        });
                        
                        if (unmappedFields?.length > 0) {
                          streamingOutput.plainEnglish += `\nFields we couldn't map yet: ${unmappedFields.join(', ')}\n`;
                        }
                        
                        if (suggestedActions?.length > 0) {
                          streamingOutput.plainEnglish += `\nRecommended next steps:\n${suggestedActions.map((action: string) => `• ${action}`).join('\n')}\n`;
                        }

                        if (data.thoughtProcess) {
                          streamingOutput.plainEnglish += `\nMy thinking process:\n${data.thoughtProcess}\n`;
                        }
                        
                        // JSON format
                        streamingOutput.json = {
                          ...streamingOutput.json,
                          fieldRequirements,
                          mappings,
                          unmappedFields,
                          suggestedActions,
                          thoughtProcess: data.thoughtProcess
                        };
                        
                        output = JSON.stringify(streamingOutput);
                        updateStepStatus(sessionId, i, 'completed', output);
                      } else {
                        const errorMsg = `Error: ${data.output?.error || 'Unknown error'}`;
                        streamingOutput.plainEnglish += `\n${errorMsg}`;
                        streamingOutput.json = {
                          ...streamingOutput.json,
                          error: data.output?.error
                        };
                        output = JSON.stringify(streamingOutput);
                        updateStepStatus(sessionId, i, 'error', output);
                      }
                      break;
                    
                    case 'error':
                      const errorDetails = `Error: ${data.error}\nDetails: ${data.details || 'No details available'}`;
                      streamingOutput.plainEnglish += `\n${errorDetails}`;
                      streamingOutput.json = {
                        ...streamingOutput.json,
                        error: data.error,
                        errorDetails: data.details
                      };
                      output = JSON.stringify(streamingOutput);
                      updateStepStatus(sessionId, i, 'error', output);
                      break;
                  }
                  
                  // Update status for non-complete/error events
                  if (!['complete', 'error'].includes(data.type)) {
                    output = JSON.stringify(streamingOutput);
                    updateStepStatus(sessionId, i, 'running', output);
                  }
                } catch (e) {
                  console.warn('Failed to parse SSE data:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Data mapping error:', error);
          output = JSON.stringify({
            plainEnglish: `Error: ${error instanceof Error ? error.message : 'Failed to map data'}`,
            json: { error: error instanceof Error ? error.message : 'Failed to map data' }
          });
          updateStepStatus(sessionId, i, 'error', output);
        }
      }
      
      // Call data integration API for the third step
      if (baseSteps[i].name === 'DataIntegrationAgent') {
        try {          
          const response = await fetch('/api/mcp/integrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: session.sessionId,
              problemType: session.problemType,
              userInput: session.description
            })
          });
          
          if (!response.ok) throw new Error('Data integration failed');
          
          const result = await response.json();
          if (result.output?.success) {
            const { featureSet, fieldMappings, collectedData, featureEngineeringReport } = result.output;
            
            output = `Data Integration Results:\n\n` +
                    `Feature Set:\n${JSON.stringify(featureSet, null, 2)}\n\n` +
                    `Field Mappings:\n${JSON.stringify(fieldMappings, null, 2)}\n\n` +
                    `Feature Engineering Report:\n${featureEngineeringReport}`;
          } else {
            output = `Error: ${result.output?.error || 'Unknown error'}`;
          }
        } catch (error) {
          console.error('Data integration error:', error);
          output = `Error: ${error instanceof Error ? error.message : 'Failed to integrate data'}`;
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

  // Helper function to format the response in plain English
  const formatPlainEnglish = (result: any) => {
    const confidence = result.output.details.confidence;
    const reasoning = result.output.details.reasoning;
    const alternatives = result.output.details.alternatives;
    
    return `Based on your request, I recommend using the ${result.output.selectedModel} approach.

I'm ${(confidence.overall * 100).toFixed(1)}% confident in this recommendation because:
${reasoning.mainReason}

Here's my detailed analysis:

Key Factors:
${reasoning.keyFactors.map((factor: string) => `• ${factor}`).join('\n')}

Business Benefits:
${reasoning.businessBenefits.map((benefit: string) => `• ${benefit}`).join('\n')}

Potential Challenges to Consider:
${reasoning.potentialChallenges.map((challenge: string) => `• ${challenge}`).join('\n')}

My confidence is based on:
${Object.entries(confidence.factors)
  .map(([factor, score]) => {
    const numScore = typeof score === 'number' ? score : parseFloat(String(score));
    return `• ${factor.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${(numScore * 100).toFixed(1)}%`;
  })
  .join('\n')}

Alternative Approaches:
${alternatives.map((alt: Alternative) => `
${alt.type} (${(alt.confidence * 100).toFixed(1)}% confidence)
${alt.reasoning}

Pros:
${alt.tradeoffs.pros.map((pro: string) => `• ${pro}`).join('\n')}

Cons:
${alt.tradeoffs.cons.map((con: string) => `• ${con}`).join('\n')}`).join('\n')}

Expert Critique:
${result.output.details.critique.reasoning}`;
  };

  // Helper function to format the response as JSON
  const formatJson = (result: any) => {
    return JSON.stringify(result.output.details, null, 2);
  };

  // Add these helper functions before the return statement
  const formatPlainOutput = (output: string) => {
    try {
      const data = JSON.parse(output);
      // If the output has our new format with plainEnglish field
      if (data.plainEnglish) {
        return data.plainEnglish;
      }
      // Fallback to old format
      return output;
    } catch (e) {
      return output;
    }
  };

  const formatJsonOutput = (output: string) => {
    try {
      const data = JSON.parse(output);
      // If the output has our new format with json field
      if (data.json) {
        return JSON.stringify(data.json, null, 2);
      }
      // Fallback to raw output
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return output;
    }
  };

  // Update the agent step display component
  const AgentStepCard = ({ step, idx }: { step: AgentStep; idx: number }) => (
    <div
      key={idx}
      className={`transition-all duration-700 ease-in-out overflow-hidden p-6 rounded-lg bg-[#161B22] ${
        step.status === 'completed' 
          ? 'border-2 border-green-500/20' 
          : step.status === 'running'
          ? 'border-2 border-[#2F81F7]/20'
          : 'border border-[#30363D]'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-normal text-white">{step.name}</h3>
            <span className="text-xs text-[#8B949E] px-2 py-1 rounded-full bg-[#30363D]/50">
              {step.agent}
            </span>
          </div>
          <p className="text-sm text-[#8B949E]">{step.description}</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Format toggle buttons */}
          {step.output && (
            <div className="flex items-center gap-2 mr-4">
              <button
                onClick={() => setResponseFormat('plain')}
                className={`px-2 py-1 text-xs rounded ${
                  responseFormat === 'plain' 
                    ? 'bg-[#2F81F7] text-white' 
                    : 'text-[#8B949E] hover:bg-[#30363D]'
                }`}
              >
                Plain English
              </button>
              <button
                onClick={() => setResponseFormat('json')}
                className={`px-2 py-1 text-xs rounded ${
                  responseFormat === 'json' 
                    ? 'bg-[#2F81F7] text-white' 
                    : 'text-[#8B949E] hover:bg-[#30363D]'
                }`}
              >
                JSON
              </button>
            </div>
          )}
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
      </div>
      
      {step.output && (
        <div className="mt-4 p-4 rounded bg-[#0D1117] border border-[#30363D]">
          <pre className="text-sm text-[#8B949E] whitespace-pre-wrap font-mono">
            {responseFormat === 'plain' 
              ? formatPlainOutput(step.output)
              : formatJsonOutput(step.output)
            }
          </pre>
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] bg-[#0D1117]">
              <div className="p-1 space-y-6">
                <div>
                <h1 className="text-3xl font-bold mb-4 text-docs-text">Playground</h1>
                  <button
                    onClick={() => {
                      setShowInput(true);
                      setUserInput('');
                      setDataFormat('json');
                      setSampleData('');
                      setShowAdvanced(false);
                    }}
                    className="px-4 py-2 text-sm text-[#2F81F7] hover:bg-[#2F81F7]/10 rounded transition-colors"
                  >
                    + New Session
                  </button>
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Describe what you are trying to decide... (e.g., Optimize delivery fleet for cost and time)"
                    className="w-full p-4 border border-[#30363D] rounded-md h-32 bg-[#161B22] text-white placeholder-[#8B949E]/50"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleStartSession}
                  disabled={!userInput.trim()}
                  className="w-full mt-6 px-6 py-3 bg-[#2F81F7] text-white rounded hover:bg-[#2F81F7]/90 transition-colors disabled:opacity-50"
                >
                  Start Optimization
                </button>
              </div>
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
          {/*
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
            */}
          {/* Right Panel: Agent Logs */}
          {activeSessionId && !showInput && (
            <aside className="col-span-10 bg-[#161B22] border-l border-[#30363D] overflow-y-auto">
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
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                step.status === 'completed' ? 'bg-green-500' :
                                step.status === 'running' ? 'bg-[#2F81F7]' :
                                step.status === 'error' ? 'bg-red-500' : 'bg-[#8B949E]'
                              }`} />
                              <span className="text-sm font-normal text-white">{step.name}</span>
                            </div>
                            {step.output && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setResponseFormat('plain')}
                                  className={`px-2 py-1 text-xs rounded ${
                                    responseFormat === 'plain' 
                                      ? 'bg-[#2F81F7] text-white' 
                                      : 'text-[#8B949E] hover:bg-[#30363D]'
                                  }`}
                                >
                                  Plain English
                                </button>
                                <button
                                  onClick={() => setResponseFormat('json')}
                                  className={`px-2 py-1 text-xs rounded ${
                                    responseFormat === 'json' 
                                      ? 'bg-[#2F81F7] text-white' 
                                      : 'text-[#8B949E] hover:bg-[#30363D]'
                                  }`}
                                >
                                  JSON
                                </button>
                              </div>
                            )}
                          </div>
                          {step.output && (
                            <div className="ml-4 pl-4 border-l border-[#30363D]">
                              <pre className="text-xs text-[#8B949E] whitespace-pre-wrap font-mono bg-[#0D1117] p-3 rounded">
                                {responseFormat === 'plain' 
                                  ? formatPlainOutput(step.output)
                                  : formatJsonOutput(step.output)
                                }
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 
                  <div>
                    <h3 className="text-lg font-normal text-white mb-3">Raw Session Data</h3>
                    <div className="bg-[#0D1117] rounded-lg p-4">
                      <pre className="text-xs text-[#8B949E] whitespace-pre-wrap overflow-x-auto font-mono">
                        {JSON.stringify(getCurrentSession(), null, 2)}
                      </pre>
                    </div>
                  </div> */}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </Layout>
  );
} 