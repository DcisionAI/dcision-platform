import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function callOpenAI(prompt: string, config?: { model?: string, temperature?: number }) {
  const model = config?.model || 'gpt-3.5-turbo';
  const temperature = config?.temperature ?? 0.2;
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: 'You are an expert operations research assistant.' },
      { role: 'user', content: prompt },
    ],
    temperature,
  });
  return response.choices[0]?.message?.content || '';
} 