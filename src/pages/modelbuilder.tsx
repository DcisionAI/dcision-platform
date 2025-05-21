"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@/components/Layout';
import Stepper from '@/components/mcp/Stepper';
import StepCards from '@/components/mcp/StepCards';
import Step1Intent from '@/components/mcp/steps/Step1Intent';
import Step2DataPrep from '@/components/mcp/steps/Step2DataPrep';
import Step3ModelConstraints from '@/components/mcp/steps/Step3ModelConstraints';
import Step4PreviewMCP from '@/components/mcp/steps/Step4PreviewMCP';
import Step5SolveExplain from '@/components/mcp/steps/Step5SolveExplain';
import Step6Deploy from '@/components/mcp/steps/Step6Deploy';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { authFetch } from '@/lib/authFetch';
import { useAuthContext } from '@/components/auth/AuthProvider';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';

const stepLabels = [
  'Intent',
  'Data Prep',
  'Model & Constraints',
  'Preview MCP',
  'Solve & Explain',
  'Deploy'
];

// Three cards for each step: What, Why, How
const stepCardsData: { title: string; description: string }[][] = [
  [
    { title: 'What', description: 'Empower your business with DcisionAI: translate your goals into actionable, AI-driven decisions. DcisionAI understands your objectives and turns them into intelligent, automated workflows.' },
    { title: 'How', description: 'Enter a natural language description; DcisionAI leverages LLMs and the MCP framework to parse and return a structured intent, confidence, alternatives, and use cases.' }
  ],
  [
    { title: 'What', description: 'DcisionAI ensures your business data is ready for intelligent decision-making. Seamlessly connect, map, and enrich your data to unlock deeper insights and better outcomes.' },
    { title: 'How', description: 'Use mapping to generate or connect data, and enrichment to augment with external sources. DcisionAI suggests mappings and enrichments using LLMs and MCP.' }
  ],
  [
    { title: 'What', description: 'DcisionAI automatically builds a decision model tailored to your business—defining the right variables, constraints, and objectives for optimal results.' },
    { title: 'How', description: 'Review and refine the auto-generated model structure, variables, and constraints. RAG (retrieval-augmented generation) may provide relevant examples.' }
  ],
  [
    { title: 'What', description: 'Gain full transparency: review the entire DcisionAI configuration before execution, ensuring alignment with your business needs and compliance requirements.' },
    { title: 'How', description: 'Inspect, copy, or edit the MCP config. Submit to the Dcision agent for execution.' }
  ],
  [
    { title: 'What', description: 'DcisionAI delivers actionable results and clear explanations, empowering you to make confident, data-driven decisions at scale.' },
    { title: 'How', description: 'Click Solve to run the agent. View solution details, explanations, and explore feature importance, decision paths, and more.' }
  ],
  [
    { title: 'What', description: 'Deploy your DcisionAI-powered solution as a secure, scalable API—integrate decision intelligence directly into your business workflows.' },
    { title: 'How', description: 'Deploy, get the endpoint URL, and manage or test your deployed agent.' }
  ]
];

