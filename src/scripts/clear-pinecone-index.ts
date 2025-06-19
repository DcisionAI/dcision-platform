import { Pinecone } from '@pinecone-database/pinecone';

const INDEX_NAME = 'dcisionai-construction';

async function clearIndex() {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pinecone.Index(INDEX_NAME);
  await index.deleteAll();
  console.log('All vectors deleted from index:', INDEX_NAME);
}

clearIndex().catch(console.error); 