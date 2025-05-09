import React, { useState } from 'react';
import { ArrowUpIcon } from '@heroicons/react/24/outline';

export interface Step1IntentProps {
  value: string;
  onChange: (val: string) => void;
  /**
   * Called with LLM agent result (includes output and thoughtProcess)
   */
  onInterpret: (result: any) => void;
  /**
   * Advance to next step after interpretation
   */
  onNext: () => void;
}

/**
 * Step 1: Intent input
 */
const Step1Intent: React.FC<Step1IntentProps> = ({ value, onChange, onInterpret, onNext }) => {
  const [interpreting, setInterpreting] = useState(false);
  // Store structured LLM output for display
  const [llmData, setLlmData] = useState<{ intentInterpretation: string; confidenceLevel: number; alternatives: string[]; explanation: string; useCases: string[] } | null>(null);

  const handleInterpret = async () => {
    if (!value.trim()) return;
    // Fallback for unsupported domains
    const supportRegex = /fleet|route|delivery|workforce|staff|schedule/i;
    if (!supportRegex.test(value)) {
      const fallback = {
        intentInterpretation: 'DcisionAI currently supports Fleet Ops and Workforce Management - please stay tuned as we grow our portfolio of agents to support more domains',
        confidenceLevel: 0,
        alternatives: [],
        explanation: '',
        useCases: []
      };
      setLlmData(fallback);
      onInterpret({ output: fallback, thoughtProcess: '' });
      return;
    }
    setInterpreting(true);
    try {
      const resp = await fetch('/api/mcp/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: value })
      });
      const data = await resp.json();
      onInterpret(data);
      setLlmData(data.output);
    } catch (error) {
      console.error('Interpretation error:', error);
    } finally {
      setInterpreting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 1: Intent</h2>
      <h3 className="text-lg font-medium mb-2">
        What would you like DcisionAI agents to do?
      </h3>
    <div className="relative mb-4">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        className="w-full bg-docs-section border border-docs-section-border rounded-lg p-4 text-base text-docs-text placeholder-docs-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
        placeholder="E.g., Optimize delivery routes for my fleet to minimize total driving time"
      />
        <button
          type="button"
          onClick={handleInterpret}
          disabled={!value.trim() || interpreting}
          className="absolute bottom-3 right-3 text-blue-600 hover:text-blue-500 focus:outline-none disabled:opacity-50"
        aria-label="Interpret Intent"
        >
          {interpreting ? '⏳' : <ArrowUpIcon className="w-6 h-6" />}
        </button>
      </div>
      {llmData && (
        <div className="w-full bg-docs-section border border-docs-section-border p-4 rounded-lg shadow mb-4">
          <h3 className="text-lg font-medium mb-4 text-docs-text">LLM Interpretation</h3>
          <div className="space-y-4">
            <div>
              <strong className="text-docs-text">Interpretation:</strong>
              <p className="text-docs-muted text-sm mt-1">{llmData.intentInterpretation}</p>
            </div>
            <div>
              <strong className="text-docs-text">Confidence Level:</strong>
              <p className="text-docs-muted text-sm mt-1">{llmData.confidenceLevel}%</p>
            </div>
            <div>
              <strong className="text-docs-text">Alternatives Considered:</strong>
              <ul className="list-disc list-inside text-docs-muted text-sm mt-1">
                {llmData.alternatives.map((alt, idx) => (
                  <li key={idx}>{alt}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong className="text-docs-text">Explanation:</strong>
              <p className="text-docs-muted text-sm mt-1">{llmData.explanation}</p>
            </div>
            <div>
              <strong className="text-docs-text">Industry Use Cases:</strong>
              <ul className="list-disc list-inside text-docs-muted text-sm mt-1">
                {llmData.useCases.map((u, idx) => (
                  <li key={idx}>{u}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1Intent;