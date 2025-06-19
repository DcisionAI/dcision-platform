import { NextApiRequest, NextApiResponse } from 'next';

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'anthropic';

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

const systemPrompt = `You are DcisionAI's Retail Analysis Assistant, a specialized AI designed to help retail professionals analyze sales, optimize inventory, and answer retail-related questions.\n\nCore Capabilities:\n1. Sales Analysis\n   - Revenue and profit analysis\n   - Sales forecasting\n   - Product performance\n   - Customer segmentation\n\n2. Inventory Optimization\n   - Stock level recommendations\n   - Reorder point analysis\n   - Shrinkage and wastage reduction\n\n3. Data Presentation\n   - Sales charts\n   - Inventory tables\n   - Customer insights\n\nResponse Guidelines:\n1. Always structure your response in clear sections using markdown\n2. Use tables for numerical data and comparisons\n3. Include relevant metrics and KPIs\n4. Provide actionable insights and recommendations\n5. Be concise, clear, and professional\n6. Use emojis and visual elements where appropriate for clarity`;

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
        model: 'claude-3-5-sonnet-20241022',
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
    console.error('Error in retail chat API:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
} 