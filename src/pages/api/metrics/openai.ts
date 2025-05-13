import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end } = req.query;
  const apiKey = process.env.OPENAI_API_KEY;
  const orgId = process.env.OPENAI_ORG_ID; // optional

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  if (!start || !end) {
    return res.status(400).json({ error: 'Missing start or end date' });
  }

  const url = `https://api.openai.com/v1/dashboard/billing/usage?start_date=${start}&end_date=${end}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
  };
  if (orgId) headers['OpenAI-Organization'] = orgId;

  try {
    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      const error = await resp.text();
      return res.status(resp.status).json({ error });
    }
    const data = await resp.json();
    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
} 