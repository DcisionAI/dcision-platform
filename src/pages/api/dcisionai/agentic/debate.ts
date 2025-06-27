import { NextApiRequest, NextApiResponse } from 'next';
import { messageBus } from '@/agent/MessageBus';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId = uuidv4(), topic, agentOutput } = req.body;
    if (!topic || !agentOutput) {
      return res.status(400).json({ error: 'Missing topic or agentOutput' });
    }

    let debateResult: any = null;
    messageBus.subscribe('debate_result', (msg: any) => {
      if (msg.correlationId === sessionId) {
        debateResult = msg.payload;
      }
    });

    // Publish a trigger_debate event
    messageBus.publish({
      type: 'trigger_debate',
      payload: {
        topic,
        agentOutput,
        sessionId
      },
      correlationId: sessionId
    });

    // Wait for debate result (timeout 60s)
    const timeout = 60000;
    const startTime = Date.now();
    while (!debateResult && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!debateResult) {
      return res.status(408).json({ error: 'Debate request timed out' });
    }

    res.status(200).json({
      type: 'debate_result',
      content: debateResult
    });
  } catch (error: any) {
    console.error('❌ Debate API error:', error);
    res.status(500).json({ error: 'Server error' });
  }
} 