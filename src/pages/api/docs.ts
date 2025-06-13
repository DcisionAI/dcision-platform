import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { validateApiKey } from '@/utils/validateApiKey';

async function getAllMarkdownFiles(dir: string): Promise<string[]> {
  const files = await fs.promises.readdir(dir, { withFileTypes: true });
  const markdownFiles: string[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      const subFiles = await getAllMarkdownFiles(fullPath);
      markdownFiles.push(...subFiles);
    } else if (file.name.endsWith('.md')) {
      markdownFiles.push(fullPath);
    }
  }

  return markdownFiles;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey || !(await validateApiKey(apiKey))) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { file } = req.query;
  
  // If file parameter is provided, return specific file
  if (file && typeof file === 'string') {
    const sanitizedFile = file.replace(/\.\./g, '');
    const filePath = path.join(process.cwd(), 'docs', sanitizedFile);

    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      return res.status(200).json([{ file: sanitizedFile, content }]);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return res.status(404).json({ error: `File not found: ${sanitizedFile}` });
    }
  }

  // If no file parameter, return all markdown files
  try {
    const docsDir = path.join(process.cwd(), 'docs');
    const markdownFiles = await getAllMarkdownFiles(docsDir);
    
    const docs = await Promise.all(
      markdownFiles.map(async (filePath) => {
        const relativePath = path.relative(docsDir, filePath);
        const content = await fs.promises.readFile(filePath, 'utf8');
        return { file: relativePath, content };
      })
    );

    res.status(200).json(docs);
  } catch (error) {
    console.error('Error reading docs directory:', error);
    res.status(500).json({ error: 'Failed to read documentation files' });
  }
} 