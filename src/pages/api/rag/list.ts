import type { NextApiRequest, NextApiResponse } from 'next';
import { Pinecone } from '@pinecone-database/pinecone';

const INDEX_NAME = 'dcisionai-construction-kb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { limit = 20, page = 1, type, tag, status } = req.query;
  const topK = Math.min(Number(limit) || 20, 100);
  const offset = (Number(page) - 1) * topK;

  // Build Pinecone filter
  const filter: Record<string, any> = {};
  if (type) filter.sourceType = type;
  if (status) filter.status = status;
  if (tag) filter.tags = { $in: Array.isArray(tag) ? tag : [tag] };

  try {
    // host property not supported in this SDK; use apiKey only
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.Index(INDEX_NAME);
    const queryParams: any = {
      vector: Array(1536).fill(0),
      topK: topK * Number(page),
      includeMetadata: true,
    };
    if (Object.keys(filter).length > 0) {
      queryParams.filter = filter;
    }
    const results = await index.query(queryParams);
    const allMatches = results.matches || [];
    const pagedMatches = allMatches.slice(offset, offset + topK);
    const vectors = pagedMatches.map((m: any) => ({
      id: m.id,
      ...m.metadata,
    }));
    res.status(200).json({ vectors, total: allMatches.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list vectors', details: (err as Error).message });
  }
} 