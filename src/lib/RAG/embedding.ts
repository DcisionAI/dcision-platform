// Embedding utility for RAG
// In production, use OpenAI, Cohere, or other embedding providers

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function embedChunks(chunks: string[]): Promise<number[][]> {
  if (!chunks.length) return [];
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunks,
  });
  return response.data.map(obj => obj.embedding);
} 