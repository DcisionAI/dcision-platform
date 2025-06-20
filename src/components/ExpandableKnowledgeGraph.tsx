import React, { useState, useCallback, useEffect } from 'react';
import VisNetworkGraph, { VisNode, VisEdge } from './VisNetworkGraph';

interface KnowledgeGraphData {
  nodes: VisNode[];
  edges: VisEdge[];
}

const ExpandableKnowledgeGraph: React.FC = () => {
  const [graphData, setGraphData] = useState<KnowledgeGraphData>({ nodes: [], edges: [] });
  const [visibleNodeIds, setVisibleNodeIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const response = await fetch('/api/rag/graph');
        if (!response.ok) {
          throw new Error('Failed to fetch knowledge graph data');
        }
        const data = await response.json();
        setGraphData(data);
        // Start with only root nodes visible
        const rootIds = data.nodes.filter((n: any) => !n.parent).map((n: any) => n.id);
        setVisibleNodeIds(rootIds);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGraphData();
  }, []);

  const visibleNodes: VisNode[] = graphData.nodes.filter(n => visibleNodeIds.includes(n.id));
  const visibleEdges: VisEdge[] = graphData.edges.filter(
    e => visibleNodeIds.includes(e.from) && visibleNodeIds.includes(e.to)
  );

  const handleNodeClick = useCallback((params: any) => {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      const children = graphData.nodes.filter((n: any) => n.parent === nodeId).map((n: any) => n.id);
      setVisibleNodeIds(ids => Array.from(new Set([...ids, ...children])));
    }
  }, [graphData.nodes]);

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
  
  if (isLoading) {
    return <div className="text-center py-8">Loading Knowledge Graph...</div>;
  }
  
  if (error) {
    return <div className="text-center py-8 text-red-500">Failed to load knowledge graph: {error}</div>;
  }

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