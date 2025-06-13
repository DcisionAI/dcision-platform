import type { NextApiRequest, NextApiResponse } from 'next';
import { getPineconeIndex } from '../../../lib/pinecone';
import { getEmbedding } from '../../../lib/openai-embedding';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { validateApiKey } from '@/utils/validateApiKey';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey || !(await validateApiKey(apiKey))) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  const pineconeIndex = getPineconeIndex();

  if (req.method === 'GET' && req.query.all === 'true') {
    try {
      // Read vector IDs from file
      const idsPath = path.join(process.cwd(), 'src/vector-ids.json');
      const idsRaw = fs.readFileSync(idsPath, 'utf-8');
      const allIds: string[] = JSON.parse(idsRaw);
      if (!allIds.length) {
        return res.status(200).json({ docs: [] });
      }
      // Fetch all vectors by ID (Pinecone fetch max 100 per call)
      let docs: { file: string; content: string }[] = [];
      for (let i = 0; i < allIds.length; i += 100) {
        const batchIds = allIds.slice(i, i + 100);
        try {
          const fetchResult = await pineconeIndex.fetch({ ids: batchIds, includeMetadata: true });
          docs.push(...Object.values(fetchResult.vectors || {}).map((v: any) => ({
            file: v.metadata?.file,
            content: v.metadata?.content,
          })));
        } catch (batchErr) {
          console.error('Error fetching batch:', batchIds, batchErr);
          continue;
        }
      }
      return res.status(200).json({ docs });
    } catch (err) {
      console.error('Error fetching all docs:', err);
      return res.status(500).json({ error: 'Failed to fetch all docs' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid query' });
  }

  // 1. Get embedding for the query
  const queryEmbedding = await getEmbedding(query);

  // 2. Query Pinecone for top matches
  const pineconeResult = await pineconeIndex.query({
    topK: 5,
    vector: queryEmbedding,
    includeMetadata: true,
  });

  // 3. Gather context from Pinecone results
  const topChunks = pineconeResult.matches.map((match: any) => ({
    file: match.metadata?.file,
    content: match.metadata?.content,
  }));

  const context = topChunks.map((c: any) => `From ${c.file}:
${c.content}`).join('\n---\n');

  // 4. Call OpenAI LLM as before
  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-nano',
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant for DcisionAI. \nOnly answer questions using the provided documentation context. \nIf the answer is not in the context, say you do not know.\nWhen possible, include code blocks, lists, or direct quotes from the context. \nCite the source file in your answer (e.g., "From interfaces.md: ..."). \nFormat your answer in markdown.`
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${query}\n\nPlease answer in markdown, quoting or summarizing from the context above.`
      }
    ],
    max_tokens: 512,
    temperature: 0.2,
  });

  const answer = completion.choices[0].message?.content || 'No answer found.';

  return res.status(200).json({
    answer,
    sources: topChunks.map((c: any) => c.file),
    chunks: topChunks,
  });
} 