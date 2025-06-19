import type { NextApiRequest, NextApiResponse } from 'next';
import { Pinecone } from '@pinecone-database/pinecone';
import { getLLMAnswer } from '@/lib/RAG/llm';

// Cache for dashboard data to avoid repeated processing
const dashboardCache: { [key: string]: { data: any; timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface KPICard {
  title: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'stable';
}

interface Chart {
  type: 'line' | 'bar' | 'pie';
  title: string;
  data: any[];
  description: string;
}

interface DashboardData {
  kpi_cards: KPICard[];
  charts: Chart[];
  lastUpdated: string;
}

function extractKPIsFromStructuredData(data: any[]): DashboardData {
  const now = new Date().toLocaleString();
  
  // Filter for structured data files (CSV, XLSX)
  const structuredFiles = data.filter(item => 
    item.sourceType === 'csv' || 
    item.sourceType === 'xlsx' || 
    item.sourceType === 'xls' ||
    (item.source && (item.source.includes('.csv') || item.source.includes('.xlsx') || item.source.includes('.xls')))
  );

  if (structuredFiles.length === 0) {
    return {
      kpi_cards: [
        {
          title: "No Data Files",
          value: "0",
          description: "No structured data files found",
          trend: "stable"
        }
      ],
      charts: [],
      lastUpdated: now
    };
  }

  // Extract basic metrics from file metadata
  const totalFiles = structuredFiles.length;
  const fileTypes = Array.from(new Set(structuredFiles.map(f => f.sourceType || 'unknown')));
  
  // Try to extract project-specific data from file content
  let projectCount = 0;
  let workerCount = 0;
  let taskCount = 0;
  let equipmentCount = 0;
  let statusCounts: { [key: string]: number } = {};

  structuredFiles.forEach(file => {
    const content = file.chunk || '';
    
    // Look for project-related patterns
    if (content.includes('project_id') || content.includes('project') || content.includes('Project')) {
      projectCount++;
    }
    
    // Look for worker/employee patterns
    if (content.includes('worker') || content.includes('employee') || content.includes('staff') || 
        content.includes('Worker') || content.includes('Employee') || content.includes('Staff')) {
      workerCount++;
    }
    
    // Look for task patterns
    if (content.includes('task') || content.includes('Task') || content.includes('activity') || content.includes('Activity')) {
      taskCount++;
    }
    
    // Look for equipment patterns
    if (content.includes('equipment') || content.includes('Equipment') || content.includes('machine') || content.includes('Machine')) {
      equipmentCount++;
    }
    
    // Look for status patterns
    const statusMatches = content.match(/(?:status|Status)[\s:]*([A-Za-z]+)/g);
    if (statusMatches) {
      statusMatches.forEach((match: string) => {
        const status = match.split(/[\s:]+/)[1];
        if (status) {
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        }
      });
    }
  });

  // Create KPI cards
  const kpiCards: KPICard[] = [
    {
      title: "Data Files",
      value: totalFiles,
      description: `Total structured data files (${fileTypes.join(', ')})`,
      trend: "stable"
    }
  ];

  if (projectCount > 0) {
    kpiCards.push({
      title: "Projects",
      value: projectCount,
      description: "Projects identified in data files",
      trend: "up"
    });
  }

  if (workerCount > 0) {
    kpiCards.push({
      title: "Workers",
      value: workerCount,
      description: "Workers/employees in project data",
      trend: "stable"
    });
  }

  if (taskCount > 0) {
    kpiCards.push({
      title: "Tasks",
      value: taskCount,
      description: "Tasks/activities identified",
      trend: "up"
    });
  }

  if (equipmentCount > 0) {
    kpiCards.push({
      title: "Equipment",
      value: equipmentCount,
      description: "Equipment/machinery tracked",
      trend: "stable"
    });
  }

  // Create charts
  const charts: Chart[] = [];

  // Status distribution chart
  if (Object.keys(statusCounts).length > 0) {
    charts.push({
      type: "bar",
      title: "Project Status Distribution",
      data: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
      description: "Distribution of project statuses found in data"
    });
  }

  // File type distribution
  if (fileTypes.length > 1) {
    const fileTypeCounts = fileTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    charts.push({
      type: "pie",
      title: "Data File Types",
      data: Object.entries(fileTypeCounts).map(([name, value]) => ({ name, value })),
      description: "Distribution of uploaded file types"
    });
  }

  return {
    kpi_cards: kpiCards,
    charts: charts,
    lastUpdated: now
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = Date.now();
    const cacheKey = 'static_dashboard';
    
    // Check cache first
    if (dashboardCache[cacheKey] && (now - dashboardCache[cacheKey].timestamp) < CACHE_DURATION) {
      return res.status(200).json(dashboardCache[cacheKey].data);
    }

    // Query Pinecone for structured data files
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.Index('dcisionai-construction-kb');
    
    const queryResponse = await index.query({
      vector: Array(1536).fill(0),
      topK: 50,
      includeMetadata: true
    });
    
    if (!queryResponse.matches || queryResponse.matches.length === 0) {
      const emptyData: DashboardData = {
        kpi_cards: [
          {
            title: "No Data",
            value: "0",
            description: "No data files found in the system",
            trend: "stable"
          }
        ],
        charts: [],
        lastUpdated: new Date().toLocaleString()
      };
      
      dashboardCache[cacheKey] = { data: emptyData, timestamp: now };
      return res.status(200).json(emptyData);
    }

    // Extract data from Pinecone results
    const data = queryResponse.matches.map((match: any) => ({
      ...match.metadata,
      score: match.score
    }));

    // Extract KPIs from structured data
    const dashboardData = extractKPIsFromStructuredData(data);
    
    // Cache the result
    dashboardCache[cacheKey] = { data: dashboardData, timestamp: now };
    
    res.status(200).json(dashboardData);
  } catch (err: any) {
    const message = (err instanceof Error) ? err.message : String(err);
    console.error('Static dashboard error:', err);
    res.status(500).json({ error: 'Failed to generate static dashboard', details: message });
  }
} 