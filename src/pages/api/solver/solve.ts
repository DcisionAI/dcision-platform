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

    // Solver selection - use remote solver service
    switch (solver.toLowerCase()) {
      case 'highs':
        // ✅ Use remote HiGHS solver service
        solution = await solveWithRemoteSolver(problem, 'highs');
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

// ✅ Remote Solver Service Implementation
async function solveWithRemoteSolver(problem: any, solver: string) {
  try {
    console.log(`Solving with remote ${solver} solver:`, JSON.stringify(problem, null, 2));
    
    const solverServiceUrl = process.env.SOLVER_SERVICE_URL || 'https://solver.dcisionai.com';
    
    // Call the remote solver service
    const response = await fetch(`${solverServiceUrl}/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problem,
        solver
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Remote solver service error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('Remote solver response:', result);
    
    return result;
  } catch (error) {
    console.error(`Error solving with remote ${solver} solver:`, error);
    throw error;
  }
} 