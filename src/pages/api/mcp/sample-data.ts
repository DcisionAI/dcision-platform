import type { NextApiRequest, NextApiResponse } from 'next';
import { LLMServiceFactory } from '../../../../server/mcp/services/llm/LLMServiceFactory';
// import faker if available, otherwise use Math.random
// import { faker } from '@faker-js/faker';

function inferType(variable: any) {
  if (variable.type) return variable.type;
  if (variable.domain) {
    const domain = variable.domain.toLowerCase();
    if (domain.includes('binary')) return 'integer';
    if (domain.includes('integer')) return 'integer';
    if (domain.includes('number') || domain.includes('continuous')) return 'number';
    if (domain.includes('string')) return 'string';
    if (domain.includes('date') || domain.includes('time')) return 'datetime';
    if (domain.includes('object')) return 'object';
  }
  return 'string'; // default fallback
}

function generateSampleValue(variable: any) {
  const type = inferType(variable);
  const domain = variable.domain ? variable.domain.toLowerCase() : '';
  switch (type) {
    case 'integer':
      // Handle binary domain
      if (domain.includes('binary')) return Math.round(Math.random());
      // Handle integer range if specified (e.g., Integer [0, 10])
      const intMatch = domain.match(/\[(\d+),\s*(\d+)\]/);
      if (intMatch) {
        const min = parseInt(intMatch[1], 10);
        const max = parseInt(intMatch[2], 10);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      return Math.floor(Math.random() * 1000);
    case 'number':
      // Handle continuous range if specified
      const numMatch = domain.match(/\[(\d+\.?\d*),\s*(\d+\.?\d*)\]/);
      if (numMatch) {
        const min = parseFloat(numMatch[1]);
        const max = parseFloat(numMatch[2]);
        return Math.random() * (max - min) + min;
      }
      return Math.random() * 1000;
    case 'string':
      // If domain specifies possible values, pick one
      const enumMatch = domain.match(/\{([^}]+)\}/);
      if (enumMatch) {
        const options = enumMatch[1].split(',').map((s: string) => s.trim());
        return options[Math.floor(Math.random() * options.length)];
      }
      return 'sample_' + variable.name;
    case 'datetime':
      return new Date().toISOString();
    case 'object':
      if (variable.metadata && variable.metadata.properties) {
        const obj: any = {};
        for (const key in variable.metadata.properties) {
          obj[key] = Math.random();
        }
        return obj;
      }
      return {};
    default:
      // For unknown types, return a string with the domain for debugging
      return 'sample_' + variable.name + (domain ? ` (${domain})` : '');
  }
}

function buildLLMSamplePrompt(intentInterpretation: string) {
  return `Create a realistic sample optimization dataset for the following scenario:\n${intentInterpretation}\n\nThe dataset should include:\n- A table of vehicles (fields: id, capacity, cost, etc.)\n- A table of delivery requests (fields: id, location, time window, demand, etc.)\n- A table of locations (fields: id, name, coordinates, etc.)\n- Any relevant constraints or parameters as separate tables or objects.\n\nOutput only the data in JSON format, with each table as an array of objects. Do not include any explanation or markdown, just the JSON.`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { intentInterpretation } = req.body;
  if (!intentInterpretation || typeof intentInterpretation !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid intentInterpretation' });
  }
  // Try LLM first
  try {
    const llm = LLMServiceFactory.getInstance();
    const prompt = buildLLMSamplePrompt(intentInterpretation);
    const response = await (llm as any).callLLM(prompt);
    // Try to parse JSON or extract markdown tables
    let sample = response.content;
    try {
      sample = JSON.parse(response.content);
    } catch (e) {
      // Try to extract JSON from markdown/code block
      const match = response.content.match(/\{[\s\S]*\}/);
      if (match) {
        sample = JSON.parse(match[0]);
      }
      // Otherwise, just return the raw content (could be markdown tables)
    }
    return res.status(200).json({ sample, source: 'llm' });
  } catch (e) {
    // fallback: return a simple example dataset
    const sample = {
      message: 'LLM unavailable. Please provide a sample dataset based on your scenario.'
    };
    return res.status(200).json({ sample, source: 'fallback' });
  }
} 