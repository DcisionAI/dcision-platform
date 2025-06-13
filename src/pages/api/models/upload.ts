import type { NextApiRequest, NextApiResponse } from 'next';
const formidable = require('formidable');
import fs from 'fs';
import path from 'path';
import { getPineconeIndex } from '../../../../lib/pinecone';
import { getEmbedding } from '../../../../lib/openai-embedding';
import { validateApiKey } from '@/utils/validateApiKey';

export const config = { api: { bodyParser: false } };

function inferProblemType(filename: string, content: string): string {
  const lower = (filename + ' ' + content).toLowerCase();
  if (lower.includes('vehicle') || lower.includes('route')) return 'vehicle_routing';
  if (lower.includes('knapsack')) return 'knapsack';
  if (lower.includes('job') && lower.includes('shop')) return 'job_shop';
  if (lower.includes('blend')) return 'blending';
  if (lower.includes('cut')) return 'cutting';
  if (lower.includes('staff') || lower.includes('schedule')) return 'staff_scheduling';
  return 'custom';
}

function extractDescription(content: string): string {
  const lines = content.split('\n').map(l => l.trim());
  const comment = lines.find(l => l.startsWith('#') || l.startsWith('//') || l.startsWith('"""'));
  if (comment) return comment.replace(/^#|\/\/|"""/, '').trim();
  return lines.slice(0, 2).join(' ');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey || !(await validateApiKey(apiKey))) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  const form = new formidable.IncomingForm({ multiples: true });
  form.parse(req, async (err: any, fields: any, files: any) => {
    if (err) return res.status(500).json({ error: 'File upload error' });
    const pineconeIndex = getPineconeIndex();
    const uploads = Array.isArray(files.file) ? files.file : [files.file].filter(Boolean);
    let count = 0;
    for (const file of uploads) {
      if (!file || !file.originalFilename) continue;
      const ext = path.extname(file.originalFilename).toLowerCase();
      if (ext === '.zip') {
        // Not yet supported: zip extraction for batch upload
        return res.status(400).json({ error: 'ZIP upload not yet supported. Please extract and upload individual files.' });
      }
      if (!['.py', '.ipynb', '.json', '.md', '.txt'].includes(ext)) continue;
      const raw = await fs.promises.readFile(file.filepath, 'utf-8');
      const problemType = inferProblemType(file.originalFilename, raw);
      const description = extractDescription(raw);
      const embedding = await getEmbedding(raw.slice(0, 2000));
      await pineconeIndex.upsert([
        {
          id: file.originalFilename,
          values: embedding,
          metadata: {
            problemType,
            source: 'customer_upload',
            filename: file.originalFilename,
            description,
            content: raw.slice(0, 2000)
          }
        }
      ]);
      count++;
    }
    res.status(200).json({ success: true, count });
  });
} 