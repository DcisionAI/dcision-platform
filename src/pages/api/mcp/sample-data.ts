import type { NextApiRequest, NextApiResponse } from 'next';
import { LLMServiceFactory } from '../../../../server/mcp/services/llm/LLMServiceFactory';

function fixId(id: string | number) {
  if (typeof id === 'string') {
    const num = parseInt(id.replace(/\D/g, ''), 10);
    return isNaN(num) ? id : num;
  }
  return id;
}

function cleanSampleData(sample: any): any {
  for (const v of sample?.vehicles || []) {
    v.id = fixId(v.id);
    v.type ??= 'van';
    v.operating_cost ??= 0;
    v.maintenance_interval ??= 1000;
    v.fuel_efficiency ??= 10;
  }

  for (const t of sample?.tasks || []) {
    t.id = fixId(t.id);
    t.duration ??= 60;
    t.priority ??= 1;
    t.required_skills ??= [];
    t.time_window ??= {
      start: t.time_window_start,
      end: t.time_window_end,
    };
    t.location ??= t.location_id;
  }

  for (const l of sample?.locations || []) {
    l.id = fixId(l.id);
    if (l.coordinates) {
      l.latitude ??= l.coordinates.lat;
      l.longitude ??= l.coordinates.lng;
    }
  }

  return sample;
}

function buildLLMSamplePrompt(intentInterpretation: string) {
  return `Create a realistic sample optimization dataset for the following scenario:\n${intentInterpretation}\n\nThe dataset should include:\n- A table of vehicles (fields: id(int), capacity, cost, etc.)\n- A table of delivery requests (fields: id, location, time window, demand, etc.)\n- A table of locations (fields: id, name, coordinates, etc.)\n- Any relevant constraints or parameters as separate tables or objects.\n\nOutput only the data in JSON format, with each table as an array of objects. Do not include any explanation or markdown, just the JSON.`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { intentInterpretation } = req.body;
  if (!intentInterpretation || typeof intentInterpretation !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid intentInterpretation' });
  }

  try {
    const llm = LLMServiceFactory.getInstance();
    const prompt = buildLLMSamplePrompt(intentInterpretation);
    const response = await (llm as any).callLLM(prompt);

    let sample = response.content;
    try {
      sample = JSON.parse(response.content);
    } catch (e) {
      const match = response.content.match(/\{[\s\S]*\}/);
      if (match) {
        sample = JSON.parse(match[0]);
      }
    }

    const cleaned = cleanSampleData(sample);
    return res.status(200).json({ sample: cleaned, source: 'cleaned_llm' });
  } catch (e) {
    const fallback = cleanSampleData({
      vehicles: [
        { id: 'V01', capacity: 1000, cost_per_km: 1.2, max_hours: 8 }
      ],
      tasks: [
        {
          id: 'DR01',
          location_id: 'L01',
          time_window_start: '2025-05-17T08:00:00Z',
          time_window_end: '2025-05-17T12:00:00Z',
          demand: 200
        }
      ],
      locations: [
        {
          id: 'L01',
          name: 'Atlanta Warehouse',
          coordinates: { lat: 33.7490, lng: -84.3880 }
        }
      ]
    });
    return res.status(200).json({ sample: fallback, source: 'fallback' });
  }
}
