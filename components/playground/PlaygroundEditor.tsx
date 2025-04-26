import React, { useEffect, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { MCP } from '../../server/mcp/types/MCPTypes';

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
    "sessionId": "fleet-vrp-001",
    "model": {
      "name": "Fleet VRP Optimizer",
      "version": "1.0.0",
      "description": "Vehicle routing optimization for last-mile delivery",
      "variables": [
        { "name": "vehicle_capacity", "type": "integer", "description": "Max load per truck", "default": 1000 },
        { "name": "delivery_location", "type": "geolocation", "description": "Customer delivery coordinates" },
        { "name": "time_window", "type": "timestamp", "description": "Delivery time slot" },
        { "name": "service_time", "type": "integer", "description": "Time spent at each stop", "default": 15 }
      ],
      "constraints": [
        { 
          "type": "capacity_limit", 
          "description": "Vehicle cannot exceed capacity", 
          "operator": "lte", 
          "field": "vehicle_capacity", 
          "value": 1000 
        },
        { 
          "type": "time_window", 
          "description": "Deliveries must happen within allowed time windows", 
          "operator": "between", 
          "field": "time_window" 
        },
        {
          "type": "max_route_duration",
          "description": "Maximum route duration per vehicle",
          "operator": "lte",
          "field": "route_duration",
          "value": 480
        }
      ],
      "objective": {
        "type": "minimize",
        "field": "total_distance",
        "description": "Minimize total fleet distance traveled",
        "weights": {
          "distance": 0.7,
          "time": 0.3
        }
      }
    },
    "context": {
      "problemType": "vehicle_routing",
      "industry": "logistics",
      "environment": {
        "region": "New York Metro",
        "timezone": "EST",
        "operatingHours": {
          "start": "08:00",
          "end": "18:00"
        }
      },
      "dataset": {
        "internalSources": ["delivery_db", "fleet_db"],
        "externalEnrichment": ["traffic", "weather", "historical_patterns"]
      }
    },
    "protocol": {
      "steps": [
        { 
          "action": "collect_data", 
          "required": true,
          "description": "Collect delivery and vehicle data"
        },
        { 
          "action": "enrich_data", 
          "required": true,
          "description": "Enrich with traffic and weather data"
        },
        { 
          "action": "validate_constraints", 
          "required": true,
          "description": "Validate capacity and time window constraints"
        },
        { 
          "action": "build_model", 
          "required": true,
          "description": "Build VRP optimization model"
        },
        { 
          "action": "solve_model", 
          "required": true,
          "description": "Solve using OR-Tools engine"
        },
        { 
          "action": "explain_solution", 
          "required": true,
          "description": "Generate route explanations"
        },
        {
          "action": "human_review",
          "required": true,
          "description": "Review and approve routes"
        }
      ],
      "allowPartialSolutions": true,
      "explainabilityEnabled": true,
      "humanInTheLoop": { 
        "required": true,
        "approvalSteps": ["route_validation", "final_dispatch"]
      }
    },
    "status": "pending",
    "created": new Date().toISOString(),
    "lastModified": new Date().toISOString()
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