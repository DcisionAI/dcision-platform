import type { NextApiRequest, NextApiResponse } from 'next';
import { Pinecone } from '@pinecone-database/pinecone';
import { getLLMAnswer } from '@/lib/RAG/llm';

const INDEX_NAME = 'dcisionai-construction-kb';

// Simple in-memory cache
const dashboardCache: {
  [key: string]: { plan: any; timestamp: number }
} = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCacheKey(tag: any, project: any) {
  return `dashboard:${Array.isArray(tag) ? tag.sort().join(',') : tag || ''}:${project || ''}`;
}

export { dashboardCache };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tag, project, refresh } = req.query;
  const cacheKey = getCacheKey(tag, project);
  const now = Date.now();

  // Serve from cache if available and not expired, unless refresh is requested
  if (!refresh && dashboardCache[cacheKey] && now - dashboardCache[cacheKey].timestamp < CACHE_TTL) {
    return res.status(200).json(dashboardCache[cacheKey].plan);
  }

  try {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.Index(INDEX_NAME);
    
    // Build filter
    const filter: Record<string, any> = {};
    if (tag) filter.tags = { $in: Array.isArray(tag) ? tag : [tag] };
    if (project) filter.project_id = project;
    
    // Query Pinecone for relevant data - limit to top 20 results to avoid token limit
    const results = await index.query({
      vector: Array(1536).fill(0),
      topK: 20, // Reduced from 100 to avoid token limit
      includeMetadata: true,
      ...(Object.keys(filter).length > 0 ? { filter } : {})
    });
    
    // Collect and summarize metadata to reduce token count
    const data = (results.matches || []).map((m: any) => {
      const metadata = m.metadata || {};
      // Only include essential fields to reduce token count
      return {
        type: metadata.type || 'unknown',
        title: metadata.title || metadata.filename || 'Untitled',
        content: metadata.content ? metadata.content.substring(0, 200) + '...' : '', // Truncate content
        tags: metadata.tags || [],
        project_id: metadata.project_id,
        score: m.score
      };
    });
    
    // If no data, return a default dashboard plan
    if (data.length === 0) {
      const defaultPlan = {
        kpi_cards: [
          {
            title: "Total Projects",
            value: "0",
            description: "No projects found in the system",
            trend: "stable"
          },
          {
            title: "Active Tasks",
            value: "0",
            description: "No active tasks available",
            trend: "stable"
          },
          {
            title: "Resource Utilization",
            value: "0%",
            description: "No resource data available",
            trend: "stable"
          },
          {
            title: "Project Health",
            value: "N/A",
            description: "No project health data available",
            trend: "stable"
          }
        ],
        charts: [],
        highlights: [
          {
            title: "No Data Available",
            content: "Upload construction project data to see dynamic insights and analytics.",
            type: "info"
          }
        ],
        alerts: [],
        recommended_tabs: ["Project Overview", "Resource Management"]
      };
      
      dashboardCache[cacheKey] = { plan: defaultPlan, timestamp: now };
      return res.status(200).json(defaultPlan);
    }
    
    // Create a more concise prompt to reduce token usage
    const prompt = `You are a construction project dashboard assistant. Generate a dashboard plan based on this data:

Data Summary:
- Total items: ${data.length}
- Types: ${Array.from(new Set(data.map(d => d.type))).join(', ')}
- Projects: ${Array.from(new Set(data.filter(d => d.project_id).map(d => d.project_id))).join(', ')}

Sample items:
${data.slice(0, 5).map(d => `- ${d.type}: ${d.title}`).join('\n')}

Generate a JSON response with:
1. kpi_cards: 3-4 key metrics (title, value, description, trend)
2. charts: 1-2 relevant charts (type: "line" or "bar", title, data array with name/value pairs, description)
3. highlights: 2-3 key insights (title, content, type: "info"/"warning"/"success")
4. alerts: 0-2 important alerts (title, message, severity: "low"/"medium"/"high")
5. recommended_tabs: 2-3 tab names for the dashboard

Make the response realistic for construction project management.`;

    const llmResponse = await getLLMAnswer(prompt, '');
    let dashboardPlan;
    try {
      dashboardPlan = JSON.parse(llmResponse);
    } catch (e) {
      console.error('LLM response parsing error:', llmResponse);
      // Return a fallback plan if LLM response is invalid
      const fallbackPlan = {
        kpi_cards: [
          {
            title: "Data Items",
            value: data.length.toString(),
            description: `Found ${data.length} items in the knowledge base`,
            trend: "up"
          },
          {
            title: "Project Types",
            value: Array.from(new Set(data.map(d => d.type))).length.toString(),
            description: "Different types of project data available",
            trend: "stable"
          }
        ],
        charts: [
          {
            type: "bar",
            title: "Data by Type",
            data: Object.entries(
              data.reduce((acc, d) => {
                acc[d.type] = (acc[d.type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([name, value]) => ({ name, value })),
            description: "Distribution of data by type"
          }
        ],
        highlights: [
          {
            title: "Data Available",
            content: `Successfully loaded ${data.length} items from the knowledge base.`,
            type: "success"
          }
        ],
        alerts: [],
        recommended_tabs: ["Data Overview", "Project Analytics"]
      };
      dashboardCache[cacheKey] = { plan: fallbackPlan, timestamp: now };
      return res.status(200).json(fallbackPlan);
    }
    
    dashboardCache[cacheKey] = { plan: dashboardPlan, timestamp: now };
    res.status(200).json(dashboardPlan);
  } catch (err: any) {
    const message = (err instanceof Error) ? err.message : String(err);
    console.error('Dashboard plan error:', err);
    res.status(500).json({ error: 'Failed to generate dashboard plan', details: message });
  }
} 