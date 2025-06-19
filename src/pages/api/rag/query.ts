import type { NextApiRequest, NextApiResponse } from 'next';
import { queryVectors } from '@/utils/RAG/pinecone';
import { embedChunks } from '@/lib/RAG/embedding';
import { getLLMAnswer } from '@/lib/RAG/llm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { query, topK = 5 } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  const [embedding] = await embedChunks([query]);
  const results = await queryVectors('dcisionai-construction-kb', embedding, topK);

  const context = results.map((r: any, i: number) =>
    `Source ${i + 1} (${r.metadata?.sourceType || 'unknown'}):\n${r.metadata?.chunk || ''}`
  ).join('\n---\n');

  let llmAnswer = '';
  try {
    llmAnswer = await getLLMAnswer(query, context);
  } catch (err) {
    llmAnswer = '[LLM answer synthesis failed]';
  }

  res.status(200).json({ answer: llmAnswer, matches: results });
} 