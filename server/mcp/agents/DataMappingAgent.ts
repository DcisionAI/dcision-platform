import { MCPAgent, AgentRunContext, AgentRunResult, AgentType } from './types';
import { ProtocolStep, MCP } from '../types/core';
import { StepAction } from './types';
import { extractJsonFromMarkdown } from '../utils/markdown';
import { callOpenAI } from './llm/openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

interface FieldMapping {
  databaseField: string;
  requiredField: string;
  confidence: number;
  transformations?: string[];
  rationale?: string;
}

interface SchemaField {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface TableRelationship {
  constraint_name: string;
  table_name: string;
  constraint_type: string;
  referenced_table_name: string;
}

interface MCPContext {
  problemType: string;
  dataset: {
    requiredFields: string[];
    metadata?: {
      databaseFields?: string[];
      intentDetails?: any;
      tablesToScan?: string[];
    };
  };
}

interface PgAttribute {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
}

interface PgConstraint {
  constraint_name: string;
  table_name: string;
  referenced_table_name: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface FieldMatchScore {
  score: number;
  confidence: number;
  rationale: string;
  transformations?: string[];
}

interface FieldRequirement {
  description: string;
  data_type: string;
  importance: string;
  validation?: string[];
  source_table?: string;
  relationships?: string[];
}

interface FieldMatch {
  table: string;
  field: string;
  score: number;
  confidence: number;
  rationale: string;
  transformations?: string[];
}

interface FieldRequirements {
  required_fields: Record<string, FieldRequirement>;
  nice_to_have_fields?: Record<string, FieldRequirement>;
}

export class DataMappingAgent implements MCPAgent {
  name = 'Data Mapping Agent';
  type: AgentType = 'data_collector';
  supportedActions: StepAction[] = ['collect_data'];
  private supabase;

  // Define common tables for vehicle routing
  private readonly VEHICLE_ROUTING_TABLES = [
    'delivery_requests',
    'drivers',
    'locations',
    'orders',
    'order_items',
    'products',
    'vehicles',
    'time_windows'
  ];

  constructor() {
    // Try production environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Fallback to development environment variables
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required Supabase credentials. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment variables.');
    }
    
    this.supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  private async getTableSchema(tableName: string): Promise<SchemaField[]> {
    try {
      console.log(`Fetching schema for table: ${tableName}`);
      
      // Try to get column information using RPC
      const { data: rpcColumns, error: rpcError } = await this.supabase.rpc('get_table_columns', {
        table_name: tableName
      });

      if (!rpcError && rpcColumns?.length > 0) {
        const schemaFields: SchemaField[] = rpcColumns.map((col: ColumnInfo) => ({
          table_name: tableName,
          column_name: col.column_name,
          data_type: col.data_type,
          is_nullable: col.is_nullable
        }));
        console.log(`Successfully fetched schema for ${tableName} using RPC: ${schemaFields.length} columns`);
        return schemaFields;
      }

      // Fallback: Try a direct query to get the table structure
      const { data, error } = await this.supabase
        .from(tableName)
        .select()
        .limit(1);

      if (error) {
        console.error(`Failed to fetch schema for ${tableName}:`, error);
        
        // Try one more time with a describe query
        const { data: describeData, error: describeError } = await this.supabase
          .from(tableName)
          .select()
          .limit(0);

        if (!describeError && describeData) {
          const describeColumns = Object.keys(describeData);
          if (describeColumns.length > 0) {
            const schemaFields: SchemaField[] = describeColumns.map((column: string) => ({
              table_name: tableName,
              column_name: column,
              data_type: 'unknown',
              is_nullable: 'YES'
            }));
            console.log(`Successfully fetched schema for ${tableName} using describe: ${schemaFields.length} columns`);
            return schemaFields;
          }
        }
        
        return [];
      }

      // Get column information from the response
      const tableColumns = data?.length ? Object.keys(data[0]) : [];
      
      // Transform into SchemaField format
      const schemaFields: SchemaField[] = tableColumns.map((column: string) => ({
        table_name: tableName,
        column_name: column,
        data_type: data[0] ? typeof data[0][column] : 'unknown',
        is_nullable: 'YES'
      }));

      console.log(`Successfully fetched schema for ${tableName}: ${schemaFields.length} columns`);
      return schemaFields;
    } catch (error) {
      console.error(`Unexpected error fetching schema for ${tableName}:`, error);
      return []; // Return empty array instead of throwing
    }
  }

