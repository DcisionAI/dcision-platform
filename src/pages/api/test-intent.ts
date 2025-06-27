import { NextApiRequest, NextApiResponse } from 'next';
import { agnoIntentAgent } from '@/pages/api/_lib/dcisionai-agents/intentAgent/agnoIntentAgent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ type: 'error', content: 'Method not allowed' });
  }

  try {
    const { message, sessionId = 'test-intent' } = req.body;
    if (!message) {
      return res.status(400).json({ type: 'error', content: 'Message is required' });
    }

    console.log(`🔍 Testing intent analysis for: ${message}`);
    
    const intent = await agnoIntentAgent.analyzeIntent(message, sessionId);
    
    console.log('✅ Intent analysis result:', intent);
    
    res.status(200).json({
      type: 'success',
      intent,
      message,
      sessionId
    });

  } catch (error: any) {
    console.error('❌ Intent test error:', error);
    res.status(500).json({
      type: 'error',
      content: error.message || 'Intent analysis failed'
    });
  }
} 