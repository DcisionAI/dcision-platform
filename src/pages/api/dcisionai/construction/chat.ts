import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { ConstructionMCPSolver } from '../../_lib/ConstructionMCPSolver';

interface Solution {
  status: string;
  solver_name: string;
  objective_value: number;
  solution: Array<{
    variable_name: string;
    value: number;
    category: string;
    description: string;
  }>;
  solve_time_ms: number;
}

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
    %% Configuration
    classDef default stroke:#333,stroke-width:2px,fill:#f8f8f8;
    classDef objective stroke:#01579b,stroke-width:2px,fill:#e3f2fd;
    classDef constraint stroke:#4a148c,stroke-width:2px,fill:#f3e5f5;
    
    %% Style for edge labels
    linkStyle default stroke:#666,stroke-width:1.5px;

    subgraph Workers
      ${problem.variables.map((v: any, i: number) => 
        `${v.name || `worker_${i + 1}`}["<div class='text-lg'>${getNodeName(v, i)}<br/>${v.category || 'worker'}<br/>${v.lb}-${v.ub} workers</div>"]`
      ).join('\n      ')}
    end

    subgraph Objective
      obj["<div class='text-lg font-semibold'>Minimize Project Duration<br/>${problem.objective.description}</div>"]:::objective
    end

    subgraph Constraints
      ${problem.constraints.descriptions.map((desc: string, i: number) => 
        `c${i}["<div class='text-lg'>${desc}<br/>${problem.constraints.sense[i]} ${problem.constraints.rhs[i]}</div>"]:::constraint`
      ).join('\n      ')}
    end

    %% Connect variables to objective with thicker lines
    ${problem.variables.map((v: any, i: number) => 
      `${v.name || `worker_${i + 1}`} ---|"${problem.objective.linear[i]}"|obj`
    ).join('\n    ')}

    %% Connect variables to constraints with thicker lines
    ${problem.variables.map((v: any, vi: number) => 
      problem.constraints.dense.map((row: number[], ci: number) => 
        row[vi] !== 0 ? `${v.name || `worker_${vi + 1}`} ---|"${row[vi]}"|c${ci}` : ''
      ).filter((s: string) => s).join('\n    ')
    ).join('\n    ')}

    %% Style all subgraphs to be transparent with borders
    style Workers fill:#f8f8f8,stroke:#333,stroke-width:1px
    style Objective fill:#e3f2fd,stroke:#01579b,stroke-width:1px
    style Constraints fill:#f3e5f5,stroke:#4a148c,stroke-width:1px`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ type: 'error', content: 'Method not allowed' });
    return;
  }

  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ type: 'error', content: 'Message is required' });
      return;
    }

    // Initialize solver if needed
    if (!solver) {
      try {
        solver = new ConstructionMCPSolver();
        await solver.initialize();
      } catch (initError) {
        console.error('Failed to initialize solver:', initError);
        res.status(500).json({ 
          type: 'error', 
          content: 'Failed to initialize optimization solver. Please try again in a moment.' 
        });
        return;
      }
    }

    // Generate optimization problem using AI
    const prompt = `
Create a construction optimization problem for crew assignments with the following structure:

{
  "problem_type": "resource_allocation",
  "sense": "minimize",
  "objective": {
    "linear": [1, 1, 1, 1],  // Coefficients for [carpenter_count, electrician_count, plumber_count, hvac_count]
    "description": "Minimize total project duration while optimizing crew assignments"
  },
  "variables": [
    {
      "name": "carpenter_count",
      "type": "int",
      "lb": 0,
      "ub": 5,  // Maximum carpenters available
      "description": "Number of carpenters assigned",
      "category": "worker"
    },
    {
      "name": "electrician_count",
      "type": "int",
      "lb": 0,
      "ub": 5,  // Maximum electricians available
      "description": "Number of electricians assigned",
      "category": "worker"
    },
    {
      "name": "plumber_count",
      "type": "int",
      "lb": 0,
      "ub": 3,  // Maximum plumbers available
      "description": "Number of plumbers assigned",
      "category": "worker"
    },
    {
      "name": "hvac_count",
      "type": "int",
      "lb": 0,
      "ub": 2,  // Maximum HVAC technicians available
      "description": "Number of HVAC technicians assigned",
      "category": "worker"
    }
  ],
  "constraints": {
    "dense": [
      [1, 1, 1, 1],  // Total workers constraint
      [1, 0, 0, 0],  // Carpenter minimum
      [0, 1, 0, 0],  // Electrician minimum
      [0, 0, 1, 0],  // Plumber minimum
      [0, 0, 0, 1]   // HVAC minimum
    ],
    "sense": ["<=", ">=", ">=", ">=", ">="],
    "rhs": [15, 2, 2, 1, 1],  // Maximum total and minimum per trade
    "descriptions": [
      "Maximum total workers on site",
      "Minimum carpenters required",
      "Minimum electricians required",
      "Minimum plumbers required",
      "Minimum HVAC technicians required"
    ],
    "categories": ["capacity", "safety", "safety", "safety", "safety"]
  },
  "metadata": {
    "project_type": "office_building",
    "num_stories": 3,
    "phases": [
      {"name": "foundation", "duration": 2},
      {"name": "framing", "duration": 3},
      {"name": "mep", "duration": 4},
      {"name": "finishing", "duration": 2}
    ]
  }
}

Based on the scenario: ${message}

Respond with ONLY the JSON object, no additional text.`;

    // Call AI to generate the optimization problem
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2000
    });

    const jsonText = completion.choices[0].message.content?.trim() || '';
    
    try {
      // Clean up markdown formatting if present
      let cleanJsonText = jsonText;
      if (cleanJsonText.startsWith('```json')) {
        cleanJsonText = cleanJsonText.substring(7);
      }
      if (cleanJsonText.endsWith('```')) {
        cleanJsonText = cleanJsonText.substring(0, cleanJsonText.length - 3);
      }
      cleanJsonText = cleanJsonText.trim();

      // Parse and solve the optimization problem
      const parsedProblem = JSON.parse(cleanJsonText);
      
      // Solve the problem
      const solution = await solver.solveConstructionOptimization(parsedProblem);
      
      // Generate summary
      const getWorkerName = (s: { name?: string; value: number }, index: number) => {
        if (!s.name) return `worker_${index + 1}`;
        return s.name.split('_')[0] || `worker_${index + 1}`;
      };

      const summary = `Based on the optimization results:
- Workers per phase: ${solution.solution.map((s: { name?: string; value: number }, i: number) => `${getWorkerName(s, i)}: ${s.value}`).join(', ')}
- Total workers: ${solution.solution.reduce((sum: number, s: { value: number }) => sum + (s.value || 0), 0)}
- Total duration: ${parsedProblem.metadata.phases.reduce((sum: number, p: { duration: number }) => sum + (p.duration || 0), 0)} weeks
- Solve time: ${solution.solve_time_ms || 0}ms

The optimal solution achieves efficient crew assignments while maintaining safety and quality standards.`;

      // Generate visualization
      const visualization = generateMermaidChart(parsedProblem);
      
      // Send response in the format expected by ResponseTabs
      res.status(200).json({
        type: 'optimization',
        content: {
          problem: parsedProblem,
          solution: solution,
          summary: summary,
          visualization: visualization
        }
      });

    } catch (parseError: any) {
      console.error('Error parsing or solving optimization problem:', parseError);
      res.status(200).json({
        type: 'error',
        content: `Failed to optimize crew assignments: ${parseError.message}. Please try rephrasing your request.`
      });
    }
  } catch (error: any) {
    console.error('Construction chat API error:', error);
    res.status(500).json({
      type: 'error',
      content: 'Network or server error. Please try again in a moment.'
    });
  }
} 