  private async getTableRelationships(tables: string[]): Promise<TableRelationship[]> {
    // For now, return an empty array since we can't easily get relationship information
    // We can hardcode known relationships if needed
    return [];
  }

  private isValidTransformation(transformation: string, dataType: string): boolean {
    const typeTransformations: Record<string, string[]> = {
      'text': ['to_lowercase', 'to_uppercase', 'trim', 'substring'],
      'integer': ['round', 'floor', 'ceil', 'abs'],
      'numeric': ['round', 'floor', 'ceil', 'abs'],
      'timestamp': ['to_date', 'to_time', 'extract_year', 'extract_month'],
      'boolean': ['to_boolean', 'not'],
      'jsonb': ['json_extract', 'json_array_elements']
    };

    return typeTransformations[dataType]?.includes(transformation) ?? false;
  }

  private validateMappings(mappings: FieldMapping[], requiredFields: string[], schema: SchemaField[]): string[] {
    const unmappedFields: string[] = [];
    const invalidMappings: string[] = [];

    for (const field of requiredFields) {
      const mapping = mappings.find(m => m.requiredField === field);
      if (!mapping) {
        unmappedFields.push(field);
        continue;
      }

      // Validate database field exists in schema
      const [dbTable, dbColumn] = mapping.databaseField.split('.');
      const dbField = schema.find(f => f.table_name === dbTable && f.column_name === dbColumn);
      
      if (!dbField) {
        invalidMappings.push(`${field} (mapped to non-existent field ${mapping.databaseField})`);
        continue;
      }

      // Validate required field format
      const [reqTable, reqColumn] = field.split('.');
      const reqField = schema.find(f => f.table_name === reqTable && f.column_name === reqColumn);
      
      if (!reqField) {
        invalidMappings.push(`${field} (not found in schema)`);
        continue;
      }

      // Validate transformations if any
      if (mapping.transformations?.some(t => !this.isValidTransformation(t, dbField.data_type))) {
        invalidMappings.push(`${field} (invalid transformation for ${dbField.data_type})`);
      }
    }

    return [...unmappedFields, ...invalidMappings];
  }

  private calculateFieldMatchScore(
    dbField: { name: string; type: string },
    reqField: { name: string; type: string },
    tableName: string
  ): FieldMatchScore {
    let score = 0;
    let confidence = 0;
    const rationale: string[] = [];
    const transformations: string[] = [];

    // 1. Name similarity (40% weight)
    const nameSimilarity = this.calculateNameSimilarity(dbField.name, reqField.name);
    score += nameSimilarity * 0.4;
    if (nameSimilarity > 0.7) {
      rationale.push(`Field names are similar (${(nameSimilarity * 100).toFixed(0)}% match)`);
    }

    // 2. Type compatibility (30% weight)
    const typeCompatibility = this.calculateTypeCompatibility(dbField.type, reqField.type);
    score += typeCompatibility * 0.3;
    if (typeCompatibility < 1) {
      const suggestedTransform = this.suggestTypeTransformation(dbField.type, reqField.type);
      if (suggestedTransform) {
        transformations.push(suggestedTransform);
        rationale.push(`Type conversion needed: ${suggestedTransform}`);
      }
    } else {
      rationale.push('Data types are compatible');
    }

    // 3. Table context relevance (20% weight)
    const tableRelevance = this.calculateTableRelevance(tableName, reqField.name);
    score += tableRelevance * 0.2;
    if (tableRelevance > 0.7) {
      rationale.push(`Field is commonly found in ${tableName} table`);
    }

    // 4. Field usage patterns (10% weight)
    const usagePattern = this.calculateUsagePattern(dbField.name, reqField.name);
    score += usagePattern * 0.1;
    if (usagePattern > 0.7) {
      rationale.push('Field usage pattern matches expected behavior');
    }

    // Calculate confidence based on score and rationale
    confidence = score;
    if (transformations.length > 0) {
      confidence *= 0.9; // Reduce confidence if transformations are needed
    }

    return {
      score,
      confidence,
      rationale: rationale.join('. '),
      transformations: transformations.length > 0 ? transformations : undefined
    };
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    // Convert to lowercase and remove special characters
    const clean1 = name1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const clean2 = name2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Check for exact match
    if (clean1 === clean2) return 1.0;
    
    // Check for substring match
    if (clean1.includes(clean2) || clean2.includes(clean1)) return 0.8;
    
    // Check for common prefixes/suffixes
    const commonPrefix = this.longestCommonPrefix(clean1, clean2);
    const commonSuffix = this.longestCommonSuffix(clean1, clean2);
    if (commonPrefix.length > 3 || commonSuffix.length > 3) return 0.6;
    
    // Check for abbreviations
    if (this.isAbbreviation(clean1, clean2)) return 0.7;
    
    return 0.3; // Default low similarity
  }

