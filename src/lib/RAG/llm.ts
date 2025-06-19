import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function getLLMAnswer(query: string, context: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful construction knowledge assistant. Use the provided context to answer the user question.' },
      { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` }
    ],
    max_tokens: 512,
  });
  return completion.choices[0].message.content || '';
} 