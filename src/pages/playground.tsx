'use client';

import { useState, useEffect, useRef } from 'react';
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
  mathematicalFormulation: string;
  complexity: string;
  modelBenefits: string;
  industryAdoption: string;
  decisionProcess: string;
  technicalAnalysis: {
    mathematicalFormulation: string;
    complexity: string;
    keyFactors: string[];
  };
}

interface IntentConfidence {
  overall: number;
  factors: {
    [key: string]: number;
  };
}

interface Alternative {
  type: string;
  confidence: number;
  reasoning: string;
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
}

interface IntentCritique {
  reasoning: string;
}

interface IntentDetails {
  confidence: IntentConfidence;
  reasoning: IntentReasoning;
  alternatives: Alternative[];
  critique: IntentCritique;
}

interface IntentOutput {
  selectedModel: string;
  details: IntentDetails;
}

interface IntentResponse {
  output: IntentOutput;
}

interface ConfidenceFactors {
  problemClarity: number;
  dataAvailability: number;
  constraintComplexity: number;
  domainMatch: number;
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
    warnings?: Array<{
      message: string;
      details?: string;
    }>;
    [key: string]: any;
  };
}

interface Reasoning {
  mainReason: string;
  keyFactors: string[];
  mathematicalFormulation: string;
  complexity: string;
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
  const [expandedAgents, setExpandedAgents] = useState<Set<number>>(new Set([0]));
  const agentOutputRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Add effect to ensure intent agent is expanded initially
  useEffect(() => {
    if (activeSessionId) {
      setExpandedAgents(new Set([0]));
    }
  }, [activeSessionId]);

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
    // Ensure IntentInterpreterAgent is expanded
    setExpandedAgents(new Set([0]));
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
          