  private calculateTypeCompatibility(type1: string, type2: string): number {
    const typeGroups = {
      numeric: ['integer', 'bigint', 'numeric', 'decimal', 'float', 'double'],
      text: ['text', 'varchar', 'char', 'string'],
      temporal: ['timestamp', 'date', 'time', 'datetime'],
      boolean: ['boolean', 'bool'],
      json: ['json', 'jsonb']
    };

    // Exact match
    if (type1 === type2) return 1.0;

    // Check if types are in the same group
    for (const group of Object.values(typeGroups)) {
      if (group.includes(type1) && group.includes(type2)) return 0.8;
    }

    // Check for common conversions
    if (type1 === 'integer' && type2 === 'numeric') return 0.9;
    if (type1 === 'text' && type2 === 'varchar') return 0.9;
    if (type1 === 'timestamp' && type2 === 'date') return 0.9;

    return 0.3; // Default low compatibility
  }

  private calculateTableRelevance(tableName: string, fieldName: string): number {
    const commonFieldsByTable: Record<string, string[]> = {
      'delivery_requests': ['id', 'pickup', 'delivery', 'time_window', 'status', 'priority'],
      'vehicles': ['id', 'capacity', 'weight', 'status', 'type', 'model'],
      'drivers': ['id', 'status', 'name', 'license', 'availability'],
      'locations': ['id', 'address', 'latitude', 'longitude', 'type'],
      'time_windows': ['id', 'start_time', 'end_time', 'day_of_week']
    };

    const commonFields = commonFieldsByTable[tableName] || [];
    if (commonFields.includes(fieldName)) return 1.0;
    
    // Check for similar field names
    const similarFields = commonFields.filter(f => 
      this.calculateNameSimilarity(f, fieldName) > 0.7
    );
    return similarFields.length > 0 ? 0.8 : 0.3;
  }

  private calculateUsagePattern(field1: string, field2: string): number {
    const commonPatterns: Record<string, string[]> = {
      'id': ['id', 'uuid', 'reference', 'key'],
      'status': ['status', 'state', 'condition'],
      'time': ['time', 'date', 'timestamp', 'datetime'],
      'location': ['location', 'address', 'place', 'point'],
      'capacity': ['capacity', 'volume', 'size', 'limit']
    };

    for (const [pattern, variations] of Object.entries(commonPatterns)) {
      if (variations.includes(field1) && variations.includes(field2)) return 1.0;
      if (variations.includes(field1) || variations.includes(field2)) return 0.7;
    }

    return 0.3;
  }

