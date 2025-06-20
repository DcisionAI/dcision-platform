import { NextApiRequest, NextApiResponse } from 'next';

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
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { problem, solver = 'highs' } = req.body;

    // Validate problem structure
    if (!problem || typeof problem !== 'object') {
      res.status(400).json({ error: 'Invalid problem format' });
      return;
    }

    let solution;

    // Solver selection - currently only HiGHS is implemented
    switch (solver.toLowerCase()) {
      case 'highs':
        // ✅ HiGHS is implemented (currently returns mock solutions)
        solution = await solveWithHiGHS(problem);
        break;
        
      case 'or-tools':
        // 🔄 OR-Tools is a placeholder - see docs/architecture/adding-new-solvers.md
        res.status(501).json({ 
          error: 'OR-Tools solver not yet implemented',
          message: 'See docs/architecture/adding-new-solvers.md for implementation guide'
        });
        return;
        
      case 'gurobi':
        // 🔄 Gurobi is a placeholder - requires commercial license
        res.status(501).json({ 
          error: 'Gurobi solver not yet implemented',
          message: 'Gurobi requires commercial license. See docs/architecture/adding-new-solvers.md'
        });
        return;
        
      case 'cplex':
        // 🔄 CPLEX is a placeholder - requires commercial license
        res.status(501).json({ 
          error: 'CPLEX solver not yet implemented',
          message: 'CPLEX requires commercial license. See docs/architecture/adding-new-solvers.md'
        });
        return;
        
      default:
        res.status(400).json({ 
          error: `Unknown solver: ${solver}`,
          availableSolvers: ['highs', 'or-tools', 'gurobi', 'cplex']
        });
        return;
    }

    res.status(200).json(solution);
  } catch (error: any) {
    console.error('Solver error:', error);
    res.status(500).json({ 
      error: 'Internal solver error',
      message: error.message 
    });
  }
}

// ✅ HiGHS Solver Implementation (real integration)
async function solveWithHiGHS(problem: any) {
  try {
    console.log('Solving with HiGHS:', JSON.stringify(problem, null, 2));
    
    // Import and use the real HiGHS solver
    const { HiGHSMCPSolver } = await import('@/pages/api/_lib/solvers/highs');
    const solver = new HiGHSMCPSolver();
    
    // Initialize solver
    await solver.initialize();
    
    // Solve the problem
    const result = await solver.solve(problem);
    
    // Cleanup
    await solver.shutdown();
    
    // Convert to expected format
    return {
      status: result.status,
      objectiveValue: result.objective_value,
      variables: result.solution.reduce((acc: any, sol: any) => {
        acc[sol.name] = sol.value;
        return acc;
      }, {}),
      solveTime: result.solve_time_ms / 1000, // Convert to seconds
      iterations: result.iterations,
      solver: 'highs',
      message: 'Real HiGHS solution'
    };
  } catch (error) {
    console.error('Error solving with HiGHS:', error);
    throw error;
  }
} 