import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import { extractTextFromFile } from '@/lib/RAG/textExtraction';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'File upload error' });
    if (!files.file) return res.status(400).json({ error: 'No file provided' });
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const filename = file.originalFilename as string;
    const tempCopyPath = `/tmp/${Date.now()}_${filename}`;
    try {
      fs.copyFileSync(file.filepath, tempCopyPath);
      const text = await extractTextFromFile(tempCopyPath);
      fs.unlinkSync(tempCopyPath);
      res.status(200).json({ text });
    } catch (e) {
      if (fs.existsSync(tempCopyPath)) fs.unlinkSync(tempCopyPath);
      res.status(500).json({ error: 'Text extraction failed', details: (e as Error).message });
    }
  });
} 