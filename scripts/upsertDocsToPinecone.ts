import 'dotenv/config';
import { getPineconeIndex } from '../lib/pinecone';
import { getEmbedding } from '../lib/openai-embedding';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

async function getAllMarkdownFiles(dir: string): Promise<string[]> {
  let files: string[] = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await getAllMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function chunkMarkdownBySection(content: string): { header: string, body: string }[] {
  const lines = content.split('\n');
  const sections: { header: string, body: string }[] = [];
  let currentHeader = '';
  let currentBody: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headerMatch) {
      if (currentHeader || currentBody.length) {
        sections.push({ header: currentHeader, body: currentBody.join('\n').trim() });
      }
      currentHeader = line;
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  if (currentHeader || currentBody.length) {
    sections.push({ header: currentHeader, body: currentBody.join('\n').trim() });
  }
  return sections.filter(s => s.header || s.body);
}

async function main() {
  const pineconeIndex = getPineconeIndex();
  const namespace = '';
  const nsIndex = pineconeIndex.namespace(namespace);

  // Delete all vectors in the namespace before upserting
  await nsIndex.deleteAll();

  const docsDir = path.resolve(process.cwd(), 'docs');
  const files = await getAllMarkdownFiles(docsDir);
  for (const file of files) {
    const raw = await fs.promises.readFile(file, 'utf-8');
    const { content } = matter(raw);
    const sections = chunkMarkdownBySection(content);
    for (const section of sections) {
      const chunkText = [section.header, section.body].filter(Boolean).join('\n\n').slice(0, 2000);
      if (chunkText.trim().length > 0) {
        const embedding = await getEmbedding(chunkText.slice(0, 1000));
        await nsIndex.upsert([
          {
            id: `${path.relative(docsDir, file)}:${Buffer.from(section.header).toString('base64').slice(0, 8)}`,
            values: embedding,
            metadata: { file: path.relative(docsDir, file), content: chunkText.slice(0, 200) }
          }
        ]);
      }
    }
  }
  console.log('Upserted all doc sections to Pinecone!');
}
main(); 