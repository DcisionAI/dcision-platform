import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';
import ConstructionWorkflowTabs from './ConstructionWorkflowTabs';
import { TypewriterEffect } from './ui/typewriter-effect';
import Link from 'next/link';
import { useRouter } from 'next/router';

const workflows = [
  {
    id: 'scheduling',
    title: 'Project Scheduling',
    description: 'Minimize project duration while respecting dependencies and resource limits.',
    icon: (
      <svg className="w-8 h-8 text-docs-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="7" width="18" height="13" rx="2" strokeWidth={2} />
        <path d="M16 3v4M8 3v4M3 11h18" strokeWidth={2} />
      </svg>
    ),
  },
  {
    id: 'resource',
    title: 'Resource Allocation',
    description: 'Assign crews and equipment to tasks to minimize idle time and costs.',
    icon: (
      <svg className="w-8 h-8 text-docs-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={2} />
        <path d="M8 12h8M12 8v8" strokeWidth={2} />
      </svg>
    ),
  },
  {
    id: 'crew',
    title: 'Crew Assignment',
    description: 'Optimize crew shifts and assignments for productivity and compliance.',
    icon: (
      <svg className="w-8 h-8 text-docs-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" strokeWidth={2} />
        <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" strokeWidth={2} />
      </svg>
    ),
  },
  {
    id: 'material',
    title: 'Material Delivery Optimization',
    description: 'Optimize delivery schedules and routes for materials to the site.',
    icon: (
      <svg className="w-8 h-8 text-docs-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="13" width="18" height="8" rx="2" strokeWidth={2} />
        <path d="M16 13V7a4 4 0 00-8 0v6" strokeWidth={2} />
      </svg>
    ),
  },
  {
    id: 'site_layout',
    title: 'Site Layout Planning',
    description: 'Optimize placement of facilities and equipment for safety and efficiency.',
    icon: (
      <svg className="w-8 h-8 text-docs-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} />
        <circle cx="12" cy="12" r="3" strokeWidth={2} />
      </svg>
    ),
  },
  {
    id: 'procurement',
    title: 'Procurement & Supply Chain',
    description: 'Optimize order quantities, supplier selection, and delivery schedules.',
    icon: (
      <svg className="w-8 h-8 text-docs-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="7" width="18" height="13" rx="2" strokeWidth={2} />
        <path d="M8 3v4M16 3v4" strokeWidth={2} />
      </svg>
    ),
  },
  {
    id: 'budget',
    title: 'Cost Optimization & Budget Allocation',
    description: 'Allocate budget to maximize value and minimize risk.',
    icon: (
      <svg className="w-8 h-8 text-docs-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 8v8M8 12h8" strokeWidth={2} />
        <circle cx="12" cy="12" r="10" strokeWidth={2} />
      </svg>
    ),
  },
  {
    id: 'tradeoff',
    title: 'Multi-Objective Trade-off Analysis',
    description: 'Balance cost, time, quality, and safety for optimal solutions.',
    icon: (
      <svg className="w-8 h-8 text-docs-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M4 20h16M4 4h16M4 12h16" strokeWidth={2} />
      </svg>
    ),
  },
  {
    id: 'equipment',
    title: 'Equipment Fleet Management',
    description: 'Optimize equipment use and movement to minimize costs.',
    icon: (
      <svg className="w-8 h-8 text-docs-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="13" width="18" height="8" rx="2" strokeWidth={2} />
        <circle cx="7" cy="17" r="2" strokeWidth={2} />
        <circle cx="17" cy="17" r="2" strokeWidth={2} />
      </svg>
    ),
  },
];

