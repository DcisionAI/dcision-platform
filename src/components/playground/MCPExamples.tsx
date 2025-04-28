import React from 'react';
import { MCP } from '@/mcp/MCPTypes';

interface MCPExamplesProps {
  onSelect: (example: MCP) => void;
}

export const MCPExamples: React.FC<MCPExamplesProps> = ({ onSelect }) => {
  const example: MCP = {
    id: 'example-1',
    sessionId: 'example-1',
    version: '1.0',
    status: 'pending',
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    model: {
      variables: [
        {
          name: 'location',
          type: 'object',
          description: 'Location coordinates',
          metadata: {
            properties: {
              lat: 'number',
              lng: 'number'
            }
          }
        },
        {
          name: 'timestamp',
          type: 'datetime',
          description: 'Event timestamp'
        }
      ],
      constraints: [
        {
          type: 'distance',
          description: 'Maximum distance constraint',
          operator: 'lte',
          field: 'distance',
          value: 100,
          priority: 'must'
        },
        {
          type: 'time_window',
          description: 'Delivery time window',
          operator: 'between',
          field: 'delivery_time',
          value: {
            start: '09:00',
            end: '17:00'
          },
          priority: 'should'
        }
      ],
      objective: {
        type: 'minimize',
        field: 'total_distance',
        description: 'Minimize total distance traveled',
        weight: 1
      }
    },
    context: {
      environment: {
        region: 'US-East',
        timezone: 'America/New_York'
      },
      dataset: {
        internalSources: ['vehicles', 'orders'],
        dataQuality: 'good',
        requiredFields: ['location', 'timestamp']
      },
      problemType: 'vehicle_routing',
      industry: 'logistics'
    },
    protocol: {
      steps: [
        {
          id: 'step1',
          action: 'collect_data',
          description: 'Collect vehicle and order data',
          required: true
        },
        {
          id: 'step2',
          action: 'enrich_data',
          description: 'Enrich with geolocation data',
          required: true
        },
        {
          id: 'step3',
          action: 'build_model',
          description: 'Build optimization model',
          required: true
        },
        {
          id: 'step4',
          action: 'solve_model',
          description: 'Solve routing problem',
          required: true
        },
        {
          id: 'step5',
          action: 'explain_solution',
          description: 'Generate solution explanation',
          required: true
        }
      ]
    },
    metadata: {
      solver: 'or_tools',
      timeLimit: 600,
      solutionGap: 1
    }
  };

  return (
    <div>
      <h3>Example MCPs</h3>
      <button onClick={() => onSelect(example)}>Load Example 1</button>
    </div>
  );
}; 