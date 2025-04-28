import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Utility: Recursively get all markdown files in /docs
async function getAllMarkdownFiles(dir: string): Promise<string[]> {
  let files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await getAllMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Utility: Read and chunk markdown files
async function loadAndChunkDocs(): Promise<{ file: string; content: string }[]> {
  const docsDir = path.resolve(process.cwd(), 'docs');
  const files = await getAllMarkdownFiles(docsDir);
  const chunks: { file: string; content: string }[] = [];
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf-8');
    const { content } = matter(raw);
    // Simple chunking: split by double newlines (paragraphs)
    content.split(/\n\n+/).forEach((chunk) => {
      if (chunk.trim().length > 0) {
        chunks.push({ file: path.relative(docsDir, file), content: chunk.trim() });
      }
    });
  }
  return chunks;
}

// Utility: Get embedding for a string
async function getEmbedding(text: string): Promise<number[]> {
  const resp = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return resp.data[0].embedding;
}

// Utility: Cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid query' });
  }

  // 1. Load and chunk docs
  const chunks = await loadAndChunkDocs();

  // 2. Get embeddings for all chunks (in-memory, not cached for now)
  const chunkEmbeddings = await Promise.all(
    chunks.map(async (chunk) => ({
      ...chunk,
      embedding: await getEmbedding(chunk.content.slice(0, 1000)), // Truncate for embedding API
    }))
  );

  // 3. Get embedding for the query
  const queryEmbedding = await getEmbedding(query);

  // 4. Compute similarity and select top N chunks
  const topChunks = chunkEmbeddings
    .map(chunk => ({
      ...chunk,
      similarity: cosineSimilarity(chunk.embedding, queryEmbedding)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5); // Top 5 chunks

  // 5. Compose context for LLM
  const context = topChunks.map(c => `From ${c.file}:
${c.content}`).join('\n---\n');

  // 6. Call OpenAI completion API
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant for DcisionAI. 
Only answer questions using the provided documentation context. 
If the answer is not in the context, say you do not know.
When possible, include code blocks, lists, or direct quotes from the context. 
Cite the source file in your answer (e.g., "From interfaces.md: ..."). 
Format your answer in markdown.`
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
    sources: topChunks.map(c => c.file)
  });
} 