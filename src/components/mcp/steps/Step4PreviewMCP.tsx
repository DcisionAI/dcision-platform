import React, { useState } from 'react';
import { assembleMCP } from '@/components/mcp/assembleMCP';
import { MCP } from '../../../pages/api/_lib/mcp/MCPTypes';
import Button from '@/components/ui/Button';
import { apiFetch } from '@/utils/apiFetch';

export interface Step4PreviewMCPProps {
  sessionId: string;
  intent: any;
  enrichedData: any;
  modelDef: any;
  environment: any;
  dataset: any;
  protocolSteps: any[];
  industry?: string;
  version?: string;
  status?: string;
  onSubmitSuccess?: (solverResponse: any) => void;
}

const Step4PreviewMCP: React.FC<Step4PreviewMCPProps> = ({
  sessionId,
  intent,
  enrichedData,
  modelDef,
  environment,
  dataset,
  protocolSteps,
  industry = 'logistics',
  version = '1.0.0',
  status = 'pending',
  onSubmitSuccess,
}) => {
  const [response, setResponse] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  // For quick testing, use a hardcoded MCP config instead of dynamic assembly
  // const mcp: MCP = assembleMCP({ sessionId, intent, enrichedData, modelDef, environment, dataset, protocolSteps, industry, version, status });
  const mcp: MCP = {
    "id": "vrp-001",
    "sessionId": "vrp-session-001",
    "version": "1.0",
    "created": "2024-06-01T12:00:00Z",
    "lastModified": "2024-06-01T12:00:00Z",
    "status": "pending",
    "model": {
      "name": "VRP with 5 Vehicles (Expression-Based)",
      "description": "Minimize travel cost for 5 vehicles covering 1 customer, 1 depot",
      "variables": [
        { name: "x_0_0_1", type: "number", description: "" },
        { name: "x_0_1_0", type: "number", description: "" },
        { name: "x_1_0_1", type: "number", description: "" },
        { name: "x_1_1_0", type: "number", description: "" },
        { name: "x_2_0_1", type: "number", description: "" },
        { name: "x_2_1_0", type: "number", description: "" },
        { name: "x_3_0_1", type: "number", description: "" },
        { name: "x_3_1_0", type: "number", description: "" },
        { name: "x_4_0_1", type: "number", description: "" },
        { name: "x_4_1_0", type: "number", description: "" }
      ],
      "constraints": [
        {
          type: "assignment",
          description: "",
          operator: "eq",
          field: "x_0_0_1 + x_1_0_1 + x_2_0_1 + x_3_0_1 + x_4_0_1",
          value: 1,
          priority: "must"
        },
        {
          type: "assignment",
          description: "",
          operator: "eq",
          field: "x_0_1_0 + x_1_1_0 + x_2_1_0 + x_3_1_0 + x_4_1_0",
          value: 1,
          priority: "must"
        }
      ],
      "objective": {
        type: "minimize",
        field: "5*x_0_0_1 + 5*x_0_1_0 + 5*x_1_0_1 + 5*x_1_1_0 + 5*x_2_0_1 + 5*x_2_1_0 + 5*x_3_0_1 + 5*x_3_1_0 + 5*x_4_0_1 + 5*x_4_1_0",
        description: "",
        weight: 1
      }
    },
    "context": {
      "problemType": "linear_programming",
      "industry": "fleetops",
      "environment": {
        "region": "local",
        "timezone": "UTC"
      },
      "dataset": { internalSources: [] }
    },
    "protocol": {
      "steps": [
        {
          "id": "solve_step",
          "action": "solve_model",
          "description": "Solve the VRP using expression-based MIP",
          "required": true
        }
      ],
      "allowPartialSolutions": false,
      "explainabilityEnabled": false,
      "humanInTheLoop": {
        "required": false
      }
    }
  } as MCP;

  /* const sampleMcp = {
    "sessionId": "simple-lp-session-001",
    "version": "1.0",
    "created": "2025-05-10T12:00:00Z",
    "lastModified": "2025-05-10T12:00:00Z",
    "status": "pending",
    "model": {
      "variables": [
        { "name": "x", "type": "continuous", "lower_bound": 0, "upper_bound": 10 },
        { "name": "y", "type": "continuous", "lower_bound": 0, "upper_bound": 10 }
      ],
      "constraints": [
        { "expression": "x + y", "operator": "<=", "rhs": 10 },
        { "expression": "x + -1*y", "operator": ">=", "rhs": 3 }
      ],
      "objective": {
        "expression": "2*x + 3*y",
        "type": "maximize"
      }
    },
    "context": {
      "problemType": "linear_programming",
      "industry": "test",
      "environment": { "region": "local", "timezone": "UTC" },
      "dataset": { "internalSources": [] }
    },
    "protocol": {
      "steps": [
        { "action": "solve_model", "required": true }
      ],
      "allowPartialSolutions": false,
      "explainabilityEnabled": false,
      "humanInTheLoop": { "required": false }
    }
  } */
  const mcpJson = JSON.stringify(mcp, null, 2);

  const handleSubmit = async () => {
    setSubmitting(true);
    setResponse(null);
    setSubmitStatus(null);
    try {
      // Map 'field' to 'expression' and 'value' to 'rhs' for constraints and objective for backend compatibility
      const payload = {
        ...mcp,
        model: {
          ...mcp.model,
          variables: mcp.model.variables.map((v: any) => ({
            ...v,
            lower: v.metadata?.properties?.lower ? Number(v.metadata.properties.lower) : 0,
            upper: v.metadata?.properties?.upper ? Number(v.metadata.properties.upper) : 1
          })),
          constraints: mcp.model.constraints.map((c: any) => {
            const { field, value, ...rest } = c;
            return { ...rest, expression: field, rhs: value };
          }),
          objective: (() => {
            const { field, ...rest } = mcp.model.objective;
            return { ...rest, expression: field };
          })()
        }
      };
      // Remove normalization for vehicles, tasks, and locations as they do not exist in this MCP
      // Normalize model.vehicles for external orchestrator
      
      // Determine MCP submit endpoint: use external base URL if provided, else local API
      const submitUrl = process.env.NEXT_PUBLIC_MCP_BASE_URL
        ? `${process.env.NEXT_PUBLIC_MCP_BASE_URL}/mcp/submit`
        : '/api/mcp/submit';
      const res = await apiFetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResponse(data);
      setSubmitStatus('success');
      if (onSubmitSuccess) onSubmitSuccess(data);
    } catch (e) {
      setResponse({ error: 'Failed to submit MCP to server.' });
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-docs-heading mb-2">Step 4: Preview MCP</h2>
      <div className="flex space-x-4 mb-2">
        <Button onClick={handleSubmit} disabled={submitting} variant="primary" size="sm">
          {submitting ? 'Submitting...' : 'Submit to MCP Server'}
        </Button>
        {submitStatus === 'success' && <span className="text-green-600 text-sm">Submitted successfully!</span>}
        {submitStatus === 'error' && <span className="text-red-600 text-sm">Submission failed.</span>}
      </div>
      <pre
        className="w-full bg-docs-section border border-docs-section-border p-4 rounded-lg shadow mb-4 text-docs-text text-sm whitespace-pre-wrap break-words overflow-auto"
        style={{ maxHeight: '400px' }}
      >
        {mcpJson}
      </pre>
      {response && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-1">MCP Server Response</h4>
          <pre className="bg-docs-section p-2 rounded text-xs overflow-x-auto">{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Step4PreviewMCP;