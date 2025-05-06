 'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
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
  const [userInput, setUserInput] = useState<string>('');
  const [mcpConfig, setMcpConfig] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Triggered after initial input or wizard completes, start pipeline session
  const handleComplete = (config: any) => {
    setMcpConfig(config);
    startSession(config);
  };

  // Initialize and run a pipeline session
  const startSession = (config: any) => {
    // Determine raw text for description and sampleData (supporting freeform text via config.text)
    const rawText = (config && typeof config === 'object' && config.text)
      ? config.text
      : JSON.stringify(config, null, 2);
    // Identify problem type from config or default
    const identifiedType = config?.context?.intent?.output?.problemType || 'custom';
    const newSession: Session = {
      id: uuidv4(),
      sessionId: uuidv4(),
      version: uuidv4(),
      description: rawText,
      problemType: identifiedType,
      dataFormat: 'json',
      sampleData: rawText,
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
        // Call intent interpretation agent and display thought process + formatted business output
        const resp = await fetch('/api/mcp/intent', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput: sess.description })
        });
        const rawText = await resp.text();
        let result: any;
        try {
          result = JSON.parse(rawText);
        } catch (e1) {
          // Fallback: strip markdown fences
          const cleaned = rawText.split('\n').filter(l => !l.trim().startsWith('```')).join('\n');
          try {
            result = JSON.parse(cleaned);
          } catch (e2) {
            // Unable to parse JSON; show raw response
            output = `Raw response:\n${rawText}`;
            updateStepStatus(i, 'completed', output);
            continue;
          }
        }
        let combined = '';
        // Chain of thought
        if (result.thoughtProcess) {
          combined += `Thought Process:\n${result.thoughtProcess}\n\n`;
        }
        // Structured business output
        const out = result.output || {};
        combined += `Result:\n`;
        if (out.problemType) combined += `- Problem Type: ${out.problemType}\n`;
        if (out.reasoning) combined += `- Reasoning: ${out.reasoning}\n`;
        if (Array.isArray(out.useCases) && out.useCases.length) {
          combined += `- Use Cases:\n`;
          out.useCases.forEach((uc: string) => { combined += `   • ${uc}\n`; });
        }
        if (Array.isArray(out.businessImplications) && out.businessImplications.length) {
          combined += `- Business Implications:\n`;
          out.businessImplications.forEach((bi: string) => { combined += `   • ${bi}\n`; });
        }
        output = combined;
      }
        // Data Mapping
        else if (step.name === 'DataMappingAgent') {
        // Call data mapping agent and display thought process + mapping
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
        let combined = '';
        if (result.thoughtProcess) {
          combined += `Thought Process:\n${result.thoughtProcess}\n\n`;
        }
        combined += `Mapping Result:\n${JSON.stringify(result.output, null, 2)}`;
        output = combined;
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

  // Handle the user pressing Start after entering their decision description
  const handleStart = () => {
    if (userInput.trim() === '') return;
    // Wrap user input as config.text for downstream processing
    handleComplete({ text: userInput });
  };

  return (
    <Layout>
      <div className="p-6">
        {!mcpConfig ? (
          <div className="max-w-xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">Describe the decision you want to automate</h1>
            <textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              rows={6}
              className="w-full p-3 border rounded mb-4 bg-gray-800 text-white"
              placeholder="E.g., Optimize delivery routes for my fleet to minimize total driving time"
            />
            <button
              onClick={handleStart}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
            >
              Start
            </button>
          </div>
        ) : !session ? (
          <div className="text-gray-400">Initializing agent pipeline...</div>
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