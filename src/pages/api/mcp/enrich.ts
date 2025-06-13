import type { NextApiRequest, NextApiResponse } from 'next';
import { LLMServiceFactory } from '../../../../server/mcp/services/llm/LLMServiceFactory';
import { validateApiKey } from '@/utils/validateApiKey';

const FALLBACK_ENRICHMENTS = [
  { source: 'TrafficPredictions', description: 'Predicted traffic conditions for each route or delivery.' },
  { source: 'WeatherForecasts', description: 'Weather forecasts for each delivery location and time.' },
  { source: 'LaborLaws', description: 'Relevant labor law constraints for drivers and workers.' }
];

function buildEnrichPrompt(sampleData: any, enrichmentSuggestions: any) {
  // Use fallback if enrichmentSuggestions is empty or missing
  const enrichments = Array.isArray(enrichmentSuggestions) && enrichmentSuggestions.length > 0
    ? enrichmentSuggestions
    : FALLBACK_ENRICHMENTS;
  const enrichList = enrichments.map(e => `- ${e.source}: ${e.description || ''}`).join('\n');
  return `You are a data scientist. Given the following dataset and a list of enrichment sources, augment the dataset by adding new fields or tables for each enrichment source. For example, if 'TrafficPredictions' is recommended, add a 'traffic' field or table with realistic traffic data for each relevant entity. If 'WeatherForecasts' is recommended, add weather data.\n\nDataset:\n${JSON.stringify(sampleData, null, 2)}\n\nEnrichment Sources:\n${enrichList}\n\nOutput the enriched dataset in JSON format, with new fields or tables for each enrichment source. Do not include any explanation, just the JSON.`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey || !(await validateApiKey(apiKey))) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { sampleData, enrichmentSuggestions } = req.body;
  if (!sampleData) {
    return res.status(400).json({ error: 'Missing sampleData' });
  }
  try {
    const llm = LLMServiceFactory.getInstance();
    const prompt = buildEnrichPrompt(sampleData, enrichmentSuggestions);
    const response = await (llm as any).callLLM(prompt);
    let enrichedData = response.content;
    try {
      enrichedData = JSON.parse(response.content);
    } catch (e) {
      // Try to extract JSON from markdown/code block
      const match = response.content.match(/\{[\s\S]*\}/);
      if (match) {
        enrichedData = JSON.parse(match[0]);
      }
    }
    // Always return the enrichment sources actually used
    const usedEnrichments = Array.isArray(enrichmentSuggestions) && enrichmentSuggestions.length > 0
      ? enrichmentSuggestions
      : FALLBACK_ENRICHMENTS;
    return res.status(200).json({ enrichmentSources: usedEnrichments, enrichedData });
  } catch (e) {
    const usedEnrichments = Array.isArray(enrichmentSuggestions) && enrichmentSuggestions.length > 0
      ? enrichmentSuggestions
      : FALLBACK_ENRICHMENTS;
    return res.status(200).json({ enrichmentSources: usedEnrichments, enrichedData: sampleData, error: 'LLM unavailable, returned original data.' });
  }
} 