  private suggestTypeTransformation(fromType: string, toType: string): string | null {
    const transformations: Record<string, Record<string, string>> = {
      'integer': {
        'numeric': 'cast_to_numeric',
        'text': 'to_char',
        'boolean': 'to_boolean'
      },
      'text': {
        'integer': 'to_integer',
        'numeric': 'to_numeric',
        'timestamp': 'to_timestamp',
        'date': 'to_date'
      },
      'timestamp': {
        'date': 'to_date',
        'text': 'to_char'
      }
    };

    return transformations[fromType]?.[toType] || null;
  }

  private longestCommonPrefix(str1: string, str2: string): string {
    let prefix = '';
    const minLength = Math.min(str1.length, str2.length);
    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) {
        prefix += str1[i];
      } else {
        break;
      }
    }
    return prefix;
  }

  private longestCommonSuffix(str1: string, str2: string): string {
    return this.longestCommonPrefix(
      str1.split('').reverse().join(''),
      str2.split('').reverse().join('')
    ).split('').reverse().join('');
  }

  private isAbbreviation(str1: string, str2: string): boolean {
    const shorter = str1.length < str2.length ? str1 : str2;
    const longer = str1.length < str2.length ? str2 : str1;
    
    // Check if shorter is an abbreviation of longer
    const regex = new RegExp('^' + shorter.split('').join('.*') + '$');
    return regex.test(longer);
  }

  private formatMappingResponse(mappingResult: any, fieldRequirements: any, heuristicAnalysis: any): string {
    const sections: string[] = [];

    // 1. Required Fields Section
    sections.push('Required Fields:');
    Object.entries(fieldRequirements.required_fields).forEach(([field, details]: [string, any]) => {
      sections.push(`• ${field}`);
      sections.push(`  - ${details.description}`);
    });
    sections.push('');

    // 2. Optional Fields Section
    if (fieldRequirements.nice_to_have_fields && Object.keys(fieldRequirements.nice_to_have_fields).length > 0) {
      sections.push('Optional Fields:');
      Object.entries(fieldRequirements.nice_to_have_fields).forEach(([field, details]: [string, any]) => {
        sections.push(`• ${field}`);
        sections.push(`  - ${details.description}`);
        if (details.benefits) {
          sections.push(`  - Benefits: ${details.benefits.join(', ')}`);
        }
      });
      sections.push('');
    }

    // 3. Successfully Mapped Fields Section
    sections.push('Successfully Mapped Fields:');
    if (mappingResult.mappings && mappingResult.mappings.length > 0) {
      mappingResult.mappings.forEach((mapping: any) => {
        const confidence = (mapping.confidence * 100).toFixed(0);
        const heuristicScore = mapping.heuristicScore ? (mapping.heuristicScore.score * 100).toFixed(0) : 'N/A';
        sections.push(`• ${mapping.requiredField} → ${mapping.databaseField} (${confidence}% confidence)`);
        if (mapping.transformations && mapping.transformations.length > 0) {
          sections.push(`  - Transformations: ${mapping.transformations.join(', ')}`);
        }
        sections.push(`  - Heuristic Score: ${heuristicScore}%`);
        sections.push(`  - Rationale: ${mapping.rationale}`);
      });
    } else {
      sections.push('No fields have been successfully mapped yet.');
    }
    sections.push('');

    // 4. Unmapped Fields Section
    if (mappingResult.unmappedFields && mappingResult.unmappedFields.length > 0) {
      sections.push('Fields Needing Attention:');
      mappingResult.unmappedFields.forEach((field: string) => {
        sections.push(`• ${field}`);
      });
      sections.push('');
    }

    // 5. Suggested Actions Section
    if (mappingResult.suggestedActions && mappingResult.suggestedActions.length > 0) {
      sections.push('Suggested Actions:');
      mappingResult.suggestedActions.forEach((action: string) => {
        sections.push(`• ${action}`);
      });
      sections.push('');
    }

    // 6. Summary Section
    sections.push('✅ Data Mapping Complete');
    sections.push('');
    sections.push('Summary:');
    sections.push(`• ${mappingResult.mappings?.length || 0} fields successfully mapped`);
    sections.push(`• ${mappingResult.unmappedFields?.length || 0} fields need attention`);
    sections.push(`• ${Object.keys(fieldRequirements.required_fields).length} total required fields identified`);
    sections.push('');

    // 7. Detailed Field Requirements Section
    sections.push('Detailed Field Requirements:');
    sections.push('');
    sections.push('required_fields:');
    Object.entries(fieldRequirements.required_fields).forEach(([field, details]: [string, any]) => {
      sections.push(`• ${field}:`);
      sections.push(`  - Purpose: ${details.description}`);
      sections.push(`  - Type: ${details.data_type}`);
      sections.push(`  - Required: ${details.importance === 'high' ? 'Yes' : 'No'}`);
      if (details.validation) {
        sections.push(`  - Validation: ${details.validation.join(', ')}`);
      }
    });
    sections.push('');

    if (fieldRequirements.nice_to_have_fields) {
      sections.push('nice_to_have_fields:');
      Object.entries(fieldRequirements.nice_to_have_fields).forEach(([field, details]: [string, any]) => {
        sections.push(`• ${field}:`);
        sections.push(`  - Purpose: ${details.description}`);
        sections.push(`  - Type: ${details.data_type}`);
        sections.push(`  - Required: No`);
      });
      sections.push('');
    }

    // 8. Heuristic Analysis Section
    sections.push('Heuristic Analysis:');
    sections.push(`• High Confidence (≥90%): ${heuristicAnalysis.fieldPatterns.confidenceDistribution.high}`);
    sections.push(`• Medium Confidence (70-89%): ${heuristicAnalysis.fieldPatterns.confidenceDistribution.medium}`);
    sections.push(`• Low Confidence (<70%): ${heuristicAnalysis.fieldPatterns.confidenceDistribution.low}`);
    sections.push('');

    // 9. Field Patterns Section
    if (heuristicAnalysis.fieldPatterns.commonPatterns.length > 0) {
      sections.push('Common Field Patterns:');
      heuristicAnalysis.fieldPatterns.commonPatterns.forEach((pattern: string) => {
        sections.push(`• ${pattern}`);
      });
      sections.push('');
    }

    return sections.join('\n');
  }

