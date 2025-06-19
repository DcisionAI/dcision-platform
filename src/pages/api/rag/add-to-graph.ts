import type { NextApiRequest, NextApiResponse } from 'next';
import { Pinecone } from '@pinecone-database/pinecone';
import { getLLMAnswer } from '@/lib/RAG/llm';
import { extractEntitiesAndRelations } from '@/lib/RAG/entityExtraction';

const INDEX_NAME = 'dcisionai-construction-kb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { source, domain = 'construction' } = req.body;
  if (!source) return res.status(400).json({ error: 'Missing source' });

  try {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.Index(INDEX_NAME);
    // 1. Fetch new file's chunks
    const fileResults = await index.query({
      vector: Array(1536).fill(0),
      topK: 1000,
      includeMetadata: true,
      filter: { source: String(source) }
    });
    // 2. For each chunk, extract entities/relationships if missing
    const newEntities = new Map();
    const newEdges = new Set();
    for (const m of (fileResults.matches || [])) {
      let entities = m.metadata?.entities;
      let relationships = m.metadata?.relationships;
      if (!Array.isArray(entities) || !Array.isArray(relationships)) {
        // Run extraction on the fly
        const chunk = String(m.metadata?.chunk || '');
        const extraction = await extractEntitiesAndRelations(chunk, { domain });
        entities = extraction.entities;
        relationships = extraction.relationships;
      }
      if (Array.isArray(entities)) {
        entities.forEach((e: any) => {
          if (e && typeof e.id === 'string') newEntities.set(e.id, e);
        });
      }
      if (Array.isArray(relationships)) {
        relationships.forEach((r: any) => {
          if (r && typeof r.source === 'string' && typeof r.target === 'string') {
            newEdges.add(JSON.stringify({ from: r.source, to: r.target, type: r.type, description: r.description }));
          }
        });
      }
    }
    // 3. Fetch global knowledge graph
    const globalResults = await index.query({
      vector: Array(1536).fill(0),
      topK: 1000,
      includeMetadata: true
    });
    const globalEntities = new Map();
    const globalEdges = new Set();
    (globalResults.matches || []).forEach((m: any) => {
      (m.metadata?.entities || []).forEach((e: any) => {
        if (e && e.id) globalEntities.set(e.id, e);
      });
      (m.metadata?.relationships || []).forEach((r: any) => {
        if (r && r.source && r.target) {
          globalEdges.add(JSON.stringify({ from: r.source, to: r.target, type: r.type, description: r.description }));
        }
      });
    });
    // 4. LLM prompt for contextual merge
    const prompt = `You are a senior data engineer with expertise in the ${domain} industry. Your job is to contextually merge new knowledge into an existing knowledge graph. 

Current global knowledge graph (entities and relationships):
Entities:
${JSON.stringify(Array.from(globalEntities.values()), null, 2)}
Relationships:
${JSON.stringify(Array.from(globalEdges).map((e: unknown) => JSON.parse(e as string)), null, 2)}

New knowledge to add (entities and relationships):
Entities:
${JSON.stringify(Array.from(newEntities.values()), null, 2)}
Relationships:
${JSON.stringify(Array.from(newEdges).map((e: unknown) => JSON.parse(e as string)), null, 2)}

Instructions:
- Merge new entities/relationships into the global graph.
- Deduplicate entities (merge if same real-world concept).
- Add new relationships, and link to existing nodes if relevant.
- If new knowledge introduces novel concepts, add them.
- Output the updated knowledge graph as JSON with 'nodes' and 'edges' arrays.
- Only output valid JSON, no extra text.
`;
    let llmResponse;
    try {
      llmResponse = await getLLMAnswer(prompt, '');
    } catch (e: unknown) {
      const details = (e instanceof Error) ? e.message : String(e);
      return res.status(500).json({ error: 'LLM merge failed', details });
    }
    // Try to parse LLM response
    let mergedGraph;
    try {
      mergedGraph = JSON.parse(llmResponse);
    } catch (e: unknown) {
      const details = (e instanceof Error) ? e.message : String(e);
      return res.status(500).json({ error: 'Failed to parse LLM response', details });
    }
    res.status(200).json(mergedGraph);
  } catch (err: any) {
    const message = (err instanceof Error) ? err.message : String(err);
    res.status(500).json({ error: 'Failed to add to knowledge graph', details: message });
  }
} 