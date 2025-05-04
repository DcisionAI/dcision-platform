 'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import IntentDataMCPWizard from '@/components/playground/IntentDataMCPWizard';
import AgentConversation, { AgentStep, AgentStatus } from '@/components/AgentConversation';
import { v4 as uuidv4 } from 'uuid';

// Session type for pipeline
interface Session {
  id: string;
  sessionId: string;
  version: string;
  description: string;
  problemType: string;
  dataFormat: string;
  sampleData: string;
  steps: AgentStep[];
  startTime: string;
  lastModified: string;
  status: AgentStatus;
}

// Default agent steps template
const baseSteps: AgentStep[] = [
  { name: 'IntentInterpreterAgent', description: 'Analyze user intent and recommend model approach', status: 'pending' },
  { name: 'DataMappingAgent', description: 'Map your data fields to the optimization schema', status: 'pending' },
  { name: 'DataIntegrationAgent', description: 'Fetch and integrate external data sources', status: 'pending' },
  { name: 'DataEnrichmentAgent', description: 'Enhance data with external signals (weather, traffic)', status: 'pending' },
  { name: 'ModelRunnerAgent', description: 'Build and solve the optimization model', status: 'pending' },
  { name: 'SolutionExplanationAgent', description: 'Translate results into business insights', status: 'pending' },
  { name: 'HumanInTheLoopAgent', description: 'Manage human review and validation', status: 'pending' },
  { name: 'ProcessAutomationAgent', description: 'Deploy the solution as an API or workflow', status: 'pending' },
];

 export default function ModelBuilderPage() {
  const [mcpConfig, setMcpConfig] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Triggered after wizard completes, start pipeline session
  const handleComplete = (config: any) => {
    setMcpConfig(config);
    startSession(config);
  };

  // Initialize and run a pipeline session
  const startSession = (config: any) => {
    // Use the identified problemType from the wizard config, fallback to 'custom'
    const identifiedType = config?.context?.intent?.output?.problemType || 'custom';
    const newSession: Session = {
      id: uuidv4(),
      sessionId: uuidv4(),
      version: uuidv4(),
      description: JSON.stringify(config, null, 2),
      problemType: identifiedType,
      dataFormat: 'json',
      sampleData: JSON.stringify(config, null, 2),
      steps: JSON.parse(JSON.stringify(baseSteps)),
      startTime: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      status: 'running',
    };
    setSession(newSession);
    runSession(newSession);
  };

  // Run through agents sequentially
  const runSession = async (sess: Session) => {
    for (let i = 0; i < baseSteps.length; i++) {
      const step = sess.steps[i];
      updateStepStatus(i, 'running');
      try {
        let output: string | undefined;
        // Intent Interpreter
        if (step.name === 'IntentInterpreterAgent') {
          const resp = await fetch('/api/mcp/intent', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: sess.description })
          });
          const result = await resp.json();
          output = JSON.stringify(result, null, 2);
        }
        // Data Mapping
        else if (step.name === 'DataMappingAgent') {
          const resp = await fetch('/api/mcp/map', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sess.sessionId,
              problemType: sess.problemType,
              userInput: sess.description,
              sampleData: sess.sampleData
            })
          });
          const result = await resp.json();
          output = JSON.stringify(result, null, 2);
        }
        // Use mocks for other agents
        else {
          const mockOutputs: Record<string, string> = {
            ModelRunnerAgent: 'Model solved successfully: result placeholder',
            SolutionExplanationAgent: 'Solution explanation placeholder',
          };
          output = mockOutputs[step.name];
        }
        updateStepStatus(i, 'completed', output);
      } catch (err: any) {
        updateStepStatus(i, 'error', err?.message || 'Error');
      }
    }
  };

  // Update a single step status and output
  const updateStepStatus = (index: number, status: AgentStatus, output?: string) => {
    setSession(prev => {
      if (!prev) return prev;
      const steps = [...prev.steps];
      steps[index] = { ...steps[index], status, output };
      return { ...prev, steps, lastModified: new Date().toISOString() };
    });
  };

  return (
     <Layout>
       <div className="p-6">
        {!mcpConfig ? (
          <div>
            <h1 className="text-3xl font-bold mb-4">MCP Builder</h1>
            <IntentDataMCPWizard onComplete={handleComplete} />
          </div>
        ) : !session ? (
          <div className="text-gray-600">Initializing agent pipeline...</div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold mb-4">Agent Interaction & Results</h1>
            <AgentConversation steps={session.steps} />
          </div>
        )}
       </div>
     </Layout>
   );
 }