  async run(step: ProtocolStep, mcp: MCP, context?: AgentRunContext): Promise<AgentRunResult> {
    const thoughtProcess: string[] = [];

    if (!mcp.context) {
      throw new Error('MCP context is required for data mapping');
    }

    const mcpContext = mcp.context as MCPContext;

    try {
      // Log initial state
      thoughtProcess.push('Starting data mapping process...');
      thoughtProcess.push(`Problem Type: ${mcpContext.problemType}`);
      thoughtProcess.push(`Required Fields: ${JSON.stringify(mcpContext.dataset?.requiredFields || [])}`);
      thoughtProcess.push(`Customer Fields: ${JSON.stringify(mcpContext.dataset?.metadata?.databaseFields || [])}`);

      // Determine which tables to scan
      const tablesToScan = mcpContext.dataset?.metadata?.tablesToScan || this.VEHICLE_ROUTING_TABLES;
      thoughtProcess.push(`Scanning tables: ${tablesToScan.join(', ')}`);

      // Get schema for each table
      thoughtProcess.push('Fetching table schemas...');
      const tableSchemas: Record<string, SchemaField[]> = {};
      let hasAnySchema = false;
      
      for (const table of tablesToScan) {
        try {
          const schema = await this.getTableSchema(table);
          if (schema.length === 0) {
            thoughtProcess.push(`Warning: No schema found for table ${table}`);
            continue;
          }
          tableSchemas[table] = schema;
          thoughtProcess.push(`Retrieved schema for ${table}: ${schema.length} columns`);
          hasAnySchema = true;
        } catch (error) {
          thoughtProcess.push(`Error fetching schema for ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          continue;
        }
      }

      if (!hasAnySchema) {
        throw new Error('No valid table schemas were retrieved. Please check if the tables exist and you have proper permissions.');
      }

      // Get relationships between specified tables
      thoughtProcess.push('Fetching table relationships...');
      const relationships = await this.getTableRelationships(tablesToScan);
      thoughtProcess.push(`Relationships retrieved: ${relationships.length} relationships found`);

      // Group fields by table
      const tableFields = Object.entries(tableSchemas).reduce((acc, [tableName, columns]) => {
        acc[tableName] = columns.map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES'
        }));
        return acc;
      }, {} as Record<string, any[]>);

      // Step 1: Acknowledge problem type and analyze requirements
      thoughtProcess.push(`Problem Type Analysis:\nIdentified problem type: ${mcpContext.problemType}`);
      if (mcpContext.dataset?.metadata?.intentDetails) {
        thoughtProcess.push(`Intent Details:\n${JSON.stringify(mcpContext.dataset.metadata.intentDetails, null, 2)}`);
      }
      thoughtProcess.push(`Required Fields: ${(mcpContext.dataset?.requiredFields || []).join(', ')}`);
      thoughtProcess.push(`Available Customer Fields: ${(mcpContext.dataset?.metadata?.databaseFields || []).join(', ')}`);
      thoughtProcess.push(`Database Schema: ${JSON.stringify(tableFields, null, 2)}`);

      // Step 2: Analyze field requirements with schema awareness
      const fieldRequirementsPrompt = `You are a JSON-only response API for field requirements analysis.

CONTEXT:
Problem Type: ${mcpContext.problemType}
${mcpContext.dataset?.metadata?.intentDetails ? `Intent Analysis: ${JSON.stringify(mcpContext.dataset.metadata.intentDetails, null, 2)}` : ''}
User's Fields: ${(mcpContext.dataset?.metadata?.databaseFields || []).join(', ')}
Database Schema: ${JSON.stringify(tableFields, null, 2)}
Table Relationships: ${JSON.stringify(relationships, null, 2)}

TASK:
Analyze and determine the required fields for this ${mcpContext.problemType} optimization problem, considering the available database schema and relationships.
${(mcpContext.dataset?.requiredFields || []).length > 0 ? `Required fields specified: ${(mcpContext.dataset?.requiredFields || []).join(', ')}` : 'No required fields specified - please suggest appropriate fields based on the problem type, intent, and database schema.'}

RESPONSE FORMAT:
You must respond with ONLY a JSON object in the following format, and nothing else - no explanations, no conversation:
{
  "required_fields": {
    "table_name.field_name": {
      "description": "field description",
      "data_type": "string|number|boolean|array|object",
      "importance": "high|medium|low",
      "validation": ["rule1", "rule2"],
      "source_table": "table_name",
      "relationships": ["related_table1", "related_table2"]
    }
  },
  "nice_to_have_fields": {
    "table_name.field_name": {
      "description": "field description",
      "data_type": "string|number|boolean|array|object",
      "benefits": ["benefit1", "benefit2"],
      "source_table": "table_name"
    }
  }
}`;

      let fieldRequirements;
      try {
        const { enrichedData, reasoning } = context?.llm 
          ? await context.llm.enrichData({ prompt: fieldRequirementsPrompt }, { problemType: mcpContext.problemType })
          : { enrichedData: await callOpenAI(fieldRequirementsPrompt), reasoning: '' };
        
        const cleanJson = extractJsonFromMarkdown(enrichedData.trim());
        try {
          fieldRequirements = JSON.parse(cleanJson);
        } catch (parseError) {
          thoughtProcess.push(`Failed to parse field requirements response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
          throw new Error(`Invalid JSON response from LLM: ${cleanJson}`);
        }

        thoughtProcess.push('Field Requirements Analysis:', JSON.stringify(fieldRequirements, null, 2));
        if (reasoning) {
          thoughtProcess.push('Reasoning:', reasoning);
        }
      } catch (error) {
        thoughtProcess.push(`Failed to analyze field requirements: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }

      // Step 3: Map database fields to required schema
      const mappingPrompt = `You are a JSON-only response API for field mapping.

CONTEXT:
Problem Type: ${mcpContext.problemType}
Database Schema: ${JSON.stringify(tableFields, null, 2)}
Table Relationships: ${JSON.stringify(relationships, null, 2)}
${mcpContext.dataset?.metadata?.intentDetails ? `Intent Analysis: ${JSON.stringify(mcpContext.dataset.metadata.intentDetails, null, 2)}` : ''}

TASK:
Map existing database fields to required schema fields for a ${mcpContext.problemType} optimization model, considering the actual database structure and relationships.

AVAILABLE FIELDS:
Database fields by table:
${Object.entries(tableFields).map(([table, fields]) => 
  `${table}:\n${fields.map(f => `- ${f.name} (${f.type})`).join('\n')}`
).join('\n\n')}

Required fields and specifications:
${JSON.stringify(fieldRequirements.required_fields, null, 2)}

Nice to have fields:
${JSON.stringify(fieldRequirements.nice_to_have_fields, null, 2)}

RESPONSE FORMAT:
You must respond with ONLY a JSON object in the following format, and nothing else - no explanations, no conversation:
{
  "mappings": [
    {
      "databaseField": "table_name.field_name",
      "requiredField": "table_name.field_name",
      "confidence": 0.95,
      "transformations": ["transformation1", "transformation2"],
      "rationale": "brief explanation of mapping choice"
    }
  ],
  "unmapped_fields": ["table_name.field1", "table_name.field2"],
  "suggested_actions": [
    "Review unmapped fields and provide manual mappings if needed",
    "Verify data type compatibility for all mappings",
    "Consider adding missing fields to the database schema"
  ]
}

EXAMPLE RESPONSE:
{
  "mappings": [
    {
      "databaseField": "delivery_requests.pickup_location_id",
      "requiredField": "delivery_requests.pickup_location_id",
      "confidence": 0.95,
      "rationale": "Exact field match in delivery_requests table"
    },
    {
      "databaseField": "delivery_requests.delivery_location_id",
      "requiredField": "delivery_requests.delivery_location_id",
      "confidence": 0.95,
      "rationale": "Exact field match in delivery_requests table"
    }
  ],
  "unmapped_fields": [],
  "suggested_actions": ["Verify relationships between location IDs and locations table"]
}`;

      let mappingResult;
      try {
        const { enrichedData, reasoning } = context?.llm
          ? await context.llm.enrichData({ prompt: mappingPrompt }, { problemType: mcpContext.problemType })
          : { enrichedData: await callOpenAI(mappingPrompt), reasoning: '' };
        
        const cleanJson = extractJsonFromMarkdown(enrichedData.trim());
        try {
          mappingResult = JSON.parse(cleanJson);
          
          // Ensure proper structure
          mappingResult = {
            mappings: mappingResult.mappings?.map((m: any) => ({
              databaseField: m.databaseField || '',
              requiredField: m.requiredField || '',
              confidence: m.confidence || 0,
              transformations: m.transformations || [],
              rationale: m.rationale || ''
            })) || [],
            unmapped_fields: mappingResult.unmapped_fields || [],
            suggested_actions: mappingResult.suggested_actions || []
          };
        } catch (parseError) {
          thoughtProcess.push(`Failed to parse mapping response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
          throw new Error(`Invalid JSON response from LLM: ${cleanJson}`);
        }

        thoughtProcess.push('Field Mapping Analysis:', JSON.stringify(mappingResult, null, 2));
        if (reasoning) {
          thoughtProcess.push('Reasoning:', reasoning);
        }

        // Validate the mappings
        const unmappedFields = this.validateMappings(
          mappingResult.mappings,
          Object.keys(fieldRequirements.required_fields),
          Object.values(tableSchemas).flat()
        );

        // Add any fields that weren't mapped to the unmapped_fields array
        mappingResult.unmapped_fields = Array.from(new Set([
          ...mappingResult.unmapped_fields,
          ...unmappedFields
        ]));

        return {
          output: {
            success: true,
            fieldRequirements,
            mappings: mappingResult.mappings.map((m: FieldMapping) => {
              const [dbTable, dbField] = (m.databaseField || '').split('.');
              const [reqTable, reqField] = (m.requiredField || '').split('.');
              const dbFieldInfo = tableFields[dbTable]?.find(f => f.name === dbField);
              const reqFieldInfo = fieldRequirements.required_fields[m.requiredField];
              
              const heuristicScore = this.calculateFieldMatchScore(
                { name: dbField || '', type: dbFieldInfo?.type || 'unknown' },
                { name: reqField || '', type: reqFieldInfo?.data_type || 'unknown' },
                dbTable || ''
              );

              return {
                databaseField: m.databaseField || '',
                requiredField: m.requiredField || '',
                confidence: m.confidence || 0,
                transformations: m.transformations || [],
                rationale: m.rationale || heuristicScore.rationale || '',
                heuristicScore: {
                  score: heuristicScore.score,
                  confidence: heuristicScore.confidence,
                  rationale: heuristicScore.rationale,
                  transformations: heuristicScore.transformations || []
                }
              };
            }),
            unmappedFields: mappingResult.unmapped_fields,
            suggestedActions: mappingResult.suggested_actions,
            needsHumanReview: mappingResult.unmapped_fields.length > 0 || mappingResult.mappings.some((m: FieldMapping) => m.confidence < 0.8),
            heuristicAnalysis: this.analyzeFieldPatterns(mappingResult.mappings, tableFields)
          },
          thoughtProcess: thoughtProcess.join('\n')
        };
      } catch (error) {
        thoughtProcess.push(`Failed to process field mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      thoughtProcess.push(`Error: ${errorMessage}`);
      return {
        output: {
          success: false,
          error: 'Failed to process data mapping request',
          errorDetails: errorMessage,
          progress: thoughtProcess,
          warnings: [],
          mappings: {},
          fieldRequirements: {},
          unmappedFields: []
        },
        thoughtProcess: thoughtProcess.join('\n')
      };
    }
  }

  private analyzeFieldPatterns(mappings: FieldMapping[], tableFields: Record<string, any[]>): {
    commonPatterns: string[];
    suggestedImprovements: string[];
    confidenceDistribution: Record<string, number>;
  } {
    const patterns: Record<string, number> = {};
    const confidenceLevels: Record<string, number> = {
      'high': 0,
      'medium': 0,
      'low': 0
    };

    mappings.forEach(mapping => {
      // Analyze naming patterns
      const dbField = mapping.databaseField.split('.')[1];
      const reqField = mapping.requiredField.split('.')[1];
      const pattern = this.identifyNamingPattern(dbField, reqField);
      patterns[pattern] = (patterns[pattern] || 0) + 1;

      // Track confidence distribution
      if (mapping.confidence >= 0.9) confidenceLevels.high++;
      else if (mapping.confidence >= 0.7) confidenceLevels.medium++;
      else confidenceLevels.low++;
    });

    const suggestions: string[] = [];
    if (confidenceLevels.low > 0) {
      suggestions.push(`Consider reviewing ${confidenceLevels.low} low-confidence mappings for potential improvements`);
    }
    if (Object.keys(patterns).length > 1) {
      suggestions.push(`Multiple naming patterns detected: ${Object.keys(patterns).join(', ')}`);
    }

    return {
      commonPatterns: Object.entries(patterns)
        .sort((a, b) => b[1] - a[1])
        .map(([pattern, count]) => `${pattern} (${count} occurrences)`),
      suggestedImprovements: suggestions,
      confidenceDistribution: confidenceLevels
    };
  }

  private identifyNamingPattern(field1: string, field2: string): string {
    if (field1.toLowerCase() === field2.toLowerCase()) return 'exact_match';
    if (field1.toLowerCase().includes(field2.toLowerCase()) || field2.toLowerCase().includes(field1.toLowerCase())) return 'substring_match';
    if (this.isAbbreviation(field1, field2)) return 'abbreviation';
    if (this.longestCommonPrefix(field1, field2).length > 3) return 'common_prefix';
    if (this.longestCommonSuffix(field1, field2).length > 3) return 'common_suffix';
    return 'custom_pattern';
  }
}