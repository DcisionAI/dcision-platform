import type { NextApiRequest, NextApiResponse } from 'next';
import { Pinecone } from '@pinecone-database/pinecone';

const INDEX_NAME = 'dcisionai-construction-kb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.Index(INDEX_NAME);

    // Fetch a broad sample of vectors to build the graph.
    // In a real, large-scale graph, you'd likely have a dedicated endpoint 
    // or a pre-computed graph structure. For now, we query with a random vector
    // to get a representative sample of the graph's structure.
    const randomVector = Array.from({ length: 1536 }, () => Math.random());
    
    const results = await index.query({
      vector: randomVector,
      topK: 100, // Fetch a reasonable number of nodes to start
      includeMetadata: true,
    });

    const allEntities = new Map();
    const allEdges = new Set<string>();

    (results.matches || []).forEach((m: any) => {
      if (m.metadata?.entities) {
        m.metadata.entities.forEach((e: any) => {
          if (e && e.id) allEntities.set(e.id, e);
        });
      }
      if (m.metadata?.relationships) {
        m.metadata.relationships.forEach((r: any) => {
          if (r && r.source && r.target) {
            allEdges.add(JSON.stringify({ from: r.source, to: r.target, label: r.type, description: r.description }));
          }
        });
      }
    });

    // Ensure there's at least one root node if the graph is empty
    if (allEntities.size === 0) {
      allEntities.set('root', { id: 'root', label: 'Knowledge Base', group: 'domain' });
    }

    const nodes = Array.from(allEntities.values());
    const edges = Array.from(allEdges).map((e: string) => JSON.parse(e));
    
    res.status(200).json({ nodes, edges });
  } catch (err: any) {
    const message = (err instanceof Error) ? err.message : String(err);
    res.status(500).json({ error: 'Failed to build knowledge graph', details: message });
  }
} 