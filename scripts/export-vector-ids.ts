import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';
import fs from 'fs';
import path from 'path';

// TODO: Fill in your actual Pinecone index details below
const INDEX_NAME = 'dcisionai-docs';
const INDEX_HOST = 'https://dcisionai-docs-xbm58wf.svc.aped-4627-b74a.pinecone.io';
const NAMESPACE = '';
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;

const pc = new Pinecone();
const index = pc.index(INDEX_NAME, INDEX_HOST).namespace(NAMESPACE);

async function fetchAllIds() {
  let ids: string[] = [];
  let paginationToken: string | undefined = undefined;

  do {
    const results = await index.listPaginated({ paginationToken });
    const vectors = results.vectors || [];
    ids.push(...vectors.map((v: any) => v.id));
    paginationToken = results.pagination?.next;
  } while (paginationToken);

  return ids;
}

fetchAllIds().then(ids => {
  const outPath = path.join(process.cwd(), 'src/vector-ids.json');
  fs.writeFileSync(outPath, JSON.stringify(ids, null, 2));
  console.log(`Exported ${ids.length} vector IDs to ${outPath}`);
}).catch(err => {
  console.error('Failed to export vector IDs:', err);
  process.exit(1);
}); 