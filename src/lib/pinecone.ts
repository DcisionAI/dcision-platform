import { Pinecone } from '@pinecone-database/pinecone';

if (!process.env.PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY is not set in environment variables');
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const constructionIndex = pinecone.index('dcisionai-construction-kb');

export async function getEmbeddings(text: string): Promise<number[]> {
  // In a real application, you would call an embedding model here
  // For demonstration, we'll simulate this.
  console.log("Generating embeddings for:", text);
  // This is a placeholder. Replace with a real embedding service like OpenAI.
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Failed to get embeddings:', errorBody);
    throw new Error(`Failed to get embeddings: ${response.statusText}`);
  }

  const { data } = await response.json();
  return data[0].embedding;
} 