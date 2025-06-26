import React, { useState } from 'react';
import { useTheme } from './layout/ThemeContext';
import Tree from 'react-d3-tree';

// Mock tree data
const mockTreeData = {
  name: 'Project Type',
  value: 'construction',
  children: [
    {
      name: 'Project Size',
      value: 'large',
      children: [
        { name: 'Budget', value: '$2M+' },
        { name: 'Timeline', value: '12+ months' },
      ],
    },
    {
      name: 'Complexity',
      value: 'high',
      children: [
        { name: 'Resources', value: 'specialized' },
        { name: 'Risks', value: 'high' },
      ],
    },
  ],
};

const DecisionTreeGraph: React.FC = () => {
  const { theme } = useTheme();
  const [treeData] = useState(mockTreeData);

  const nodeSize = { x: 200, y: 100 };
  const separation = { siblings: 1.5, nonSiblings: 2 };

  const getNodeColor = (node: any) => {
    if (node.children) {
      return theme === 'dark' ? '#3b82f6' : '#2563eb';
    }
    return theme === 'dark' ? '#10b981' : '#059669';
  };

  const getTextColor = () => {
    return theme === 'dark' ? '#f3f4f6' : '#1f2937';
  };

  const getLinkColor = () => {
    return theme === 'dark' ? '#6b7280' : '#9ca3af';
  };

  const renderCustomNode = ({ nodeDatum, toggleNode }: any) => (
    <g>
      <circle
        r={15}
        fill={getNodeColor(nodeDatum)}
        stroke={theme === 'dark' ? '#4b5563' : '#d1d5db'}
        strokeWidth={2}
        style={{ cursor: nodeDatum.children ? 'pointer' : 'default' }}
        onClick={nodeDatum.children ? toggleNode : undefined}
      />
      <text
        dy={-20}
        x={0}
        textAnchor="middle"
        fontSize={12}
        fontFamily="Inter, Arial, sans-serif"
        fill={getTextColor()}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {nodeDatum.name}
      </text>
      {nodeDatum.value && (
        <text
          dy={20}
          x={0}
          textAnchor="middle"
          fontSize={10}
          fill={theme === 'dark' ? '#9ca3af' : '#6b7280'}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {nodeDatum.value}
        </text>
      )}
    </g>
  );

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full h-[500px] bg-docs-section dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
        <Tree
          data={treeData}
          nodeSize={nodeSize}
          separation={separation}
          renderCustomNodeElement={renderCustomNode}
          pathClassFunc={() => 'tree-link'}
          translate={{ x: 400, y: 50 }}
          orientation="vertical"
          collapsible={true}
          zoomable={true}
          draggable={true}
          svgClassName="tree-svg"
          pathFunc="step"
        />
      </div>
    </div>
  );
};

export default DecisionTreeGraph; 