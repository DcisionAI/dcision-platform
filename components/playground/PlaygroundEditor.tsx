import React, { useEffect, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { MCP } from '../../server/mcp/types';

interface PlaygroundEditorProps {
  config: Partial<MCP>;
  onConfigChange: (config: Partial<MCP>) => void;
}

export default function PlaygroundEditor({ config, onConfigChange }: PlaygroundEditorProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // When config changes externally (e.g., from template selection),
    // clear any previous errors
    setError(null);
  }, [config]);

  const handleEditorChange = (value: string | undefined) => {
    try {
      if (!value) {
        setError('Configuration cannot be empty');
        return;
      }

      const parsedConfig = JSON.parse(value);
      
      // Basic validation
      if (!parsedConfig.model) {
        setError('Configuration must include a model definition');
        return;
      }
      
      if (!parsedConfig.context) {
        setError('Configuration must include a context definition');
        return;
      }
      
      if (!parsedConfig.protocol) {
        setError('Configuration must include a protocol definition');
        return;
      }

      setError(null);
      onConfigChange(parsedConfig);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid JSON configuration');
    }
  };

  const defaultConfig = {
    sessionId: "fleet-vrp-001",
    version: "1.0",
    status: "pending" as const,
    model: {
      variables: [
        { 
          name: "vehicle_capacity", 
          type: "integer" as const, 
          description: "Max load per truck", 
          default: 1000 
        },
        { 
          name: "delivery_location", 
          type: "object" as const, 
          description: "Customer delivery coordinates",
          metadata: {
            properties: {
              lat: "number",
              lng: "number"
            }
          }
        },
        { 
          name: "time_window", 
          type: "datetime" as const, 
          description: "Delivery time slot" 
        },
        { 
          name: "service_time", 
          type: "integer" as const, 
          description: "Time spent at each stop", 
          default: 15 
        }
      ],
      constraints: [
        { 
          type: "capacity_limit", 
          description: "Vehicle cannot exceed capacity", 
          operator: "lte" as const, 
          field: "vehicle_capacity", 
          value: 1000,
          priority: "must" as const
        },
        { 
          type: "time_window", 
          description: "Deliveries must happen within allowed time windows", 
          operator: "between" as const, 
          field: "time_window",
          value: {
            start: "08:00",
            end: "18:00"
          },
          priority: "should" as const
        },
        {
          type: "max_route_duration",
          description: "Maximum route duration per vehicle",
          operator: "lte" as const,
          field: "route_duration",
          value: 480,
          priority: "must" as const
        }
      ],
      objective: {
        type: "minimize" as const,
        field: "total_distance",
        description: "Minimize total fleet distance traveled",
        weight: 1
      }
    },
    context: {
      problemType: "vehicle_routing" as const,
      industry: "logistics" as const,
      environment: {
        region: "New York Metro",
        timezone: "EST"
      },
      dataset: {
        internalSources: ["delivery_db", "fleet_db"],
        externalEnrichment: ["traffic", "weather"]
      }
    },
    protocol: {
      steps: [
        { 
          action: "collect_data" as const, 
          description: "Collect delivery and vehicle data",
          required: true
        },
        { 
          action: "enrich_data" as const, 
          description: "Enrich with traffic and weather data",
          required: true
        },
        { 
          action: "validate_constraints" as const, 
          description: "Validate capacity and time window constraints",
          required: true
        },
        { 
          action: "build_model" as const, 
          description: "Build VRP optimization model",
          required: true
        },
        { 
          action: "solve_model" as const, 
          description: "Solve using OR-Tools engine",
          required: true
        },
        { 
          action: "explain_solution" as const, 
          description: "Generate route explanations",
          required: true
        },
        {
          action: "human_review" as const,
          description: "Review and approve routes",
          required: true
        }
      ],
      allowPartialSolutions: true,
      explainabilityEnabled: true,
      humanInTheLoop: { 
        required: true,
        approvalSteps: ["route_validation", "final_dispatch"]
      }
    },
    created: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };

  return (
    <div className="h-[600px] w-full">
      <MonacoEditor
        height="100%"
        defaultLanguage="json"
        theme="vs-dark"
        value={Object.keys(config).length > 0 ? JSON.stringify(config, null, 2) : JSON.stringify(defaultConfig, null, 2)}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16 },
          wordWrap: 'on'
        }}
      />
      {error && (
        <div className="mt-2 bg-red-900/50 text-white p-2 text-sm rounded">
          {error}
        </div>
      )}
    </div>
  );
} 