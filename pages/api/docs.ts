import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { file } = req.query;

  if (!file || typeof file !== 'string') {
    return res.status(400).json({ error: 'File parameter is required' });
  }

  try {
    // Sanitize the file path to prevent directory traversal
    const sanitizedFile = file.replace(/\.\./g, '');
    const filePath = path.join(process.cwd(), 'docs', sanitizedFile);

    // Read the markdown file
    const content = await fs.readFile(filePath, 'utf-8');
    
    res.status(200).json({ file: sanitizedFile, content });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      console.error('Error reading markdown file:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 