import { useState } from 'react';
import Modal from './Modal';

interface IntentPromptModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (result: any, userInput: string) => void;
  initialInput?: string;
}

export default function IntentPromptModal({
  open,
  onClose,
  onSubmit,
  initialInput = ''
}: IntentPromptModalProps) {
  const [input, setInput] = useState(initialInput);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!input.trim()) {
      setError('Please enter a description of your problem.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mcp/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: input })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to interpret intent');
      } else {
      onSubmit(data, input);
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Describe Your Optimization Problem" widthClass="max-w-lg">
      <div className="space-y-4">
        <p className="text-docs-text">
          Please describe the problem you want to solve (e.g., "route deliveries for 10 drivers in New York").
        </p>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-docs-border px-3 py-2 text-docs-text bg-docs-bg focus:outline-none focus:ring-2 focus:ring-docs-accent"
          placeholder="Enter your problem description here..."
        />
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-docs-accent text-white rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Interpreting...' : 'Interpret'}
          </button>
        </div>
      </div>
    </Modal>
  );
}