import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import { upsertVectors } from '@/utils/RAG/pinecone';
import { embedChunks } from '@/lib/RAG/embedding';
import { parse as csvParse } from 'csv-parse/sync';
import { extractTextFromFile } from '@/lib/RAG/textExtraction';
import { encoding_for_model } from 'tiktoken';
import { extractEntitiesAndRelations } from '@/lib/RAG/entityExtraction';
import path from 'path';
import { dashboardCache } from '../dashboard/plan';

export const config = {
  api: {
    bodyParser: false,
  },
};

function chunkTextByTokens(text: string, maxTokens = 700): string[] {
  const enc = encoding_for_model('text-embedding-3-small');
  const tokens = enc.encode(text);
  const chunks = [];
  const decoder = new TextDecoder('utf-8');
  for (let i = 0; i < tokens.length; i += maxTokens) {
    const chunkTokens = tokens.slice(i, i + maxTokens);
    const decoded = enc.decode(chunkTokens);
    const textChunk = decoder.decode(decoded);
    chunks.push(textChunk);
  }
  enc.free();
  return chunks;
}

// Helper to ensure Pinecone metadata is only primitives or list of strings
function cleanMetadata(meta: any) {
  const result: any = {};
  for (const [key, value] of Object.entries(meta)) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      (Array.isArray(value) && value.every(v => typeof v === 'string'))
    ) {
      result[key] = value;
    } else {
      result[key] = JSON.stringify(value);
    }
  }
  return result;
}

function invalidateDashboardCache({ tag, project }: { tag?: string[] | string, project?: string }) {
  const keys = Object.keys(dashboardCache);
  if (!tag && !project) {
    // Fallback: clear all
    keys.forEach(key => delete dashboardCache[key]);
    return;
  }
  keys.forEach(key => {
    // key format: dashboard:tag1,tag2:projectId
    const [, keyTags, keyProject] = key.split(':');
    const tagList = Array.isArray(tag) ? tag : tag ? [tag] : [];
    const tagMatch = tagList.length === 0 || tagList.some(t => keyTags.includes(t));
    const projectMatch = !project || keyProject === project;
    if (tagMatch && projectMatch) {
      delete dashboardCache[key];
    }
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = new IncomingForm();
  form.parse(req, async (err, fields: Record<string, any>, files) => {
    if (err) return res.status(500).json({ error: 'File upload error' });
    let text = '';
    let sourceType = '';
    let source = '';
    if (fields.url) {
      const url = Array.isArray(fields.url) ? fields.url[0] : fields.url as string;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
      });
      if (!response.ok) {
        return res.status(400).json({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` });
      }
      const html = await response.text();
      if (html.includes('<title>Access Denied</title>')) {
        return res.status(400).json({ error: 'Access Denied by target site.' });
      }
      text = html;
      sourceType = 'url';
      source = url;
    } else if (files.file) {
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      const filename = file.originalFilename as string;
      // Log file info
      try {
        const stats = fs.statSync(file.filepath);
        console.log('Uploaded file:', file.filepath, 'name:', filename, 'size:', stats.size);
        const fileBuffer = fs.readFileSync(file.filepath);
        console.log('First 20 bytes:', fileBuffer.slice(0, 20));
      } catch (err) {
        console.error('Error getting file stats or bytes:', err);
      }
      // Add a short delay to ensure file is fully written
      await new Promise(resolve => setTimeout(resolve, 100));
      const ext = filename.split('.').pop()?.toLowerCase() || 'text';
      const tempCopyPath = `/tmp/${Date.now()}_${filename}`;
      fs.copyFileSync(file.filepath, tempCopyPath);
      let isJson = ext === 'json';
      if (isJson) {
        // Parse JSON and treat each object/array element as a chunk
        let jsonData;
        try {
          const raw = fs.readFileSync(tempCopyPath, 'utf-8');
          jsonData = JSON.parse(raw);
        } catch (e) {
          fs.unlinkSync(tempCopyPath);
          return res.status(400).json({ error: 'Invalid JSON file' });
        }
        fs.unlinkSync(tempCopyPath);
        // If array, each element is a chunk; if object, treat as one chunk
        let chunks: string[] = [];
        let metadatas: any[] = [];
        if (Array.isArray(jsonData)) {
          for (const obj of jsonData) {
            if (typeof obj === 'object') {
              chunks.push(JSON.stringify(obj));
              metadatas.push(obj);
            } else {
              chunks.push(String(obj));
              metadatas.push({});
            }
          }
        } else if (typeof jsonData === 'object') {
          chunks = [JSON.stringify(jsonData)];
          metadatas = [jsonData];
        } else {
          chunks = [String(jsonData)];
          metadatas = [{}];
        }
        const embeddings = await embedChunks(chunks);
        const vectors = chunks.map((chunk, i) => ({
          id: `chunk_${Date.now()}_${i}`,
          values: embeddings[i],
          metadata: {
            ...cleanMetadata(metadatas[i]),
            chunk,
            sourceType: ext,
            source: filename
          }
        }));
        await upsertVectors('dcisionai-construction-kb', vectors);
        // Invalidate dashboard cache after ingestion
        invalidateDashboardCache({ tag: fields.tags, project: fields.project });
        return res.status(200).json({ message: 'Ingested', chunks: chunks.length });
      }
      text = await extractTextFromFile(tempCopyPath);
      // Log extracted text
      console.log('Extracted text (first 500 chars):', text.slice(0, 500));
      fs.unlinkSync(tempCopyPath);
      sourceType = ext;
      source = filename;
    } else {
      return res.status(400).json({ error: 'No file or URL provided' });
    }
    const domain = (typeof fields.domain === 'string') ? fields.domain : 'construction';
    let externalEntities: string[] = [];
    if (fields.externalEntities && typeof fields.externalEntities === 'string') {
      externalEntities = fields.externalEntities.split(',').map((e: string) => e.trim()).filter(Boolean);
    }
    const chunks = chunkTextByTokens(text);
    const embeddings = await embedChunks(chunks);
    const vectors = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      vectors.push({
        id: `chunk_${Date.now()}_${i}`,
        values: embeddings[i],
        metadata: {
          chunk,
          sourceType,
          source,
        },
      });
    }
    await upsertVectors('dcisionai-construction-kb', vectors);
    // Invalidate dashboard cache after ingestion
    invalidateDashboardCache({ tag: fields.tags, project: fields.project });
    res.status(200).json({ message: 'Ingested', chunks: chunks.length });
  });
} 