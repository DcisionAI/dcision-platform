import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Pinecone client (host property not supported in this SDK; use apiKey only)
export const pineconeClient = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
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
export async function upsertVectors(indexName: string, vectors: {
  id: string;
  values: number[];
  metadata: Record<string, any>;
}[]) {
  const index = pineconeClient.Index(indexName);
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.upsert(batch);
  }
}

// Helper function to query vectors
export async function queryVectors(indexName: string, queryVector: number[], topK: number = 5) {
  const index = pineconeClient.Index(indexName);
  const results = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });
  return results.matches;
}

// Initialize Pinecone index with correct dimensions
export async function initializePineconeIndex(indexName: string) {
  try {
    const index = pineconeClient.Index(indexName);
    await index.describeIndexStats();
  } catch (error) {
    // If index doesn't exist, create it with correct dimensions
    await pineconeClient.createIndex({
      name: indexName,
      dimension: 1536, // Match text-embedding-3-small dimensions
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });
  }
} 