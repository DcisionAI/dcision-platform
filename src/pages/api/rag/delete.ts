import type { NextApiRequest, NextApiResponse } from 'next';
import { Pinecone } from '@pinecone-database/pinecone';

const INDEX_NAME = 'dcisionai-construction-kb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  try {
    // host property not supported in this SDK; use apiKey only
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.Index(INDEX_NAME);
    if (typeof index.deleteOne === 'function') {
      await index.deleteOne(id);
    } else {
      // Use the correct delete method for the Pinecone SDK
      await (index as any).delete([id]);
    }
    res.status(200).json({ message: 'Deleted', id });
  } catch (err) {
    console.error('Pinecone delete error:', err);
    res.status(500).json({ error: 'Failed to delete', details: (err as Error).message });
  }
} 