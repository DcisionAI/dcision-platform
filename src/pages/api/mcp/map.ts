import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { MCP as CoreMCP, MCPStatus, ProblemType, IndustryVertical, Protocol } from '@server/mcp/types/core';
import { DataMappingAgent } from '@server/mcp/agents/DataMappingAgent';
import { AgentRunContext, AgentRunResult } from '@server/mcp/agents/AgentRegistry';
import { LLMProviderFactory } from '@server/mcp/agents/llm/providers/LLMProviderFactory';

interface SSEUpdate {
  type: 'progress' | 'complete' | 'error';
  message?: string;
  details?: any;
  output?: any;
  thoughtProcess?: string[];
  error?: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// MCP types
interface MCPContext {
  sessionId: string;
  problemType: ProblemType;
  userInput: string;
}

class MCP implements CoreMCP {
  sessionId: string;
  version: string = '1.0.0';
  status: MCPStatus = 'pending';
  created: string;
  lastModified: string;
  model: {
    variables: any[];
    constraints: any[];
    objective: any;
  };
  context: {
    environment: {
      region: string;
      timezone: string;
      resources?: Record<string, unknown>;
      constraints?: Record<string, unknown>;
      parameters?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    };
    dataset: {
      internalSources: string[];
      externalEnrichment?: string[];
      dataQuality?: 'poor' | 'fair' | 'good' | 'excellent';
      requiredFields?: string[];
      validationRules?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    };
    problemType: ProblemType;
    industry?: IndustryVertical;
    businessRules?: any;
  };
  protocol: Protocol;

  constructor(sessionId: string, problemType: ProblemType, userInput: string) {
    this.sessionId = sessionId;
    this.created = new Date().toISOString();
    this.lastModified = new Date().toISOString();
    this.model = {
      variables: [],
      constraints: [],
      objective: {}
    };
    this.context = {
      environment: {
        region: 'us-east-1',
        timezone: 'UTC',
        resources: {}
      },
      dataset: {
        internalSources: [],
        externalEnrichment: [],
        metadata: {
          userInput,
          problemType
        }
      },
      problemType,
      industry: 'logistics'
    };
    this.protocol = {
      steps: [{
        action: 'map_data',
        description: 'Determine required data schema based on problem type and user requirements.',
        required: true,
        agent: 'DataMappingAgent',
        parameters: {}
      }],
      allowPartialSolutions: false,
      explainabilityEnabled: true,
      humanInTheLoop: {
        required: false,
        approvalSteps: []
      }
    };
  }
}

// Helper function to send SSE
function sendSSE(res: NextApiResponse, data: SSEUpdate) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { sessionId, userInput, intentDetails } = req.body;
    const problemType = intentDetails?.selectedModel || 'vehicle_routing';

    const mcp = new MCP(sessionId, problemType as ProblemType, userInput);

    // Update MCP context with intent details
    mcp.context.dataset.metadata = {
      ...mcp.context.dataset.metadata,
      intentDetails
    };

    // Create LLM provider based on environment configuration
    const providerType = process.env.LLM_PROVIDER || 'anthropic';
    const apiKey = providerType === 'anthropic' 
      ? process.env.ANTHROPIC_API_KEY 
      : process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error(`API key is required for ${providerType} provider`);
    }

    const llmProvider = LLMProviderFactory.createProvider(providerType as 'openai' | 'anthropic', apiKey);
    
    const agent = new DataMappingAgent();
    
    const result = await agent.run({
      action: 'map_data',
      description: 'Determine required data schema based on problem type and user requirements.',
      required: true,
      agent: 'DataMappingAgent',
      parameters: {}
    }, mcp, {
      llm: (prompt: string) => llmProvider.call(prompt),
      onProgress: (update: { type: 'progress' | 'warning' | 'error'; message: string; details?: any }) => {
        console.log(`[${update.type}] ${update.message}`, update.details);
        // Send progress updates via SSE
        sendSSE(res, {
          type: 'progress',
          message: update.message,
          details: update.details
        });
      }
    });

    // Send final result
    sendSSE(res, {
      type: 'complete',
      output: result.output,
      thoughtProcess: Array.isArray(result.thoughtProcess) 
        ? result.thoughtProcess 
        : [result.thoughtProcess]
    });

    // End the response
    res.end();
  } catch (error) {
    console.error('Error in data mapping:', error);
    // Send error via SSE
    sendSSE(res, {
      type: 'error',
      error: 'Failed to process data mapping request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    res.end();
  }
}

// Helper function to get required fields based on problem type
function getRequiredFieldsForProblemType(type: string): string[] {
  switch (type) {
    case 'vehicle_routing':
      return [
        'vehicle_id',
        'vehicle_capacity',
        'location_id',
        'location_coordinates',
        'demand',
        'time_window_start',
        'time_window_end',
        'service_time'
      ];
    case 'job_shop':
      return [
        'job_id',
        'operation_id',
        'machine_id',
        'processing_time',
        'due_date',
        'priority'
      ];
    case 'bin_packing':
      return [
        'item_id',
        'item_size',
        'bin_id',
        'bin_capacity'
      ];
    case 'resource_scheduling':
      return [
        'resource_id',
        'task_id',
        'start_time',
        'end_time',
        'required_skills',
        'priority'
      ];
    case 'fleet_scheduling':
      return [
        'vehicle_id',
        'route_id',
        'departure_time',
        'arrival_time',
        'capacity',
        'distance'
      ];
    case 'project_scheduling':
      return [
        'task_id',
        'duration',
        'dependencies',
        'resources_required',
        'earliest_start',
        'latest_finish'
      ];
    case 'nurse_scheduling':
      return [
        'nurse_id',
        'shift_id',
        'shift_start',
        'shift_end',
        'skills',
        'preferences'
      ];
    case 'production_planning':
      return [
        'product_id',
        'quantity',
        'machine_id',
        'setup_time',
        'production_rate',
        'due_date'
      ];
    default:
      return [];
  }
} 