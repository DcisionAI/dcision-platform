import React from 'react';
import { MCP } from '../../server/mcp/types/MCPTypes';

interface MCPExamplesProps {
  onSelectExample: (example: MCP) => void;
}

const examples: MCP[] = [
  {
    "sessionId": "fleet-vrp-001",
    "model": {
      "variables": [
        { "name": "vehicle_capacity", "type": "integer", "description": "Max load per truck", "default": 1000 },
        { "name": "delivery_location", "type": "geolocation", "description": "Customer delivery coordinates" },
        { "name": "time_window", "type": "timestamp", "description": "Delivery time slot" }
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
        }
      ],
      "objective": {
        "type": "minimize",
        "field": "total_distance",
        "description": "Minimize total fleet distance traveled"
      }
    },
    "context": {
      "problemType": "vehicle_routing",
      "industry": "logistics",
      "environment": {
        "region": "New York Metro",
        "timezone": "EST"
      },
      "dataset": {
        "internalSources": ["delivery_db"],
        "externalEnrichment": ["traffic", "weather"]
      }
    },
    "protocol": {
      "steps": [
        { "action": "collect_data", "required": true },
        { "action": "enrich_data", "required": true },
        { "action": "build_model", "required": true },
        { "action": "solve_model", "required": true },
        { "action": "explain_solution", "required": true }
      ],
      "allowPartialSolutions": true,
      "explainabilityEnabled": true,
      "humanInTheLoop": { "required": true }
    },
    "version": "1.0.0",
    "created": "2024-04-25T12:00:00Z",
    "lastModified": "2024-04-25T12:30:00Z",
    "status": "pending"
  },
  {
    "sessionId": "workforce-scheduling-001",
    "model": {
      "variables": [
        { "name": "technician_skill", "type": "categorical", "description": "Skills like HVAC, Electrical, Plumbing" },
        { "name": "job_location", "type": "geolocation", "description": "Location of service job" },
        { "name": "availability", "type": "timestamp", "description": "Technician availability slots" }
      ],
      "constraints": [
        { "type": "skill_match", "description": "Technician must have required skills for a job", "operator": "in", "field": "technician_skill" },
        { "type": "travel_time_limit", "description": "Technicians should travel less than 1 hour between jobs", "operator": "lte", "field": "travel_time", "value": 60 }
      ],
      "objective": {
        "type": "maximize",
        "field": "jobs_completed",
        "description": "Maximize number of scheduled jobs"
      }
    },
    "context": {
      "problemType": "workforce_optimization",
      "industry": "field_service",
      "environment": {
        "region": "Los Angeles",
        "timezone": "PST"
      },
      "dataset": {
        "internalSources": ["technician_roster"],
        "externalEnrichment": ["traffic"]
      }
    },
    "protocol": {
      "steps": [
        { "action": "collect_data", "required": true },
        { "action": "build_model", "required": true },
        { "action": "solve_model", "required": true },
        { "action": "explain_solution", "required": true }
      ],
      "allowPartialSolutions": false,
      "explainabilityEnabled": true,
      "humanInTheLoop": { "required": false }
    },
    "version": "1.0.0",
    "created": "2024-04-24T10:00:00Z",
    "lastModified": "2024-04-24T10:20:00Z",
    "status": "completed"
  }
];

export default function MCPExamples({ onSelectExample }: MCPExamplesProps) {
  return (
    <div className="space-y-4">
      {examples.map((example) => (
        <div
          key={example.sessionId}
          className="rounded-lg overflow-hidden bg-[#161B22]"
        >
          <div
            onClick={() => onSelectExample(example)}
            className="p-4 hover:bg-[#21262D] cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#58A6FF] font-medium">{example.context.problemType}</p>
              <span className={`text-xs px-2 py-1 rounded ${
                example.status === 'completed' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'
              }`}>
                {example.status}
              </span>
            </div>
            <p className="text-[#8B949E] text-sm mb-2">{example.model.objective.description}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#8B949E]">{example.context.industry}</span>
              <span className="text-[#8B949E]">•</span>
              <span className="text-[#8B949E]">{example.context.environment.region}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 