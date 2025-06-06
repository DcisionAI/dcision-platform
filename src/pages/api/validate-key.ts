import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { key } = req.body;
  const response = await fetch('https://nbhrvwegrveoiurnwbij.functions.supabase.co/validate-key', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key }),
  });
  const data = await response.json();
  res.status(200).json(data);
} 