import { getLLMAnswer } from './llm';
import { jsonrepair } from 'jsonrepair';

function regexExtractArray(jsonStr: string, key: string): any[] {
  // Try to extract an array for a given key using regex
  const match = jsonStr.match(new RegExp(`"${key}"\s*:\s*(\[[^\]]*\])`, 's'));
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.warn(`Failed to parse extracted array for ${key}:`, e);
      return [];
    }
  }
  return [];
}

function cleanAndParseJSON(text: string): any {
  // 1. Try direct parse
  try {
    return JSON.parse(text);
  } catch (e) {
    // 2. Try jsonrepair
    try {
      const repaired = jsonrepair(text);
      return JSON.parse(repaired);
    } catch (repairErr) {
      // 3. Try to extract JSON object and clean
      try {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) {
          throw new Error('No JSON object found in response');
        }
        let jsonStr = text.slice(firstBrace, lastBrace + 1);
        // Log the problematic JSON for debugging
        console.log('Attempting to clean JSON:', jsonStr);
        // Clean up common JSON issues (no single-quote replacement)
        jsonStr = jsonStr
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')
          // Remove any non-JSON text before or after the object
          .replace(/^[^{]*/, '')
          .replace(/[^}]*$/, '')
          // Fix array-specific issues
          .replace(/\[\s*,/g, '[')
          .replace(/,\s*\]/g, ']')
          .replace(/,\s*,/g, ',')
          // Ensure arrays are properly formatted
          .replace(/\[\s*\]/g, '[]')
          .replace(/\[\s*{/g, '[{')
          .replace(/}\s*\]/g, '}]');
        // Log the cleaned JSON for debugging
        console.log('Cleaned JSON:', jsonStr);
        try {
          return JSON.parse(jsonStr);
        } catch (parseError) {
          // 4. Fallback: extract arrays for entities and relationships
          const entities = regexExtractArray(jsonStr, 'entities');
          const relationships = regexExtractArray(jsonStr, 'relationships');
          if (entities.length > 0 || relationships.length > 0) {
            return { entities, relationships };
          }
          throw parseError;
        }
      } catch (finalErr) {
        console.error('Failed to parse JSON after all cleaning attempts:', finalErr);
        return { entities: [], relationships: [] };
      }
    }
  }
}

export async function extractEntitiesAndRelations(
  text: string,
  options?: { domain?: string; externalEntities?: string[] }
): Promise<{ entities: any[]; relationships: any[] }> {
  const domain = options?.domain || 'construction';
  const externalEntities = options?.externalEntities || [];
  const externalEntitiesStr = externalEntities.length > 0
    ? `\nYou should also identify and link to relevant external entities such as: ${externalEntities.join(', ')}.`
    : '';

  const prompt = `
You are an expert information extraction agent for the domain: ${domain}.
Extract all relevant entities (people, organizations, projects, concepts, regulations, weather events, etc.) and relationships from the following text. Return as JSON with "entities" and "relationships" arrays.${externalEntitiesStr}

For each entity, include its type (e.g., person, organization, regulation, weather, etc.) and a brief description if possible.
For each relationship, specify the source and target entities, the type of relationship, and a description.

IMPORTANT: Your response must be valid JSON. Do not include any text before or after the JSON object.
The response should be in this exact format:
{
  "entities": [
    {
      "id": "unique_id",
      "name": "entity_name",
      "type": "entity_type",
      "description": "brief description"
    }
  ],
  "relationships": [
    {
      "source": "source_entity_id",
      "target": "target_entity_id",
      "type": "relationship_type",
      "description": "brief description"
    }
  ]
}

Text:
"""
${text}
"""
`;
  try {
    const response = await getLLMAnswer(prompt, '');
    const json = cleanAndParseJSON(response);
    // Validate the structure
    if (!Array.isArray(json.entities)) {
      console.warn('Invalid entities array in response:', json);
      json.entities = [];
    }
    if (!Array.isArray(json.relationships)) {
      console.warn('Invalid relationships array in response:', json);
      json.relationships = [];
    }
    // Ensure each entity has required fields
    json.entities = json.entities.map((entity: any, index: number) => ({
      id: entity.id || `entity_${index}`,
      name: entity.name || 'Unknown',
      type: entity.type || 'unknown',
      description: entity.description || ''
    }));
    // Ensure each relationship has required fields
    json.relationships = json.relationships.map((rel: any, index: number) => ({
      source: rel.source || `entity_${index}`,
      target: rel.target || `entity_${index + 1}`,
      type: rel.type || 'related_to',
      description: rel.description || ''
    }));
    return {
      entities: json.entities || [],
      relationships: json.relationships || []
    };
  } catch (err) {
    console.error('Entity extraction error:', err);
    return { entities: [], relationships: [] };
  }
} 