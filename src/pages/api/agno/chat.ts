import { NextApiRequest, NextApiResponse } from 'next';

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'anthropic';

// Lazy import to avoid loading both SDKs unless needed
let anthropic: any = null;
let openai: any = null;

async function getAnthropic() {
  if (!anthropic) {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

async function getOpenAI() {
  if (!openai) {
    const { OpenAI } = await import('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

const systemPrompt = `You are DcisionAI's Finance Assistant, a specialized AI designed to help users with financial analysis, planning, and advice.\n\nResponse Guidelines:\n- Use markdown formatting.\n- Be concise, clear, and professional.\n- Use tables for numerical data.\n- Provide actionable insights.`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Prepare conversation history
    let conversation;
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
      // Default to Anthropic
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
  } catch (error) {
    console.error('Error in agno API:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
} 