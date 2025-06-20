import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { ConstructionMCPSolver } from '../../_lib/ConstructionMCPSolver';
import { constructionIndex, getEmbeddings } from '../../../../lib/pinecone';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Keep a solver instance
let solver: ConstructionMCPSolver | null = null;

/**
 * Generate a Mermaid chart for optimization problems
 */
function generateMermaidChart(problem: any): string {
    // Helper function to get clean node names
    const getNodeName = (v: any, index: number) => {
        if (!v.name) return `worker_${index + 1}`;
        const baseName = v.name.split('_')[0];
        return baseName || `worker_${index + 1}`;
    };

    return `graph TD
    subgraph Workers
      ${problem.variables.map((v: any, i: number) => 
        `${v.name || `worker_${i+1}`}["${getNodeName(v, i)}<br/>${v.category || 'worker'}<br/>${v.lb}-${v.ub} units"]`
      ).join('\n      ')}
    end
    subgraph Objective
      obj["${problem.objective.description}"]
    end
    subgraph Constraints
      ${problem.constraints.descriptions.map((desc: string, i: number) => 
        `c${i}["${desc}<br/>${problem.constraints.sense[i]} ${problem.constraints.rhs[i]}"]`
      ).join('\n      ')}
    end
    ${problem.variables.map((v: any, i: number) => `${v.name || `worker_${i+1}`} -->|${problem.objective.linear[i]}| obj`).join('\n    ')}
    ${problem.variables.map((v: any, vi: number) => 
        problem.constraints.dense.map((row: number[], ci: number) => 
            row[vi] !== 0 ? `${v.name || `worker_${vi+1}`} -->|${row[vi]}| c${ci}` : ''
        ).filter(Boolean).join('\n    ')
    ).join('\n    ')}
    classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef objective fill:#e3f2fd,stroke:#01579b,stroke-width:2px;
    classDef constraint fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    class obj objective;
    ${problem.constraints.descriptions.map((_: any, i: number) => `class c${i} constraint;`).join('\n    ')}
  `;
}

async function getRequestType(message: string): Promise<'rag' | 'optimization' | 'hybrid'> {
  const prompt = `
    Analyze the user's request and classify it into one of three categories: "rag", "optimization", or "hybrid".

    1.  **"rag"**: The user is asking a question that can be answered from a knowledge base.
        Examples:
        *   "What are the best practices for curing concrete in cold weather?"
        *   "Summarize the safety requirements for scaffolding."
        *   "Find information on sustainable building materials."

    2.  **"optimization"**: The user wants to solve a mathematical optimization problem, like resource allocation, scheduling, or cost minimization.
        Examples:
        *   "Allocate 30 workers across 5 projects to minimize costs."
        *   "Find the best schedule for a 3-month construction project."
        *   "Optimize the material cutting to reduce waste."

    3.  **"hybrid"**: The user is asking to perform an optimization task that requires information from the knowledge base. The query combines a question with an optimization goal.
        Examples:
        *   "Given the safety regulations for scaffolding from the knowledge base, create an optimized work schedule."
        *   "Find the best fire-resistant materials from the KB and then use them to create a cost-effective building plan."
        *   "How do soil conditions affect foundation costs? Use that to optimize my budget."

    User Request: "${message}"

    Respond with ONLY one word: "rag", "optimization", or "hybrid".
  `;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    max_tokens: 10,
  });

  const result = completion.choices[0].message.content?.trim().toLowerCase();

  if (result === 'rag' || result === 'optimization' || result === 'hybrid') {
    return result;
  }
  // Fallback if the classification fails
  return 'optimization';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ type: 'error', content: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ type: 'error', content: 'Message is required' });
    }

    const requestType = await getRequestType(message);

    switch (requestType) {
      case 'rag':
        return await handleRAGRequest(message, res);
      case 'optimization':
        return await handleOptimizationRequest(message, "", res);
      case 'hybrid':
        return await handleHybridRequest(message, res);
      default:
        // This default case should ideally not be reached
        return await handleOptimizationRequest(message, "", res);
    }
  } catch (error: any) {
    console.error('Construction chat API error:', error);
    res.status(500).json({
      type: 'error',
      content: 'Network or server error. Please try again in a moment.'
    });
  }
}

