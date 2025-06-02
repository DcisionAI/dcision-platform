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
  return `Create a small sample optimization dataset that can run on OR-tools (no more than 3 vehicles, 5 locations, and 5 delivery requests) for the following scenario:\n${intentInterpretation}\n\nThe dataset should include:\n- A table of vehicles (fields: id(int), start_location, end_location, capacity, cost_per_km, max_hours)\n- A table of delivery requests (fields: id, location_id, time_window_start, time_window_end, demand)\n- A table of locations (fields: id, name, coordinates)\n- Any relevant constraints or parameters as separate tables or objects.\n\nOutput only the data in JSON format, with each table as an array of objects. Do not include any explanation or markdown, just the JSON.`;
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
    // Validate that locations and tasks include required coordinates and ids
    const okLocations = Array.isArray(cleaned.locations)
      && cleaned.locations.length >= 2
      && cleaned.locations.every((l: any) => typeof l.latitude === 'number' && typeof l.longitude === 'number' && typeof l.name === 'string');
    const okTasks = Array.isArray(cleaned.tasks)
      && cleaned.tasks.length >= 1
      && cleaned.tasks.every((t: any) => typeof t.location === 'number' && (t.demand !== undefined));
    if (!okLocations || !okTasks) {
      // Invalid sample from LLM; fall back to static data
      throw new Error('LLM sample missing required fields');
    }
    return res.status(200).json({ sample: cleaned, source: 'cleaned_llm' });
  } catch (e) {
    // Static fallback: simple VRP dataset with one vehicle and a few tasks/locations
    const staticSample = {
      vehicles: [
        { id: 'V1', start_location: 0, end_location: 0, capacity: 100, cost_per_km: 1.0, max_hours: 8 }
      ],
      // Sample locations around Atlanta, GA
      locations: [
        { id: 0, name: 'Atlanta Depot', coordinates: { lat: 33.7490, lng: -84.3880 } },
        { id: 1, name: 'Midtown Atlanta', coordinates: { lat: 33.7765, lng: -84.3963 } },
        { id: 2, name: 'Buckhead', coordinates: { lat: 33.8599, lng: -84.3730 } },
        { id: 3, name: 'Decatur', coordinates: { lat: 33.7748, lng: -84.2963 } }
      ],
      // Tasks corresponding to each customer location
      tasks: [
        { id: 'T1', location_id: 1, time_window_start: 0, time_window_end: 86400, demand: 10 },
        { id: 'T2', location_id: 2, time_window_start: 0, time_window_end: 86400, demand: 20 },
        { id: 'T3', location_id: 3, time_window_start: 0, time_window_end: 86400, demand: 30 }
      ]
    };
    const fallback = cleanSampleData(staticSample);
    return res.status(200).json({ sample: fallback, source: 'fallback' });
  }
}
