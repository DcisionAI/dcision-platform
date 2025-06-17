import React, { useEffect, useRef } from 'react';
import { DataSet, Network } from 'vis-network/standalone/esm/vis-network';

export type VisNode = { id: string; label: string; group?: string };
export type VisEdge = { from: string; to: string };

interface VisNetworkGraphProps {
  nodes: VisNode[];
  edges: VisEdge[];
  options?: any;
  style?: React.CSSProperties;
  onNodeClick?: (params: any) => void;
}

const VisNetworkGraph: React.FC<VisNetworkGraphProps> = ({ nodes, edges, options, style, onNodeClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const data = {
        nodes: new DataSet(nodes),
        edges: new DataSet(edges),
      };
      const network = new Network(containerRef.current, data, options);
      if (onNodeClick) {
        network.on('click', onNodeClick);
      }
      networkRef.current = network;
      return () => network.destroy();
    }
  }, [nodes, edges, options, onNodeClick]);

  return <div ref={containerRef} style={{ width: '100%', height: 400, ...style }} />;
};

export default VisNetworkGraph; 