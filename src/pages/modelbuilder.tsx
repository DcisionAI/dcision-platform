 'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import AgentConversation, { AgentStep, AgentStatus } from '@/components/AgentConversation';
import { v4 as uuidv4 } from 'uuid';
import { ArrowUpIcon, CubeIcon, GlobeAltIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

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

// Introductory cards explaining DecisionAI + Model Context Protocol
const introCards = [
  {
    icon: CubeIcon,
    title: 'Model',
    description: 'DecisionAI structures your problem as a formal optimization model using the Model Context Protocol, translating business requirements into variables, constraints, and objectives.',
  },
  {
    icon: GlobeAltIcon,
    title: 'Context',
    description: 'It dynamically integrates your business context—data sources, operational parameters, and external signals—enabling tailored AI-driven decision making.',
  },
  {
    icon: ArrowPathIcon,
    title: 'Protocol',
    description: 'The Model Context Protocol orchestrates specialized agents in a repeatable, transparent, and auditable workflow to deliver actionable insights.',
  },
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
          <>
            <div className="max-w-7xl mx-auto mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-docs-text">How DecisionAI Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {introCards.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div key={idx} className="bg-[#1C2128] rounded-lg p-6 flex flex-col">
                      <Icon className="w-6 h-6 text-[#58A6FF] mb-2" />
                      <h3 className="text-white font-medium mb-2">{card.title}</h3>
                      <p className="text-[#8B949E] text-sm">{card.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            
              <h1 className="text-xl md:text-xl font-semibold mb-4 text-docs-text">
                <center>What would you like DcisionAI agents to do?</center>
              </h1>
              <div className="relative mb-4">
                <textarea
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  rows={4}
                  className="w-full bg-[rgb(28_33_40_/var(--tw-bg-opacity,_1))] border border-[#343541] rounded-xl p-4 text-base text-docs-text placeholder-docs-muted focus:outline-none focus:ring-2 focus:ring-docs-accent transition-all resize-none"
                  placeholder="E.g., Optimize delivery routes for my fleet to minimize total driving time"
                />
                <button
                  onClick={handleStart}
                  className="absolute bottom-3 right-3 text-docs-accent hover:text-docs-accent/80 focus:outline-none"
                  aria-label="Send"
                >
                  <ArrowUpIcon className="w-6 h-6" />
                </button>
              </div>
            
          </>
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