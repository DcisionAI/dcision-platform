import React from 'react';
import { MCP } from '@/mcp/MCPTypes';

interface PlaygroundSettingsProps {
  config: MCP;
  onConfigChange: (config: MCP) => void;
}

export default function PlaygroundSettings({ config, onConfigChange }: PlaygroundSettingsProps) {
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onConfigChange({
      ...config,
      metadata: {
        ...config.metadata,
        solver: e.target.value
      }
    });
  };

  const handleTimeLimit = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({
      ...config,
      metadata: {
        ...config.metadata,
        timeLimit: parseInt(e.target.value)
      }
    });
  };

  const handleGap = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({
      ...config,
      metadata: {
        ...config.metadata,
        solutionGap: parseFloat(e.target.value)
      }
    });
  };

  return (
    <div className="playground-settings">
      <h2 className="playground-section-title">Settings</h2>
      
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Model Parameters</h3>
        <select 
          className="playground-select"
          value={config.metadata?.solver || 'or_tools'}
          onChange={handleModelChange}
        >
          <option value="or_tools">OR-Tools</option>
          <option value="cplex">CPLEX</option>
          <option value="gurobi">Gurobi</option>
        </select>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Optimization Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Time Limit (seconds)</label>
            <input 
              type="number" 
              className="playground-input"
              value={config.metadata?.timeLimit || 600}
              onChange={handleTimeLimit}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Solution Gap (%)</label>
            <input 
              type="number" 
              className="playground-input"
              value={config.metadata?.solutionGap || 1}
              step={0.1}
              onChange={handleGap}
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Agent Configuration</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" />
            <span className="text-sm">Data Collection Agent</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" />
            <span className="text-sm">Optimization Agent</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" />
            <span className="text-sm">Explainability Agent</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Protocol Steps</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" />
            <span className="text-sm">Validate Constraints</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" />
            <span className="text-sm">Human Review</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" />
            <span className="text-sm">Generate Explanations</span>
          </label>
        </div>
      </div>
    </div>
  );
} 