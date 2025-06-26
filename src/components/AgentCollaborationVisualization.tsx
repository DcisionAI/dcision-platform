import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useTheme } from './layout/ThemeContext';

interface AgentNode {
  id: string;
  name: string;
  type: 'intent' | 'data' | 'model' | 'solver' | 'explain' | 'coordinator';
  status: 'idle' | 'processing' | 'completed' | 'error';
  position: { x: number; y: number };
  lastMessage?: string;
  timestamp?: string;
}

interface MessageLink {
  source: string;
  target: string;
  type: string;
  timestamp: string;
  payload?: any;
  status: 'pending' | 'sent' | 'received' | 'error';
}

interface AgentCollaborationVisualizationProps {
  sessionId?: string;
  agentInteractions?: any[];
  progressEvents?: any[];
  timestamps?: any;
  intent?: any;
}

const AgentCollaborationVisualization: React.FC<AgentCollaborationVisualizationProps> = ({
  sessionId,
  agentInteractions = [],
  progressEvents = [],
  timestamps,
  intent
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Define agent nodes with fixed positions for a clean layout
  const agentNodes: AgentNode[] = [
    {
      id: 'coordinator',
      name: 'Coordinator',
      type: 'coordinator',
      status: 'idle',
      position: { x: 400, y: 50 }
    },
    {
      id: 'intent',
      name: 'Intent Agent',
      type: 'intent',
      status: 'idle',
      position: { x: 200, y: 150 }
    },
    {
      id: 'data',
      name: 'Data Agent',
      type: 'data',
      status: 'idle',
      position: { x: 200, y: 250 }
    },
    {
      id: 'model',
      name: 'Model Builder',
      type: 'model',
      status: 'idle',
      position: { x: 200, y: 350 }
    },
    {
      id: 'solver',
      name: 'Solver Agent',
      type: 'solver',
      status: 'idle',
      position: { x: 200, y: 450 }
    },
    {
      id: 'explain',
      name: 'Explain Agent',
      type: 'explain',
      status: 'idle',
      position: { x: 200, y: 550 }
    }
  ];

  // Generate message flow based on agent interactions and progress events
  const generateMessageFlow = (): MessageLink[] => {
    const messages: MessageLink[] = [];
    let timestamp = 0;

    // If we have real agent interactions, use them
    if (agentInteractions.length > 0) {
      agentInteractions.forEach((interaction, index) => {
        messages.push({
          source: interaction.from || 'coordinator',
          target: interaction.to || 'unknown',
          type: interaction.type || 'message',
          timestamp: new Date(timestamp).toISOString(),
          status: 'sent',
          payload: interaction.content
        });
        timestamp += 1000;
      });
      return messages;
    }

    // If we have progress events, generate flow from them
    if (progressEvents.length > 0) {
      const agentOrder = ['intent', 'data', 'model', 'solver', 'explain'];
      let currentAgentIndex = 0;

      progressEvents.forEach((event, index) => {
        const agentName = event.step?.toLowerCase().replace(/\s+/g, '_') || 
                         event.message?.toLowerCase().replace(/\s+/g, '_') || 
                         agentOrder[currentAgentIndex % agentOrder.length];
        
        if (currentAgentIndex < agentOrder.length - 1) {
          messages.push({
            source: agentOrder[currentAgentIndex],
            target: agentOrder[currentAgentIndex + 1],
            type: `call_${agentOrder[currentAgentIndex + 1]}_agent`,
            timestamp: new Date(timestamp).toISOString(),
            status: 'sent'
          });
          timestamp += 1000;
        }
        currentAgentIndex++;
      });
      return messages;
    }

    // Fallback to default flow
    messages.push({
      source: 'coordinator',
      target: 'intent',
      type: 'call_intent_agent',
      timestamp: new Date(timestamp).toISOString(),
      status: 'sent'
    });
    timestamp += 1000;

    messages.push({
      source: 'intent',
      target: 'data',
      type: 'call_data_agent',
      timestamp: new Date(timestamp).toISOString(),
      status: 'sent'
    });
    timestamp += 1000;

    messages.push({
      source: 'data',
      target: 'model',
      type: 'call_model_builder',
      timestamp: new Date(timestamp).toISOString(),
      status: 'sent'
    });
    timestamp += 1000;

    messages.push({
      source: 'model',
      target: 'solver',
      type: 'call_solver_agent',
      timestamp: new Date(timestamp).toISOString(),
      status: 'sent'
    });
    timestamp += 1000;

    messages.push({
      source: 'solver',
      target: 'explain',
      type: 'call_explain_agent',
      timestamp: new Date(timestamp).toISOString(),
      status: 'sent'
    });

    return messages;
  };

  // Update agent statuses based on progress events and interactions
  const updateAgentStatuses = (): AgentNode[] => {
    const updatedNodes = [...agentNodes];
    
    // Update based on progress events
    progressEvents.forEach((event) => {
      const agentName = event.step?.toLowerCase().replace(/\s+/g, '_') || 
                       event.message?.toLowerCase().replace(/\s+/g, '_');
      
      const node = updatedNodes.find(n => 
        n.id === agentName || 
        n.name.toLowerCase().includes(agentName) ||
        agentName?.includes(n.id)
      );
      
      if (node) {
        if (event.message?.includes('completed') || event.message?.includes('success')) {
          node.status = 'completed';
        } else if (event.message?.includes('error') || event.message?.includes('failed')) {
          node.status = 'error';
        } else {
          node.status = 'processing';
        }
        node.lastMessage = event.message;
        node.timestamp = event.timestamp;
      }
    });

    // Update based on agent interactions
    agentInteractions.forEach((interaction) => {
      const sourceNode = updatedNodes.find(n => n.id === interaction.from);
      const targetNode = updatedNodes.find(n => n.id === interaction.to);
      
      if (sourceNode) {
        sourceNode.status = 'processing';
        sourceNode.lastMessage = interaction.content;
      }
      
      if (targetNode) {
        targetNode.status = 'processing';
        targetNode.lastMessage = interaction.content;
      }
    });

    return updatedNodes;
  };

  const messageFlow = generateMessageFlow();
  const dynamicAgentNodes = updateAgentStatuses();

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 650;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create gradient definitions
    const defs = svg.append('defs');

    // Message flow gradient
    const messageGradient = defs.append('linearGradient')
      .attr('id', 'messageGradient')
      .attr('gradientUnits', 'userSpaceOnUse');

    messageGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3B82F6')
      .attr('stop-opacity', 0.8);

    messageGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10B981')
      .attr('stop-opacity', 0.8);

    // Agent node gradients
    const agentGradients = {
      idle: defs.append('radialGradient').attr('id', 'idleGradient'),
      processing: defs.append('radialGradient').attr('id', 'processingGradient'),
      completed: defs.append('radialGradient').attr('id', 'completedGradient'),
      error: defs.append('radialGradient').attr('id', 'errorGradient')
    };

    // Define gradient colors
    const gradientColors = {
      idle: { inner: '#6B7280', outer: '#374151' },
      processing: { inner: '#3B82F6', outer: '#1D4ED8' },
      completed: { inner: '#10B981', outer: '#059669' },
      error: { inner: '#EF4444', outer: '#DC2626' }
    };

    Object.entries(agentGradients).forEach(([status, gradient]) => {
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', gradientColors[status as keyof typeof gradientColors].inner);
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', gradientColors[status as keyof typeof gradientColors].outer);
    });

    // Draw message flow paths
    const messagePaths = svg.selectAll('.message-path')
      .data(messageFlow)
      .enter()
      .append('path')
      .attr('class', 'message-path')
      .attr('stroke', 'url(#messageGradient)')
      .attr('stroke-width', 3)
      .attr('fill', 'none')
      .attr('opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)');

    // Create arrow marker
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#3B82F6');

    // Update path positions
    messagePaths.attr('d', (d: MessageLink) => {
      const source = dynamicAgentNodes.find(n => n.id === d.source);
      const target = dynamicAgentNodes.find(n => n.id === d.target);
      if (!source || !target) return '';
      
      return `M${source.position.x},${source.position.y} L${target.position.x},${target.position.y}`;
    });

    // Draw agent nodes
    const nodes = svg.selectAll('.agent-node')
      .data(dynamicAgentNodes)
      .enter()
      .append('g')
      .attr('class', 'agent-node')
      .attr('transform', (d: AgentNode) => `translate(${d.position.x}, ${d.position.y})`);

    // Agent circles
    nodes.append('circle')
      .attr('r', 30)
      .attr('fill', (d: AgentNode) => `url(#${d.status}Gradient)`)
      .attr('stroke', theme === 'dark' ? '#374151' : '#E5E7EB')
      .attr('stroke-width', 2)
      .attr('class', 'agent-circle')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d: AgentNode) {
        setHoveredNode(d.id);
        d3.select(this)
          .attr('stroke', '#3B82F6')
          .attr('stroke-width', 4)
          .attr('r', 35);
      })
      .on('mouseout', function(event, d: AgentNode) {
        setHoveredNode(null);
        d3.select(this)
          .attr('stroke', theme === 'dark' ? '#374151' : '#E5E7EB')
          .attr('stroke-width', 2)
          .attr('r', 30);
      })
      .on('click', function(event, d: AgentNode) {
        setSelectedNode(selectedNode === d.id ? null : d.id);
        if (selectedNode === d.id) {
          d3.select(this)
            .attr('stroke', theme === 'dark' ? '#374151' : '#E5E7EB')
            .attr('stroke-width', 2);
        } else {
          d3.select(this)
            .attr('stroke', '#10B981')
            .attr('stroke-width', 4);
        }
      });

    // Agent icons
    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text((d: AgentNode) => {
        const icons = {
          coordinator: '🎯',
          intent: '🧠',
          data: '📊',
          model: '🏗️',
          solver: '🔧',
          explain: '💡'
        };
        return icons[d.type];
      });

    // Agent labels
    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 50)
      .attr('fill', theme === 'dark' ? '#D1D5DB' : '#374151')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .text((d: AgentNode) => d.name);

    // Status indicators
    nodes.append('circle')
      .attr('r', 6)
      .attr('cx', 25)
      .attr('cy', -25)
      .attr('fill', (d: AgentNode) => {
        switch (d.status) {
          case 'processing': return '#3B82F6';
          case 'completed': return '#10B981';
          case 'error': return '#EF4444';
          default: return '#6B7280';
        }
      })
      .attr('class', 'status-indicator');

    // Add pulsing animation for processing agents
    nodes.filter((d: AgentNode) => d.status === 'processing')
      .select('.agent-circle')
      .style('animation', 'pulse 2s infinite');

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
      .message-path {
        stroke-dasharray: 5,5;
        animation: flow 3s linear infinite;
      }
      @keyframes flow {
        0% { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: 10; }
      }
    `;
    document.head.appendChild(style);

    // Add message flow animation
    const animateMessageFlow = () => {
      let currentMessageIndex = 0;
      
      const animateNextMessage = () => {
        if (currentMessageIndex >= messageFlow.length) {
          currentMessageIndex = 0;
          setTimeout(animateNextMessage, 2000);
          return;
        }

        const message = messageFlow[currentMessageIndex];
        const source = dynamicAgentNodes.find(n => n.id === message.source);
        const target = dynamicAgentNodes.find(n => n.id === message.target);

        if (source && target) {
          // Update agent statuses
          svg.selectAll('.agent-node')
            .filter((d: any) => (d as AgentNode).id === message.source)
            .select('.agent-circle')
            .attr('fill', 'url(#processingGradient)');

          svg.selectAll('.agent-node')
            .filter((d: any) => (d as AgentNode).id === message.target)
            .select('.agent-circle')
            .attr('fill', 'url(#processingGradient)');

          // Animate message flow
          const messagePath = svg.selectAll('.message-path')
            .filter((d: any) => (d as MessageLink).source === message.source && (d as MessageLink).target === message.target);

          messagePath
            .attr('opacity', 1)
            .attr('stroke-width', 5)
            .transition()
            .duration(1000)
            .attr('opacity', 0.6)
            .attr('stroke-width', 3);

          // Update status indicators
          setTimeout(() => {
            svg.selectAll('.agent-node')
              .filter((d: any) => (d as AgentNode).id === message.source)
              .select('.agent-circle')
              .attr('fill', 'url(#completedGradient)');

            svg.selectAll('.agent-node')
              .filter((d: any) => (d as AgentNode).id === message.target)
              .select('.agent-circle')
              .attr('fill', 'url(#completedGradient)');
          }, 500);

          currentMessageIndex++;
          setTimeout(animateNextMessage, 1500);
        }
      };

      animateNextMessage();
    };

    // Start animation
    animateMessageFlow();

    // Add tooltips
    const tooltip = svg.append('g')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    tooltip.append('rect')
      .attr('width', 200)
      .attr('height', 80)
      .attr('fill', theme === 'dark' ? '#1F2937' : '#FFFFFF')
      .attr('stroke', theme === 'dark' ? '#374151' : '#E5E7EB')
      .attr('rx', 8);

    tooltip.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('fill', theme === 'dark' ? '#D1D5DB' : '#374151')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('');

    tooltip.append('text')
      .attr('x', 10)
      .attr('y', 35)
      .attr('fill', theme === 'dark' ? '#9CA3AF' : '#6B7280')
      .attr('font-size', '10px')
      .text('');

    tooltip.append('text')
      .attr('x', 10)
      .attr('y', 50)
      .attr('fill', theme === 'dark' ? '#9CA3AF' : '#6B7280')
      .attr('font-size', '10px')
      .text('');

    // Show tooltip on hover
    nodes.on('mouseover', function(event, d: AgentNode) {
      const tooltip = svg.select('.tooltip');
      const tooltipTexts = tooltip.selectAll('text');
      
      const textNodes = tooltipTexts.nodes() as SVGTextElement[];
      if (textNodes[0]) textNodes[0].textContent = d.name;
      if (textNodes[1]) textNodes[1].textContent = `Status: ${d.status}`;
      if (textNodes[2]) textNodes[2].textContent = d.lastMessage ? `Last: ${d.lastMessage.substring(0, 30)}...` : 'No recent activity';
      
      tooltip
        .style('opacity', 1)
        .attr('transform', `translate(${event.pageX - 100}, ${event.pageY - 100})`);
    })
    .on('mouseout', function() {
      svg.select('.tooltip')
        .style('opacity', 0);
    });

    // Add message path interactions
    messagePaths
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d: MessageLink) {
        d3.select(this)
          .attr('stroke-width', 6)
          .attr('opacity', 1);
      })
      .on('mouseout', function(event, d: MessageLink) {
        d3.select(this)
          .attr('stroke-width', 3)
          .attr('opacity', 0.6);
      })
      .on('click', function(event, d: MessageLink) {
        // Highlight connected nodes
        svg.selectAll('.agent-node')
          .select('.agent-circle')
          .attr('stroke', theme === 'dark' ? '#374151' : '#E5E7EB')
          .attr('stroke-width', 2);

        svg.selectAll('.agent-node')
          .filter((n: any) => (n as AgentNode).id === d.source || (n as AgentNode).id === d.target)
          .select('.agent-circle')
          .attr('stroke', '#F59E0B')
          .attr('stroke-width', 4);
      });

    // Cleanup
    return () => {
      document.head.removeChild(style);
    };
  }, [dynamicAgentNodes, messageFlow, theme]);

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          🤖 Agent Collaboration Flow
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Idle</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Processing</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Completed</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[600px] bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 800 650"
          className="w-full h-full"
        />
      </div>

      {/* Message Flow Timeline */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          📊 Message Flow Timeline
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {messageFlow.map((message, index) => (
            <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {message.source} → {message.target}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {message.type}
              </span>
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Performance Metrics */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Active Agents</p>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
            {dynamicAgentNodes.filter(n => n.status === 'processing').length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Completed</p>
          <p className="text-lg font-bold text-green-900 dark:text-green-100">
            {dynamicAgentNodes.filter(n => n.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Selected Agent Details */}
      {selectedNode && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            📋 Selected Agent: {dynamicAgentNodes.find(n => n.id === selectedNode)?.name}
          </h4>
          <div className="space-y-1 text-xs">
            <p className="text-yellow-700 dark:text-yellow-300">
              Status: <span className="font-medium">{dynamicAgentNodes.find(n => n.id === selectedNode)?.status}</span>
            </p>
            {dynamicAgentNodes.find(n => n.id === selectedNode)?.lastMessage && (
              <p className="text-yellow-700 dark:text-yellow-300">
                Last Activity: <span className="font-medium">{dynamicAgentNodes.find(n => n.id === selectedNode)?.lastMessage}</span>
              </p>
            )}
            {dynamicAgentNodes.find(n => n.id === selectedNode)?.timestamp && (
              <p className="text-yellow-700 dark:text-yellow-300">
                Timestamp: <span className="font-medium">{new Date(dynamicAgentNodes.find(n => n.id === selectedNode)?.timestamp || '').toLocaleTimeString()}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Session Info */}
      {sessionId && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Session ID: {sessionId}
          </p>
          {timestamps && (
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Duration: {timestamps.duration}ms
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentCollaborationVisualization; 