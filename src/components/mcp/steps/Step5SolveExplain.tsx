import React, { useState } from 'react';
import Step5Explainability from './Step5Explainability';

const Step5SolveExplain: React.FC = () => {
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
      <h2 className="text-xl font-semibold mb-4">Step 5: Solve & Explain</h2>
      <button
        onClick={handleSolve}
        disabled={solving}
        className="px-4 py-2 bg-blue-600 text-white rounded mb-4 disabled:opacity-50"
      >
        {solving ? 'Solving...' : 'Solve'}
      </button>
      {status && <p className="text-gray-700 mb-2">{status}</p>}
      {/* Integrated Explainability Panel */}
      {status === 'Completed' && (
        <Step5Explainability />
      )}
    </div>
  );
};

export default Step5SolveExplain;