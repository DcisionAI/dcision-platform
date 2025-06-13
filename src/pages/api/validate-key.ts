import type { NextApiRequest, NextApiResponse } from 'next';
// CORS configuration for validate-key endpoint
const allowedOrigins = ['http://localhost:3000', 'https://platform.dcisionai.com'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
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