import { NextApiRequest, NextApiResponse } from 'next';

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'anthropic';

let anthropic: any = null;
let openai: any = null;

async function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
  }
  if (!anthropic) {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

async function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  if (!openai) {
    const { OpenAI } = await import('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

const systemPrompt = `You are DcisionAI's Construction Analysis Assistant, a specialized AI designed to help construction professionals analyze projects, estimate costs, and answer construction-related questions.\n\nCore Capabilities:\n1. Project Analysis\n   - Cost estimation and budgeting\n   - Timeline planning and scheduling\n   - Resource allocation\n   - Risk assessment\n   - Sustainability evaluation\n\n2. Data Presentation\n   - Cost breakdowns\n   - Timeline visualizations\n   - Risk matrices\n   - Resource allocation charts\n   - Sustainability metrics\n\nResponse Guidelines:\n1. Always structure your response in clear sections using markdown\n2. Use tables for numerical data and comparisons\n3. Include relevant metrics and KPIs\n4. Provide actionable insights and recommendations\n5. Be concise, clear, and professional\n6. Use emojis and visual elements where appropriate for clarity`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let conversation;
    try {
      if (LLM_PROVIDER === 'openai') {
        conversation = [
          { role: 'system', content: systemPrompt },
          ...(Array.isArray(history) ? history : []),
          { role: 'user', content: message },
        ];
        const openai = await getOpenAI();
        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: conversation,
          max_tokens: 1000,
        });
        const responseMessage = completion.choices[0].message.content;
        return res.status(200).json({
          message: responseMessage,
          usage: completion.usage,
          model: completion.model,
        });
      } else {
        conversation = [
          { role: 'assistant', content: systemPrompt },
          ...(Array.isArray(history) ? history.slice(-5) : []),
          { role: 'user', content: message },
        ];
        const anthropic = await getAnthropic();
        const completion = await anthropic.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: conversation,
        });
        const responseMessage = completion.content[0];
        if ('text' in responseMessage) {
          return res.status(200).json({
            message: responseMessage.text,
            usage: completion.usage,
            model: completion.model,
          });
        } else {
          throw new Error('Invalid response format from Anthropic API');
        }
      }
    } catch (error: any) {
      if (error.message.includes('API_KEY is not set')) {
        return res.status(500).json({ 
          error: 'LLM API key not configured',
          details: error.message
        });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error in construction chat API:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message || 'Unknown error occurred'
    });
  }
} 