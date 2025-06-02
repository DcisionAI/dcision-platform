import type { NextApiRequest, NextApiResponse } from 'next';
import { LLMServiceImpl } from '@server/mcp/services/llm/LLMService';

// POST { solverResponse: { results: OrchestrationResult[] }, type: string }
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { solverResponse, type } = req.body;
    if (!solverResponse?.results || !type) {
      return res.status(400).json({ error: 'Missing solverResponse or type' });
    }
    // Find the solve step result
    const step = solverResponse.results.find((r: any) => r.step?.action === 'solve_model');
    if (!step) {
      return res.status(404).json({ error: 'Solve step result not found' });
    }
    const solution = step.result?.solution || step.result;
    // Initialize LLM service
    const llm = new LLMServiceImpl('openai', process.env.OPENAI_API_KEY || '');
    // Build prompt based on requested type
    let prompt = '';
    switch (type) {
      case 'feature-importance':
        prompt = `Given this optimization solution, list the most important factors (features) influencing the solution with relative importance scores as JSON.`;
        break;
      case 'decision-path':
        prompt = `Based on this optimization solution, describe the decision-making path step by step.`;
        break;
      case 'counterfactuals':
        prompt = `Given this solution, propose three counterfactual scenarios that would change the solution and explain why.`;
        break;
      case 'global-insights':
        prompt = `Summarize global insights and patterns from this optimization solution.`;
        break;
      case 'data-distributions':
        prompt = `Analyze the data distributions (e.g., vehicle capacities, task demands, distances) used in this solution and summarize key statistics.`;
        break;
      default:
        prompt = `Explain this optimization solution.`;
    }
    // Append solution details to prompt
    prompt += `\nSolution data: ${JSON.stringify(solution)}`;
    // Call LLM
    // Call LLM without passing config object to avoid wrong content type
    const resp = await llm.call(prompt);
    return res.status(200).json({ explanation: resp.content });
  } catch (err: any) {
    console.error('Explain API error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}