export default function ModelBuilderPage() {
  const { user, loading, accessToken } = useAuthContext();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [mcpConfigState, setMcpConfigState] = useState<any>({});
  const [intentText, setIntentText] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [promptId, setPromptId] = useState<string | null>(null);
  const [forceLoginModal, setForceLoginModal] = useState(false);
  const [solverResponse, setSolverResponse] = useState<any>(null);
  const [ragExamples, setRagExamples] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      setForceLoginModal(true);
    } else {
      setForceLoginModal(false);
    }
  }, [user, loading]);

  // Create a session on mount
  useEffect(() => {
    if (!user || !accessToken) return; // Only run if user is authenticated and token is present
    const createSession = async () => {
      const res = await authFetch('/api/modelbuilder/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ description: 'Modelbuilder session', problem_type: '', status: 'active' })
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.id);
      }
    };
    createSession();
  }, [user, accessToken]);

  // Memoize mcpConfig so its reference only changes when its contents change
  const mcpConfig = useMemo(() => mcpConfigState, [JSON.stringify(mcpConfigState)]);

  // Advance to the next step and log step
  const handleNext = async () => {
    if (sessionId && accessToken) {
      await authFetch('/api/modelbuilder/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ session_id: sessionId, step_type: stepLabels[currentStep], step_data: mcpConfig })
      });
    }
    if (currentStep < stepLabels.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Log prompt on intent interpretation
  const handleInterpret = async (result: any) => {
    setMcpConfigState((prev: any) => {
      const next = { ...prev, ...result.output, thoughtProcess: result.thoughtProcess };
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
    });
    if (sessionId && intentText && accessToken) {
      const res = await authFetch('/api/modelbuilder/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ session_id: sessionId, prompt_text: intentText })
      });
      if (res.ok) {
        const data = await res.json();
        setPromptId(data.id);
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step1Intent
            value={intentText}
            onChange={setIntentText}
            onInterpret={handleInterpret}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <Step2DataPrep
            config={mcpConfig}
            onUpdate={(update: any) =>
              setMcpConfigState((prev: any) => {
                const next = { ...prev, ...update };
                return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
              })
            }
          />
        );
      case 2:
        return (
          <Step3ModelConstraints
            enrichedData={mcpConfig.enrichedData}
            intentInterpretation={mcpConfig.intentInterpretation}
            onModelDef={(modelDef: any) => {
              // If modelDef contains RAG retrieval results, store them in state
              if (Array.isArray(modelDef.ragExamples)) {
                setRagExamples(modelDef.ragExamples);
              } else if (Array.isArray(modelDef.retrievedExamples)) {
                setRagExamples(modelDef.retrievedExamples);
              }
              setMcpConfigState((prev: any) => {
                // Always ensure modelDef gets a dataset
                const dataset = modelDef.dataset
                  || prev.enrichedData
                  || prev.dataset
                  || prev.sampleData
                  || {};
                return {
                  ...prev,
                  modelDef: { ...modelDef, dataset },
                  protocolSteps: [
                    {
                      id: 'solve_step',
                      action: 'solve_model',
                      description: 'Solve the optimization model',
                      required: true
                    }
                  ],
                  dataset
                };
              });
            }}
            dataset={mcpConfig.dataset}
            ragExamples={ragExamples}
          />
        );
      case 3:
        return (
          <Step4PreviewMCP
            sessionId={mcpConfig.sessionId || 'session-' + Date.now()}
            intent={mcpConfig}
            enrichedData={mcpConfig.enrichedData}
            modelDef={mcpConfig.modelDef}
            environment={mcpConfig.environment || { region: 'us-east-1', timezone: 'UTC' }}
            dataset={mcpConfig.dataset || { internalSources: [] }}
            protocolSteps={mcpConfig.protocolSteps || []}
            industry={mcpConfig.industry || 'logistics'}
            version={mcpConfig.version || '1.0.0'}
            status={mcpConfig.status || 'pending'}
            onSubmitSuccess={(solverResp: any) => {
              setSolverResponse(solverResp);
              setCurrentStep(4); // Move to Step 5
            }}
          />
        );
      case 4:
        return <Step5SolveExplain solverResponse={solverResponse} />;
      case 5:
        return <Step6Deploy />;
      default:
        return null;
    }
  };

  // Disable Next button on step 0 until LLM returns a positive confidence
  const confidence = Number(mcpConfig.confidenceLevel ?? 0);
  const isNextDisabled =
    (currentStep === 0 && confidence <= 0) ||
    (currentStep === 1 && !(
      mcpConfig.isEnrichComplete ||
      (mcpConfig.dataset && Object.keys(mcpConfig.dataset).length > 0)
    )) ||
    (currentStep === stepLabels.length - 1);

  if (loading) return <div>Loading...</div>;
  return (
    <Layout forceLoginModal={forceLoginModal}>
      {user ? (
        <div className="p-6">
          <h1 className="text-xl font-bold text-docs-text mb-4">Dcision Builder</h1>
          <Stepper
            steps={stepLabels}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />
          <StepCards cards={stepCardsData[currentStep] || []} />
          <div className="mb-6 w-full">
            {renderStep()}
          </div>
          <div className="flex justify-between">
            <Button
              onClick={handlePrev}
              disabled={currentStep === 0}
              variant="secondary"
              size="sm"
            >
              Prev
            </Button>
            <Button
              onClick={handleNext}
              disabled={isNextDisabled}
              variant="primary"
              size="sm"
            >
              {currentStep === stepLabels.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 text-docs-muted">
          Please sign in to access the Model Builder.
        </div>
      )}
    </Layout>
  );
}