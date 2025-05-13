import type { NextApiRequest, NextApiResponse } from 'next';
import { LLMServiceFactory } from '../../../../server/mcp/services/llm/LLMServiceFactory';

function buildModelDefinePrompt(enrichedData: any, intentInterpretation: string) {
  return `You are a world-class operations research scientist. Given the following business scenario and enriched dataset, design an optimization model by defining variables, constraints, and the objective.

For each variable, include:
- name
- description
- domain (e.g., binary, integer, continuous, set)
- business context

For each constraint, include:
- name
- description
- mathematical expression (in pseudo-math or code)
- business context

For the objective, include:
- type (minimize/maximize)
- description
- mathematical expression
- business context

Example:
{
  "variables": [
    { "name": "x_vd", "description": "1 if vehicle v is assigned to delivery d, 0 otherwise.", "domain": "binary", "businessContext": "Tracks which vehicle is responsible for each delivery." }
  ],
  "constraints": [
    { "name": "capacity_constraint", "description": "Total demand assigned to a vehicle cannot exceed its capacity.", "expression": "sum_demand(x_vd) <= capacity_v", "businessContext": "Ensures no vehicle is overloaded." }
  ],
  "objective": {
    "type": "minimize",
    "description": "Minimize total cost.",
    "expression": "sum(cost_vd * x_vd)",
    "businessContext": "Reduce operational expenses."
  }
}

Business Scenario:
${intentInterpretation}

Enriched Dataset:
${JSON.stringify(enrichedData, null, 2)}

Output only the JSON.`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { enrichedData, intentInterpretation } = req.body;
  if (!enrichedData || !intentInterpretation) {
    return res.status(400).json({ error: 'Missing enrichedData or intentInterpretation' });
  }
  try {
    const llm = LLMServiceFactory.getInstance();
    const prompt = buildModelDefinePrompt(enrichedData, intentInterpretation);
    const response = await (llm as any).callLLM(prompt);
    let output = response.content;
    try {
      output = JSON.parse(response.content);
    } catch (e) {
      // Try to extract JSON from markdown/code block
      const match = response.content.match(/\{[\s\S]*\}/);
      if (match) {
        output = JSON.parse(match[0]);
      }
    }
    return res.status(200).json({ output });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to generate model definition' });
  }
} 