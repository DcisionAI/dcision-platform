export function getPineconeIndex() {
  const { Pinecone } = require('@pinecone-database/pinecone');
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
  return pinecone.Index(
    process.env.PINECONE_INDEX!,
    process.env.PINECONE_ENVIRONMENT!
  );
} 