          // Check if the response has the expected structure
          if (result.output?.success && result.output.details) {
            const confidence = result.output.details.confidence as { overall: number; factors: ConfidenceFactors };
            const reasoning = result.output.details.reasoning as IntentReasoning;
            const alternatives = result.output.details.alternatives as Alternative[];
            
            // Generate an executive summary based on the main points
            const summary = `DcisionAI Analysis:\n\n` +
                           `1. Recommendation:\n` +
                           `Based on your inputs, DcisionAI recommends using the ${result.output.selectedModel} approach.\n\n` +
                           `2. Model Benefits:\n` +
                           `${reasoning.modelBenefits}\n\n` +
                           `3. Industry Adoption:\n` +
                           `${reasoning.industryAdoption}\n\n` +
                           `4. Decision Process:\n` +
                           `${reasoning.decisionProcess}\n\n` +
                           `5. Technical Analysis:\n` +
                           `• Mathematical Approach: ${reasoning.technicalAnalysis.mathematicalFormulation}\n` +
                           `• Complexity: ${reasoning.technicalAnalysis.complexity}\n` +
                           `• Key Factors:\n` +
                           reasoning.technicalAnalysis.keyFactors.map((f: string) => `  - ${f}`).join('\n') + '\n\n' +
                           `6. Confidence Assessment:\n` +
                           `• Overall Confidence: ${(confidence.overall * 100).toFixed(1)}%\n` +
                           `• Factor Breakdown:\n` +
                           Object.entries(confidence.factors).map(([factor, value]) => 
                             `  - ${factor}: ${(value * 100).toFixed(1)}%`
                           ).join('\n');

            const outputData = {
              plainEnglish: summary,
              json: {
                selectedModel: result.output.selectedModel,
                confidence: {
                  overall: confidence.overall,
                  factors: confidence.factors
                },
                reasoning: {
                  mainReason: reasoning.mainReason,
                  keyFactors: reasoning.keyFactors,
                  mathematicalFormulation: reasoning.mathematicalFormulation,
                  complexity: reasoning.complexity
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
            // Handle case where response structure is different
            console.error('Unexpected response structure:', result);
            const errorData = {
              plainEnglish: `Sorry, I encountered an error while analyzing your request. The response format was unexpected.`,
              json: {
                error: 'Unexpected response format',
                details: result
              }
            };
            output = JSON.stringify(errorData);
          }
        } catch (error) {
          console.error('Intent interpreter error:', error);
          const errorData = {
            plainEnglish: `Sorry, I ran into a problem while trying to understand your request: ${error instanceof Error ? error.message : 'Failed to interpret intent'}`,
            json: {
              error: error instanceof Error ? error.message : 'Failed to interpret intent',
              details: error
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
              sampleData: session.sampleData || '{}'  // Ensure we always send some data
            })
          });

          if (!response.ok) {
            throw new Error(`Data mapping failed with status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('Stream not available');
          }

          let streamingOutput: StreamingOutput = {
            plainEnglish: '',
            json: {
              progress: [],
              warnings: [],
              mappings: {},
              fieldRequirements: {},
              unmappedFields: []
            }
          };
          
          const decoder = new TextDecoder();
          let accumulatedData = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            accumulatedData += chunk;
            
            // Process complete lines
            const lines = accumulatedData.split('\n');
            accumulatedData = lines.pop() || ''; // Keep the incomplete line for next iteration

            for (let line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  switch (data.type) {
                    case 'start':
                      streamingOutput.plainEnglish = `🔍 Starting Data Mapping Analysis\n\n` +
                                                   `Problem Type: ${data.problemType}\n` +
                                                   `Request: "${data.userInput}"\n\n` +
                                                   `I'll analyze your data structure and map it to our optimization model requirements.\n\n`;
                      streamingOutput.json = {
                        ...streamingOutput.json,
                        type: 'start',
                        problemType: data.problemType,
                        userInput: data.userInput
                      };
                      break;
                    
                    case 'progress':
                      const progressMsg = `${data.message}\n`;
                      if (data.stage) {
                        // Convert technical stages to user-friendly messages
                        const stageMessages: { [key: string]: string } = {
                          'field_requirements': 'Analyzing required data fields...',
                          'field_requirements_complete': 'Field requirements analysis complete',
                          'field_mapping': 'Mapping your data fields...',
                          'field_mapping_complete': 'Field mapping complete'
                        };
                        const friendlyStage = stageMessages[data.stage] || data.stage;
                        streamingOutput.plainEnglish += `�� ${friendlyStage}\n`;
                      }
                      if (data.customerFields) {
                        streamingOutput.plainEnglish += `\nDetected Fields:\n${data.customerFields.map((f: string) => `• ${f}`).join('\n')}\n`;
                      }
                      if (data.requiredFields) {
                        streamingOutput.plainEnglish += `\nRequired Fields:\n${data.requiredFields.map((f: string) => `• ${f}`).join('\n')}\n`;
                      }
                      
                      // Only include technical details in JSON output
                      streamingOutput.json = {
                        ...streamingOutput.json,
                        progress: [...(streamingOutput.json.progress || []), {
                          message: data.message,
                          stage: data.stage,
                          customerFields: data.customerFields,
                          requiredFields: data.requiredFields,
                          details: data.details
                        }]
                      };

                      // If we have field requirements, format them in a user-friendly way
                      if (data.details?.fieldRequirements) {
                        const { required_fields, nice_to_have_fields } = data.details.fieldRequirements;
                        
                        if (required_fields) {
                          streamingOutput.plainEnglish += '\nRequired Fields:\n';
                          Object.entries(required_fields).forEach(([field, details]: [string, any]) => {
                            streamingOutput.plainEnglish += `• ${field}\n  - ${details.description}\n`;
                          });
                        }
                        
                        if (nice_to_have_fields) {
                          streamingOutput.plainEnglish += '\nOptional Fields:\n';
                          Object.entries(nice_to_have_fields).forEach(([field, details]: [string, any]) => {
                            streamingOutput.plainEnglish += `• ${field}\n  - ${details.description}\n`;
                            if (details.benefits?.length > 0) {
                              streamingOutput.plainEnglish += `  - Benefits: ${details.benefits.join(', ')}\n`;
                            }
                          });
                        }
                      }

                      // If we have mapping results, format them in a user-friendly way
                      if (data.details?.mappingResult) {
                        const { mappings, unmapped_required_fields, suggested_actions } = data.details.mappingResult;
                        
                        if (mappings?.length > 0) {
                          streamingOutput.plainEnglish += '\nSuccessfully Mapped Fields:\n';
                          mappings.forEach((mapping: any) => {
                            streamingOutput.plainEnglish += `• ${mapping.customerField} ✓\n`;
                          });
                        }

                        if (unmapped_required_fields?.length > 0) {
                          streamingOutput.plainEnglish += '\nMissing Required Fields:\n';
                          unmapped_required_fields.forEach((field: string) => {
                            streamingOutput.plainEnglish += `• ${field}\n`;
                          });
                        }

                        if (suggested_actions?.length > 0) {
                          streamingOutput.plainEnglish += '\nSuggested Actions:\n';
                          suggested_actions.forEach((action: string) => {
                            streamingOutput.plainEnglish += `• ${action}\n`;
                          });
                        }
                      }
                      break;
                    
                    case 'warning':
                      streamingOutput.plainEnglish += `\n⚠️ Warning: ${data.message}\n`;
                      if (data.details) {
                        streamingOutput.plainEnglish += `Details: ${data.details}\n`;
                      }
                      streamingOutput.json = {
                        ...streamingOutput.json,
                        warnings: [...(streamingOutput.json.warnings || []), {
                          message: data.message,
                          details: data.details
                        }]
                      };
                      break;
                    
                    case 'complete':
                      if (data.output?.success) {
                        const { fieldRequirements, mappings, unmappedFields, suggestedActions } = data.output;
                        
                        // Generate detailed summary
                        const mappedFieldsCount = Object.keys(mappings || {}).length;
                        const unmappedCount = unmappedFields?.length || 0;
                        const totalRequiredFields = Object.values(fieldRequirements || {})
                          .reduce((acc: number, category: any) => acc + Object.keys(category).length, 0);

                        streamingOutput.plainEnglish += `\n✅ Data Mapping Complete\n\n` +
                          `Summary:\n` +
                          `• ${mappedFieldsCount} fields successfully mapped\n` +
                          `• ${unmappedCount} fields need attention\n` +
                          `• ${totalRequiredFields} total required fields identified\n\n` +
                          
                          `Detailed Field Requirements:\n`;

                        Object.entries(fieldRequirements || {}).forEach(([category, fields]: [string, any]) => {
                          streamingOutput.plainEnglish += `\n${category}:\n`;
                          Object.entries(fields).forEach(([fieldName, details]: [string, any]) => {
                            streamingOutput.plainEnglish += 
                              `• ${fieldName}:\n` +
                              `  - Purpose: ${details.description}\n` +
                              `  - Type: ${details.data_type}\n` +
                              `  - Required: ${details.importance === 'required' ? 'Yes' : 'No'}\n` +
                              (details.validation?.length > 0 
                                ? `  - Validation: ${details.validation.join(', ')}\n` 
                                : '');
                          });
                        });

                        if (Object.keys(mappings || {}).length > 0) {
                          streamingOutput.plainEnglish += `\nField Mappings:\n`;
                          Object.entries(mappings || {}).forEach(([source, target]) => {
                            streamingOutput.plainEnglish += `• "${source}" → "${target}"\n`;
                          });
                        }

                        if (unmappedFields?.length > 0) {
                          streamingOutput.plainEnglish += `\nUnmapped Fields (Require Attention):\n` +
                            unmappedFields.map((field: string) => `• ${field}`).join('\n') + '\n';
                        }

                        if (suggestedActions?.length > 0) {
                          streamingOutput.plainEnglish += `\nRecommended Actions:\n` +
                            suggestedActions.map((action: string) => `• ${action}`).join('\n') + '\n';
                        }

                        streamingOutput.json = {
                          ...streamingOutput.json,
                          fieldRequirements,
                          mappings,
                          unmappedFields,
                          suggestedActions,
                          summary: {
                            mappedFields: mappedFieldsCount,
                            unmappedFields: unmappedCount,
                            totalRequired: totalRequiredFields
                          }
                        };
                      } else {
                        const errorMsg = `❌ Error: ${data.output?.error || 'Unknown error'}`;
                        streamingOutput.plainEnglish += `\n${errorMsg}\n`;
                        streamingOutput.json = {
                          ...streamingOutput.json,
                          error: data.output?.error
                        };
                      }
                      break;
                    
                    case 'error':
                      const errorDetails = `❌ Error: ${data.error}\n${data.details ? `Details: ${data.details}` : ''}`;
                      streamingOutput.plainEnglish += `\n${errorDetails}\n`;
                      streamingOutput.json = {
                        ...streamingOutput.json,
                        error: data.error,
                        errorDetails: data.details
                      };
                      break;
                  }
                  
                  // Update status for all events
                  output = JSON.stringify(streamingOutput);
                  updateStepStatus(sessionId, i, 'running', output);
                } catch (e) {
                  console.warn('Failed to parse SSE data:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Data mapping error:', error);
          const errorOutput = {
            plainEnglish: `❌ Data Mapping Error: ${error instanceof Error ? error.message : 'Failed to map data'}\n\nPlease check your input data and try again.`,
            json: { 
              error: error instanceof Error ? error.message : 'Failed to map data',
              status: 'error'
            }
          };
          output = JSON.stringify(errorOutput);
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
            console.log('fieldMappings', JSON.stringify(fieldMappings, null, 2));
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
          output: output || undefined
        };
        return { ...session, steps: updatedSteps };
      })
    );

    // Auto-collapse previous steps when a new one starts running
    if (status === 'running') {
      setExpandedAgents(new Set([0, stepIndex])); // Keep intent agent and running agent expanded
    }
    // When an agent completes, keep it expanded briefly then collapse
    // Don't auto-collapse IntentInterpreterAgent
    if (status === 'completed' && stepIndex !== 0) {
      setTimeout(() => {
        setExpandedAgents(prev => {
          const newSet = new Set(prev);
          newSet.delete(stepIndex);
          newSet.add(0); // Ensure IntentInterpreterAgent stays expanded
          return newSet;
        });
      }, 3000);
    }
  };

  const updateSolutionSummary = (sessionId: string, summary: string) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, solutionSummary: summary } : session))
    );
  };

  // Helper function to format the response in plain English
  const formatPlainEnglish = (result: IntentResponse) => {
    const { selectedModel, details } = result.output;
    const { confidence, reasoning, alternatives, critique } = details;
    
    // Helper function to get confidence color
    const getConfidenceColor = (score: number) => {
      if (score >= 0.9) return 'text-green-500';
      if (score >= 0.7) return 'text-yellow-500';
      return 'text-red-500';
    };

    // Helper function to get confidence bar
    const getConfidenceBar = (score: number) => {
      const width = Math.round(score * 100);
      const color = score >= 0.9 ? 'bg-green-500' : score >= 0.7 ? 'bg-yellow-500' : 'bg-red-500';
      return (
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
        </div>
      );
    };

    return `
      Recommendation: ${selectedModel}
      
      Model Benefits:
      ${reasoning.modelBenefits}
      
      Industry Adoption:
      ${reasoning.industryAdoption}
      
      Decision Process:
      ${reasoning.decisionProcess}
      
      Technical Analysis:
      - Mathematical Formulation: ${reasoning.technicalAnalysis.mathematicalFormulation}
      - Complexity: ${reasoning.technicalAnalysis.complexity}
      - Key Factors:
        ${reasoning.technicalAnalysis.keyFactors.map((factor: string) => `      • ${factor}`).join('\n')}
      
      Confidence Assessment:
      - Overall Confidence: ${(confidence.overall * 100).toFixed(1)}%
        ${getConfidenceBar(confidence.overall)}
      - Factor Breakdown:
        ${Object.entries(confidence.factors).map(([factor, value]) => `
          • ${factor}: ${(value * 100).toFixed(1)}%
            ${getConfidenceBar(value)}
        `).join('\n')}
      
      Alternative Approaches:
      ${alternatives.map((alt: Alternative) => `
        ${alt.type} (${(alt.confidence * 100).toFixed(1)}% confidence)
        ${alt.reasoning}
        Pros:
        ${alt.tradeoffs.pros.map((pro: string) => `        • ${pro}`).join('\n')}
        Cons:
        ${alt.tradeoffs.cons.map((con: string) => `        • ${con}`).join('\n')}
      `).join('\n')}
      
      Expert Critique:
      ${critique.reasoning}
    `;
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

  // Modify toggleAgentExpanded to properly handle IntentInterpreterAgent
  const toggleAgentExpanded = (idx: number) => {
    setExpandedAgents(prev => {
      const newSet = new Set(prev);
      if (idx === 0) {
        // For IntentInterpreterAgent, we'll allow toggling but ensure it's expanded when needed
        if (newSet.has(idx)) {
          newSet.delete(idx);
        } else {
          newSet.add(idx);
        }
      } else {
        // For other agents, keep existing toggle behavior
        if (newSet.has(idx)) {
          newSet.delete(idx);
        } else {
          newSet.add(idx);
        }
      }
      return newSet;
    });
  };

  // Update the agent step display component
  const AgentStepCard = ({ step, idx }: { step: AgentStep; idx: number }) => {
    // Ensure IntentInterpreterAgent is expanded when running or has output
    useEffect(() => {
      if (idx === 0 && (step.status === 'running' || step.output)) {
        setExpandedAgents(prev => {
          const newSet = new Set(prev);
          newSet.add(0);
          return newSet;
        });
      }
    }, [idx, step.status, step.output]);

    return (
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
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] bg-[#0D1117]">
        {showInput && (
          <div className="max-w-6xl mx-auto p-8 space-y-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-medium text-white">DcisionAI Playground</h1>
              <p className="text-[#8B949E] text-sm">Define your business optimization challenge and let our AI assist you in finding the best solution.</p>
              
              {/* How it works section */}
              <div className="grid grid-cols-3 gap-4 my-8">
                <div className="bg-[#161B22] p-6 rounded-lg border border-[#30363D] space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#2F81F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    <h3 className="text-white text-sm font-medium">Specialized AI Agents</h3>
                  </div>
                  <p className="text-[#8B949E] text-sm">
                  DcisionAI uses a team of specialized agents — each responsible for a critical step in the decision workflow. From intent interpretation to model selection and solution explanation, our agents collaborate to automate complex optimization tasks with precision and transparency.
                  </p>
                </div>

                <div className="bg-[#161B22] p-6 rounded-lg border border-[#30363D] space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#2F81F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <h3 className="text-white text-sm font-medium">Plug-in Architecture</h3>
                  </div>
                  <p className="text-[#8B949E] text-sm">
                  Our plug-in architecture connects directly to your live databases. In this playground, we use Supabase to demonstrate how agents scan actual schema and map data in real time — enabling grounded optimization with no manual setup. Designed for secure, extensible enterprise integration.
                  </p>
                </div>

                <div className="bg-[#161B22] p-6 rounded-lg border border-[#30363D] space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#2F81F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    <h3 className="text-white text-sm font-medium">Model Context Protocol</h3>
                  </div>
                  <p className="text-[#8B949E] text-sm">
                  Model Context Protocol (MCP) is our orchestration layer for decision-making. It ensures agents operate with shared context — structuring goals, constraints, and data into optimization-ready inputs. With built-in explainability and human-in-the-loop validation, MCP makes decisions both auditable and trustworthy.
                  </p>
                 
                </div>
              </div>

              {/* Process visualization */}
              <div className="bg-[#161B22] p-6 rounded-lg border border-[#30363D] mb-6">
                <div className="flex items-center justify-between text-sm text-[#8B949E]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#2F81F7]"></div>
                    <span>Intent Analysis</span>
                  </div>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#2F81F7]"></div>
                    <span>Data Mapping</span>
                  </div>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#2F81F7]"></div>
                    <span>DcisionAI Model Selection</span>
                  </div>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#2F81F7]"></div>
                    <span>Explainable Decisions</span>
                  </div>
                </div>
              </div>

              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Describe what you are trying to decide... (e.g., Optimize delivery fleet for cost and time)"
                className="w-full p-4 border border-[#30363D] rounded-lg h-24 bg-[#161B22] text-white placeholder-[#8B949E]/50 text-sm focus:border-[#2F81F7] focus:ring-1 focus:ring-[#2F81F7] transition-colors"
                autoFocus
              />
            </div>
            <button
              onClick={handleStartSession}
              disabled={!userInput.trim()}
              className="w-full px-6 py-2.5 bg-[#2F81F7] text-white text-sm font-medium rounded-lg hover:bg-[#2F81F7]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              See DecisionAI in Action
            </button>
          </div>
        )}
        {(!showInput || sessions.length > 0) && (
          <div className="grid grid-cols-12 h-full">
            {/* Left Sidebar: Session History */}
            <aside className="col-span-3 bg-[#161B22] border-r border-[#30363D] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-normal text-white mb-6">Sessions</h2>
                
                {/* New Session Button - Always at top */}
                <button
                  className="mb-6 w-full bg-[#2F81F7] text-white py-3 rounded-md hover:bg-[#2F81F7]/90 transition-colors text-base font-normal flex items-center justify-center"
                  onClick={handleNewSession}
                >
                  + New Session
                </button>

                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        setActiveSessionId(session.id);
                        setShowInput(false);
                      }}
                      className={`p-4 rounded-lg bg-[#21262D] cursor-pointer`}
                    >
                      {/* Session Header */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-base font-normal text-white">Session {session.id.slice(-5)}</p>
                          <span className="text-sm text-[#2F81F7]">
                            {session.status === 'running' ? 'Running' : ''}
                          </span>
                        </div>
                        <p className="text-sm text-[#8B949E]">{session.description}</p>
                      </div>

                      {/* Agent Status List */}
                      <div className="space-y-3">
                        {session.steps.map((step, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={e => {
                              e.stopPropagation();
                              // Expand the clicked agent's output and scroll to it
                              setExpandedAgents(prev => new Set([...Array.from(prev), idx]));
                              agentOutputRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              step.status === 'completed' ? 'bg-green-500' :
                              step.status === 'running' ? 'bg-[#2F81F7]' :
                              step.status === 'error' ? 'bg-red-500' : 'bg-[#8B949E]'
                            }`} />
                            <span className="text-sm text-white font-normal">{step.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Right Panel: Agent Communication */}
            {activeSessionId && !showInput && (
              <aside className="col-span-9 bg-[#161B22] overflow-y-auto">
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
                          <div
                            key={idx}
                            ref={el => { agentOutputRefs.current[idx] = el; }}
                            className="space-y-2"
                          >
                            <div 
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => toggleAgentExpanded(idx)}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  step.status === 'completed' ? 'bg-green-500' :
                                  step.status === 'running' ? 'bg-[#2F81F7]' :
                                  step.status === 'error' ? 'bg-red-500' : 'bg-[#8B949E]'
                                }`} />
                                <span className="text-sm font-normal text-white">{step.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {step.output && (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setResponseFormat('plain');
                                        }}
                                        className={`px-2 py-1 text-xs rounded ${
                                          responseFormat === 'plain' 
                                            ? 'bg-[#2F81F7] text-white' 
                                            : 'text-[#8B949E] hover:bg-[#30363D]'
                                        }`}
                                      >
                                        Plain English
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setResponseFormat('json');
                                        }}
                                        className={`px-2 py-1 text-xs rounded ${
                                          responseFormat === 'json' 
                                            ? 'bg-[#2F81F7] text-white' 
                                            : 'text-[#8B949E] hover:bg-[#30363D]'
                                        }`}
                                      >
                                        JSON
                                      </button>
                                    </div>
                                    <svg 
                                      className={`w-5 h-5 text-[#8B949E] transform transition-transform ${expandedAgents.has(idx) ? 'rotate-180' : ''}`} 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </>
                                )}
                              </div>
                            </div>
                            {(step.output && (expandedAgents.has(idx) || step.status === 'running')) && (
                              <div className="ml-4 pl-4 border-l border-[#30363D] transition-all duration-300">
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
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
} 