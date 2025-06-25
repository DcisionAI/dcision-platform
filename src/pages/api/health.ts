import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Basic health check
    const healthStatus: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'dcisionai-platform',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      solver_service_url: process.env.SOLVER_SERVICE_URL || 'not configured'
    };

    // Check if solver service is accessible (optional)
    if (process.env.SOLVER_SERVICE_URL) {
      try {
        const solverResponse = await fetch(`${process.env.SOLVER_SERVICE_URL}/health`, {
          method: 'GET'
        });
        
        if (solverResponse.ok) {
          healthStatus.solver_service = 'healthy';
        } else {
          healthStatus.solver_service = 'unhealthy';
        }
      } catch (error) {
        healthStatus.solver_service = 'unreachable';
      }
    }

    res.status(200).json(healthStatus);
  } catch (error: any) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 