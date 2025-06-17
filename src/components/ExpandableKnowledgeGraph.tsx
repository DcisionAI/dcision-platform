import React, { useState, useCallback } from 'react';
import VisNetworkGraph, { VisNode, VisEdge } from './VisNetworkGraph';

// Mock hierarchical knowledge graph data
const fullGraph = {
  nodes: [
    { id: 'root', label: 'Construction', group: 'domain' },
    { id: 'safety', label: 'Safety', group: 'domain', parent: 'root' },
    { id: 'planning', label: 'Planning', group: 'domain', parent: 'root' },
    { id: 'osha', label: 'OSHA', group: 'source', parent: 'safety' },
    { id: 'falls', label: 'Falls', group: 'risk', parent: 'safety' },
    { id: 'pmbok', label: 'PMBOK', group: 'source', parent: 'planning' },
    { id: 'budget', label: 'Budget', group: 'domain', parent: 'root' },
    { id: 'budget2024', label: 'Budget 2024', group: 'source', parent: 'budget' },
  ],
  edges: [
    { from: 'root', to: 'safety' },
    { from: 'root', to: 'planning' },
    { from: 'root', to: 'budget' },
    { from: 'safety', to: 'osha' },
    { from: 'safety', to: 'falls' },
    { from: 'planning', to: 'pmbok' },
    { from: 'budget', to: 'budget2024' },
  ]
};

const ExpandableKnowledgeGraph: React.FC = () => {
  // Start with only the root node visible
  const [visibleNodeIds, setVisibleNodeIds] = useState(['root']);

  // Compute visible nodes/edges
  const visibleNodes: VisNode[] = fullGraph.nodes.filter(n => visibleNodeIds.includes(n.id));
  const visibleEdges: VisEdge[] = fullGraph.edges.filter(
    e => visibleNodeIds.includes(e.from) && visibleNodeIds.includes(e.to)
  );

  // On node click, expand its children
  const handleNodeClick = useCallback((params: any) => {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      const children = fullGraph.nodes.filter(n => n.parent === nodeId).map(n => n.id);
      setVisibleNodeIds(ids => Array.from(new Set([...ids, ...children])));
    }
  }, []);

  const options = {
    groups: {
      domain: { color: { background: '#8884d8', border: '#8884d8' }, font: { color: '#fff' } },
      source: { color: { background: '#82ca9d', border: '#82ca9d' }, font: { color: '#fff' } },
      risk: { color: { background: '#ff8042', border: '#ff8042' }, font: { color: '#fff' } },
    },
    layout: { hierarchical: false },
    physics: { enabled: true },
    interaction: { hover: true, tooltipDelay: 200 },
  };

  return (
    <VisNetworkGraph
      nodes={visibleNodes}
      edges={visibleEdges}
      options={options}
      style={{ height: 400 }}
      onNodeClick={handleNodeClick}
    />
  );
};

export default ExpandableKnowledgeGraph; 