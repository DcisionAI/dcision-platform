import { Pinecone } from '@pinecone-database/pinecone';

const INDEX_NAME = 'dcisionai-construction';

async function recreateIndex() {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY environment variable is required');
  }

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
  });

  try {
    // Delete existing index if it exists
    console.log('Deleting existing index...');
    await pinecone.deleteIndex(INDEX_NAME);
    console.log('Index deleted successfully');
  } catch (error) {
    console.log('No existing index to delete');
  }

  // Create new index with correct dimensions
  console.log('Creating new index...');
  await pinecone.createIndex({
    name: INDEX_NAME,
    dimension: 1536, // Match text-embedding-3-small dimensions
    metric: 'cosine',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-west-2'
      }
    }
  });
  console.log('New index created successfully');
}

recreateIndex().catch(console.error); 