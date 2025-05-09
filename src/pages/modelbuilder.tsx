"use client";

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Stepper from '@/components/mcp/Stepper';
import StepCards from '@/components/mcp/StepCards';
import Step1Intent from '@/components/mcp/steps/Step1Intent';
import Step2DataPrep from '@/components/mcp/steps/Step2DataPrep';
import Step3ModelConstraints from '@/components/mcp/steps/Step3ModelConstraints';
import Step4PreviewMCP from '@/components/mcp/steps/Step4PreviewMCP';
import Step5SolveExplain from '@/components/mcp/steps/Step5SolveExplain';
import Step6Deploy from '@/components/mcp/steps/Step6Deploy';

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
    { title: 'What', description: 'Provide a natural language intent for LLM-powered agents to interpret.' },
    { title: 'Why', description: 'LLM agents translate your business needs into structured optimization problems.' },
    { title: 'How', description: 'Describe your problem in plain English; the LLM will parse and extract variables, constraints, and objectives.' }
  ],
  [
    { title: 'What', description: 'Feed data to agents and let LLM auto-map and enrich your datasets.' },
    { title: 'Why', description: 'High-quality inputs ensure accurate optimization by the LLM agents.' },
    { title: 'How', description: 'Use the mapping, enrichment, and validation tabs to refine and validate your data.' }
  ],
  [
    { title: 'What', description: 'Let agents generate or adjust variables and constraints via LLM suggestions.' },
    { title: 'Why', description: 'LLM-driven modeling accelerates defining the math behind your decisions.' },
    { title: 'How', description: 'Expand each section to review or refine LLM-generated model components.' }
  ],
  [
    { title: 'What', description: 'Review the LLM-generated MCP JSON before execution.' },
    { title: 'Why', description: 'Ensure the LLM’s interpretation aligns with your business context.' },
    { title: 'How', description: 'Copy, download, or edit the config directly in the preview.' }
  ],
  [
    { title: 'What', description: 'Invoke LLM-based agents to solve and explain your optimization.' },
    { title: 'Why', description: 'Agents leverage LLMs to orchestrate complex solve flows with real-time insights.' },
    { title: 'How', description: 'Click Solve and watch the agent’s step-by-step explanation stream in.' }
  ],
  [
    { title: 'What', description: 'Deploy your decision agent endpoint powered by LLM and optimization.' },
    { title: 'Why', description: 'Integrate the agent into your apps for on-demand decision intelligence.' },
    { title: 'How', description: 'Generate and share the API URL to execute your MCP in production.' }
  ]
];

export default function ModelBuilderPage() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [mcpConfig, setMcpConfig] = useState<any>({});
  const [intentText, setIntentText] = useState<string>('');

  // Advance to the next step
  const handleNext = () => {
    if (currentStep < stepLabels.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step1Intent
            value={intentText}
            onChange={setIntentText}
            // Interpret intent via LLM and update MCP config
            onInterpret={result => setMcpConfig((prev: any) => ({
              ...prev,
              ...result.output,
              thoughtProcess: result.thoughtProcess
            }))}
            onNext={handleNext}
          />
        );
      case 1:
        return <Step2DataPrep config={mcpConfig} />;
      case 2:
        return <Step3ModelConstraints />;
      case 3:
        return <Step4PreviewMCP config={mcpConfig} />;
      case 4:
        return <Step5SolveExplain />;
      case 5:
        return <Step6Deploy />;
      default:
        return null;
    }
  };

  // Disable Next button on step 0 until LLM returns a positive confidence
  const confidence = Number(mcpConfig.confidenceLevel ?? 0);
  const isNextDisabled = currentStep === 0
    ? confidence <= 0
    : currentStep === stepLabels.length - 1;
  return (
    <Layout>
      <div className="p-6">
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
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={handleNext}
            disabled={isNextDisabled}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {currentStep === stepLabels.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </Layout>
  );
}