async function getWorkflowSuggestions(query: string): Promise<{ ids: string[]; explanation: string }> {
  // Compose a prompt for the LLM
  const prompt = `Given the following user query: "${query}", and these workflows: [${workflows
    .map((w) => `${w.id}: ${w.title}`)
    .join(', ')}], return a JSON object with two fields: 'workflows' (an array of the most relevant workflow IDs, e.g., [\"scheduling\", \"crew\"]) and 'explanation' (a short explanation for your choice).`;
  const res = await fetch('/api/agno/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prompt }),
  });
  if (!res.ok) throw new Error('Failed to get LLM suggestion');
  const data = await res.json();
  // Try to extract a JSON object with workflows and explanation
  try {
    const match = data.message.match(/\{[\s\S]*\}/);
    if (match) {
      const obj = JSON.parse(match[0]);
      if (
        obj &&
        Array.isArray(obj.workflows) &&
        obj.workflows.every((id: any) => typeof id === 'string') &&
        typeof obj.explanation === 'string'
      ) {
        return { ids: obj.workflows, explanation: obj.explanation };
      }
    }
  } catch (e) {}
  // Fallback: if LLM response is not parseable, show all
  return { ids: workflows.map((w) => w.id), explanation: '' };
}

const ConstructionDecisionWorkflows: React.FC = () => {
  const { theme } = useTheme();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filteredIds, setFilteredIds] = useState<string[] | null>(null);
  const [llmExplanation, setLlmExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Reset state on mount (or when route changes to /construction)
  useEffect(() => {
    setQuery('');
    setFilteredIds(null);
    setLlmExplanation(null);
    setError(null);
    setSelectedWorkflow(null);
  }, [router.pathname]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLlmExplanation(null);
    try {
      const { ids, explanation } = await getWorkflowSuggestions(query);
      setFilteredIds(ids);
      setLlmExplanation(explanation);
    } catch (err) {
      setError('Could not get suggestions. Please try again.');
      setFilteredIds(null);
      setLlmExplanation(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setFilteredIds(null);
    setLlmExplanation(null);
    setError(null);
  };

  const visibleWorkflows = filteredIds
    ? workflows.filter((w) => filteredIds.includes(w.id))
    : workflows;

  if (selectedWorkflow) {
    return (
      <div className="h-full flex flex-col">
        <button
          className="self-start m-6 px-4 py-2 bg-docs-section dark:bg-docs-dark-bg rounded text-docs-accent font-medium border border-docs-accent flex items-center"
          onClick={() => {
            setQuery('');
            setFilteredIds(null);
            setLlmExplanation(null);
            setError(null);
            setSelectedWorkflow(null);
          }}
        >
          <span className="mr-2">←</span> Back to Workflows
        </button>
        <div className="flex-1">
          <ConstructionWorkflowTabs workflowType={selectedWorkflow} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <h2 className="text-xl font-semibold mb-4 text-docs-accent">
        What can DcisionAI help decide today?
      </h2>
      <form onSubmit={handleSearch} className="w-full max-w-2xl mb-8 flex items-center space-x-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe your goal or ask a question..."
          className={`flex-1 px-4 py-2 rounded border ${
            theme === 'dark'
              ? 'bg-docs-dark-bg border-docs-dark-muted text-docs-dark-text'
              : 'bg-white border-docs-muted text-docs-text'
          }`}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 rounded bg-docs-accent text-white font-medium disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Ask DcisionAI'}
        </button>
        {filteredIds && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 rounded bg-docs-section dark:bg-docs-dark-bg text-docs-accent border border-docs-accent ml-2"
          >
            Clear
          </button>
        )}
      </form>
      {llmExplanation && (
        <div className="mb-6 w-full max-w-2xl p-4 rounded bg-docs-section dark:bg-docs-dark-bg text-docs-accent text-base">
          <TypewriterEffect text={llmExplanation} />
        </div>
      )}
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {visibleWorkflows.map((wf) => (
          <button
            key={wf.id}
            onClick={() => setSelectedWorkflow(wf.id)}
            className={`flex flex-col items-start p-6 border rounded-lg shadow hover:shadow-lg transition bg-docs-section dark:bg-docs-dark-bg hover:border-docs-accent focus:outline-none`}
          >
            <div className="mb-4">{wf.icon}</div>
            <div className="text-xl font-semibold mb-2">{wf.title}</div>
            <div className="text-sm text-docs-muted">{wf.description}</div>
          </button>
        ))}
        {visibleWorkflows.length === 0 && (
          <div className="col-span-2 text-center text-docs-muted">No workflows match your query.</div>
        )}
      </div>
    </div>
  );
};

export default ConstructionDecisionWorkflows; 