async function handleRAGRequest(message: string, res: NextApiResponse) {
  try {
    const queryEmbedding = await getEmbeddings(message);
    const queryResponse = await constructionIndex.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    });

    const context = queryResponse.matches.map(match => match.metadata?.text).join('\n\n');

    const prompt = `You are a helpful construction knowledge base assistant. Answer the user's question based on the provided context.

    Context:
    ${context}
    
    Question: ${message}
    
    Answer:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
    });

    const ragResponse = completion.choices[0].message.content || 'No information found.';

    res.status(200).json({
      type: 'rag',
      content: {
        rag: ragResponse,
        summary: `RAG query for "${message}" completed.`
      }
    });
  } catch (error) {
    console.error('RAG request failed:', error);
    res.status(500).json({
      type: 'error',
      content: 'Failed to search knowledge base. Please try again.'
    });
  }
}

async function handleOptimizationRequest(message: string, knowledgeBaseContext = "", res: NextApiResponse) {
  if (!solver) {
    try {
      solver = new ConstructionMCPSolver();
      await solver.initialize();
    } catch (initError) {
      console.error('Failed to initialize solver:', initError);
      return res.status(500).json({ 
        type: 'error', 
        content: 'Failed to initialize optimization solver. Please try again.' 
      });
    }
  }

  const solverName = solver.getCurrentSolver();

  const prompt = `
    You are a mathematical optimization expert with a PhD. Your task is to formulate a mathematical optimization problem for the ${solverName} solver, based on the user's request.

    Create a construction optimization problem in JSON format.
    
    ${knowledgeBaseContext ? `Use the following information from the knowledge base to inform the constraints and variables:
    ---
    ${knowledgeBaseContext}
    ---
    ` : ''}

    User Request: "${message}"

    Based on the request, generate a JSON object for the optimization problem with this structure:
    {
      "problem_type": "resource_allocation",
      "sense": "minimize" | "maximize",
      "objective": { "linear": [...], "description": "..." },
      "variables": [ { "name": "...", "type": "int" | "continuous", "lb": ..., "ub": ..., "description": "...", "category": "..." } ],
      "constraints": { "dense": [[...]], "sense": ["<=", ">=", "=="], "rhs": [...], "descriptions": [...], "categories": [...] },
      "metadata": { ... }
    }
    
    Important Modeling Guidelines:
    1. For totals (e.g., "total workers", "total cost"), create a constraint that sums the individual variables. Do NOT create a separate variable for the total.
    2. Example: A constraint for "total workers must not exceed 15" with variables for carpenters and electricians should be implemented in the JSON as follows:
       - A row in the 'dense' matrix like [1, 1, ...] (with a 1 for each worker type).
       - A corresponding '<=' in the 'sense' array.
       - A corresponding 15 in the 'rhs' array.

    Respond with ONLY the JSON object.
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const jsonText = completion.choices[0].message.content?.trim() || '';

  try {
    const parsedProblem = JSON.parse(jsonText);
    const solution = await solver.solveConstructionOptimization(parsedProblem);

    if (!solution || !solution.status) {
      throw new Error('Received an invalid solution from the optimization solver.');
    }

    const summary = `The optimization resulted in a status of "${solution.status}" with an objective value of ${solution.objective_value}. The solve time was ${solution.solve_time_ms}ms.`;
    const visualization = generateMermaidChart(parsedProblem);
    
    res.status(200).json({
      type: 'optimization',
      content: {
        problem: parsedProblem,
        solution: solution,
        summary: summary,
        visualization: visualization,
      },
    });

  } catch (parseError: any) {
    console.error('Error parsing or solving optimization problem:', parseError);
    res.status(200).json({
      type: 'error',
      content: `Failed to process the optimization request: ${parseError.message}. Please try rephrasing your request.`
    });
  }
}

async function handleHybridRequest(message: string, res: NextApiResponse) {
  try {
    // 1. Get context from RAG
    const queryEmbedding = await getEmbeddings(message);
    const queryResponse = await constructionIndex.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    });
    const ragContext = queryResponse.matches.map(match => match.metadata?.text).join('\n\n');

    // 2. Pass context to optimization handler
    return await handleOptimizationRequest(message, ragContext, res);

  } catch (error) {
    console.error('Hybrid request failed:', error);
    res.status(500).json({
      type: 'error',
      content: 'Failed to process hybrid request. Please try again.'
    });
  }
} 