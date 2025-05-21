import React, { useState, useEffect } from 'react';
import { ArrowUpIcon } from '@heroicons/react/24/outline';
import { authFetch } from '@/lib/authFetch';
import Button from '@/components/ui/Button';

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

  const loadingMessages = [
    'interpreting your business intent...',
    'assessing confidence in understanding your request...',
    'considering alternative interpretations...',
    'explaining the reasoning behind the interpretation...',
    'identifying real-world industry use cases...'
  ];
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  useEffect(() => {
    if (interpreting) {
      setLoadingMsgIdx(0);
      const interval = setInterval(() => {
        setLoadingMsgIdx(idx => (idx + 1) % loadingMessages.length);
      }, 2000); // 2 seconds for realism
      return () => clearInterval(interval);
    }
  }, [interpreting]);

  const handleInterpret = async () => {
    if (!value.trim()) return;
    setInterpreting(true);
    try {
      const resp = await authFetch('/api/mcp/intent', {
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
      <h2 className="text-xl font-bold text-docs-heading mb-2">Step 1: Intent</h2>
      <h3 className="text-base font-semibold text-docs-heading mb-1">
        What would you like DcisionAI agents to do?
      </h3>
    <div className="relative mb-4">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        className="w-full bg-docs-section border border-docs-section-border rounded-lg p-4 text-sm text-docs-text placeholder-docs-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
        placeholder="E.g., Optimize delivery routes for my fleet to minimize total driving time"
      />
        <Button
          type="button"
          onClick={handleInterpret}
          disabled={!value.trim() || interpreting}
          variant="primary"
          size="sm"
          className="absolute bottom-3 right-3"
        >
          {interpreting ? '⏳' : <ArrowUpIcon className="w-4 h-4" />}
        </Button>
      </div>
      {interpreting && (
        <div className="flex items-center gap-2 text-docs-muted animate-pulse mb-4">
          <svg className="animate-spin h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span>DcisionAI is {loadingMessages[loadingMsgIdx]}</span>
        </div>
      )}
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
              {Array.isArray(llmData.alternatives) && llmData.alternatives.length > 0 ? (
                <ul className="list-disc list-inside text-docs-muted text-sm mt-1">
                  {llmData.alternatives.map((alt, idx) => (
                    <li key={idx}>{alt}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-docs-muted text-sm mt-1">None</p>
              )}
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