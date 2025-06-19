import type { NextApiRequest, NextApiResponse } from 'next';
import { Pinecone } from '@pinecone-database/pinecone';

const INDEX_NAME = 'dcisionai-construction-kb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { source } = req.query;
  if (!source) return res.status(400).json({ error: 'Missing source' });

  try {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.Index(INDEX_NAME);
    const results = await index.query({
      vector: Array(1536).fill(0),
      topK: 1000,
      includeMetadata: true,
      filter: { source: source as string }
    });
    const allEntities = new Map();
    const allEdges = new Set();
    (results.matches || []).forEach((m: any) => {
      (m.metadata?.entities || []).forEach((e: any) => {
        if (e && e.id) allEntities.set(e.id, e);
      });
      (m.metadata?.relationships || []).forEach((r: any) => {
        if (r && r.source && r.target) {
          allEdges.add(JSON.stringify({ from: r.source, to: r.target, type: r.type, description: r.description }));
        }
      });
    });
    const nodes = Array.from(allEntities.values());
    const edges = Array.from(allEdges).map((e: unknown) => JSON.parse(e as string));
    res.status(200).json({ nodes, edges });
  } catch (err: any) {
    const message = (err instanceof Error) ? err.message : String(err);
    res.status(500).json({ error: 'Failed to build knowledge graph', details: message });
  }
} 