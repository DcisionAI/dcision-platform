import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { file } = req.query;
  
  if (!file || typeof file !== 'string') {
    return res.status(400).json({ error: 'File parameter is required' });
  }

  // Sanitize the file path to prevent directory traversal
  const sanitizedFile = file.replace(/\.\./g, '');
  const filePath = path.join(process.cwd(), 'docs', sanitizedFile);

  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    res.status(200).json({ file: sanitizedFile, content });
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    res.status(404).json({ error: `File not found: ${sanitizedFile}` });
  }
} 