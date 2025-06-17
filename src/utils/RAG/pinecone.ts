import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Pinecone client
export const pineconeClient = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || ''
});

// Helper function to get or create index
export async function getOrCreateIndex(indexName: string, dimension: number = 1536) {
  try {
    const index = pineconeClient.Index(indexName);
    return index;
  } catch (error) {
    // If index doesn't exist, create it
    await pineconeClient.createIndex({
      name: indexName,
      dimension,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });
    return pineconeClient.Index(indexName);
  }
}

// Helper function to upsert vectors
export async function upsertVectors(indexName: string, vectors: Array<{
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}>) {
  const index = pineconeClient.Index(indexName);
  await index.upsert(vectors);
}

// Helper function to query vectors
export async function queryVectors(
  indexName: string,
  vector: number[],
  topK: number = 5,
  filter?: Record<string, any>
) {
  const index = pineconeClient.Index(indexName);
  const results = await index.query({
    vector,
    topK,
    filter,
    includeMetadata: true
  });
  return results.matches;
} 