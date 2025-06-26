import React, { useState } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  ArrowRightIcon,
  CogIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';

interface FlowNode {
  id: string;
  type: 'intent' | 'data' | 'model' | 'solver' | 'explain';
  name: string;
  position: { x: number; y: number };
  config: Record<string, any>;
}

interface FlowConnection {
  id: string;
  from: string;
  to: string;
}

interface FlowBuilderProps {
  domain?: string;
}

export default function FlowBuilder({ domain = 'construction' }: FlowBuilderProps) {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<FlowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const nodeTypes = [
    { type: 'intent', name: 'Intent Analysis', color: 'bg-blue-500' },
    { type: 'data', name: 'Data Preparation', color: 'bg-green-500' },
    { type: 'model', name: 'Model Builder', color: 'bg-purple-500' },
    { type: 'solver', name: 'Solver', color: 'bg-orange-500' },
    { type: 'explain', name: 'Explain', color: 'bg-red-500' },
  ];

  const addNode = (type: FlowNode['type']) => {
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type,
      name: nodeTypes.find(n => n.type === type)?.name || type,
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      config: {}
    };
    setNodes([...nodes, newNode]);
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
  };

  const runFlow = () => {
    setIsRunning(true);
    // TODO: Implement flow execution logic
    setTimeout(() => setIsRunning(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-docs-section dark:bg-gray-800/50 border rounded-lg border-docs-section-border dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-docs-text dark:text-docs-dark-text">Flow Builder</h3>
          <div className="flex items-center space-x-2">
            {nodeTypes.map((nodeType) => (
              <button
                key={nodeType.type}
                onClick={() => addNode(nodeType.type as FlowNode['type'])}
                className={`px-3 py-1.5 rounded-md text-white text-sm font-medium transition-colors ${nodeType.color} hover:opacity-80`}
              >
                <PlusIcon className="w-4 h-4 inline mr-1" />
                {nodeType.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={runFlow}
            disabled={isRunning || nodes.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isRunning ? (
              <>
                <PauseIcon className="w-4 h-4" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4" />
                <span>Run Flow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="relative h-96 bg-docs-section dark:bg-gray-800/50 border rounded-lg border-docs-section-border dark:border-gray-700 overflow-hidden">
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <CogIcon className="w-12 h-12 mx-auto text-docs-muted dark:text-docs-dark-muted mb-4" />
              <p className="text-docs-muted dark:text-docs-dark-muted">
                Add nodes to start building your workflow
              </p>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            {/* Render connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {connections.map((connection) => {
                const fromNode = nodes.find(n => n.id === connection.from);
                const toNode = nodes.find(n => n.id === connection.to);
                if (!fromNode || !toNode) return null;
                
                return (
                  <line
                    key={connection.id}
                    x1={fromNode.position.x + 100}
                    y1={fromNode.position.y + 30}
                    x2={toNode.position.x}
                    y2={toNode.position.y + 30}
                    stroke="#6B7280"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
                </marker>
              </defs>
            </svg>

            {/* Render nodes */}
            {nodes.map((node) => {
              const nodeType = nodeTypes.find(n => n.type === node.type);
              return (
                <div
                  key={node.id}
                  className={`absolute p-3 rounded-lg border-2 cursor-move ${
                    selectedNode === node.id 
                      ? 'border-blue-500 shadow-lg' 
                      : 'border-docs-section-border dark:border-gray-700'
                  }`}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                    backgroundColor: 'var(--docs-section)',
                    minWidth: '120px'
                  }}
                  onClick={() => setSelectedNode(node.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${nodeType?.color}`} />
                      <span className="text-sm font-medium text-docs-text dark:text-docs-dark-text">
                        {node.name}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                      className="text-red-500 hover:text-red-600 p-1"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <div className="p-4 bg-docs-section dark:bg-gray-800/50 border rounded-lg border-docs-section-border dark:border-gray-700">
          <h4 className="text-md font-semibold text-docs-text dark:text-docs-dark-text mb-4">
            Node Properties
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-docs-muted dark:text-docs-dark-muted mb-1">
                Node Type
              </label>
              <input
                type="text"
                value={nodes.find(n => n.id === selectedNode)?.name || ''}
                className="w-full px-3 py-2 border border-docs-section-border dark:border-gray-700 rounded-md bg-docs-bg dark:bg-docs-dark-bg text-docs-text dark:text-docs-dark-text"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-docs-muted dark:text-docs-dark-muted mb-1">
                Configuration
              </label>
              <textarea
                className="w-full px-3 py-2 border border-docs-section-border dark:border-gray-700 rounded-md bg-docs-bg dark:bg-docs-dark-bg text-docs-text dark:text-docs-dark-text"
                rows={4}
                placeholder="Add configuration parameters..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 