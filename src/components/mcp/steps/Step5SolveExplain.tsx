import React, { useState } from 'react';
import Step5Explainability from './Step5Explainability';
import Button from '@/components/ui/Button';

export interface Step5SolveExplainProps {
  solverResponse?: any;
}

const Step5SolveExplain: React.FC<Step5SolveExplainProps> = ({ solverResponse }) => {
  const [solving, setSolving] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const handleSolve = async () => {
    setSolving(true);
    setStatus('Solving...');
    // TODO: call solve endpoint and stream statuses
    setTimeout(() => {
      setStatus('Completed');
      setExplanation('Solution explanation goes here.');
      setSolving(false);
    }, 2000);
  };
  return (
    <div>
      <h2 className="text-xl font-bold text-docs-heading mb-2">Step 5: Solve & Explain</h2>
      {solverResponse ? (
        <div className="mb-2">
          <h4 className="text-base font-semibold text-docs-heading mb-1">Solver Response</h4>
          <pre className="bg-docs-section p-2 rounded text-xs overflow-x-auto">{JSON.stringify(solverResponse, null, 2)}</pre>
        </div>
      ) : (
        <Button
          onClick={handleSolve}
          disabled={solving}
          variant="primary"
          size="sm"
          className="mb-4"
        >
          {solving ? 'Solving...' : 'Solve'}
        </Button>
      )}
      {status && <p className="text-gray-700 mb-2">{status}</p>}
      {/* Integrated Explainability Panel */}
      {(status === 'Completed' || solverResponse) && (
        <Step5Explainability />
      )}
    </div>
  );
};

export default Step5SolveExplain;